"""Erzeugt die App-Icons als PNG, ohne Fremdbibliotheken.

Aufruf (im Projektordner):  python tools/make-icons.py
"""
import math
import os
import struct
import zlib

BG = (36, 112, 95)
FIGUR = (255, 253, 249)

# Figur in der Seitbeuge, Koordinaten im Feld 0..100.
KOPF = (58, 27, 7.5)
LINIEN = [
    ((50, 62), (56, 38), 7.0),   # Rumpf
    ((56, 38), (70, 24), 4.6),   # Arm über den Kopf
    ((70, 24), (80, 30), 4.6),
    ((54, 40), (40, 52), 4.6),   # hängender Arm
    ((50, 62), (42, 84), 5.2),   # Beine
    ((50, 62), (58, 84), 5.2),
]


def abstand_strecke(px, py, a, b):
    (ax, ay), (bx, by) = a, b
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def deckung(x, y, massstab):
    """Anteil 0..1, zu dem der Punkt von der Figur bedeckt ist (mit weichem Rand)."""
    d = math.hypot(x - KOPF[0], y - KOPF[1]) - KOPF[2]
    for a, b, halb in LINIEN:
        d = min(d, abstand_strecke(x, y, a, b) - halb)
    rand = 0.5 / massstab
    return max(0.0, min(1.0, 0.5 - d / (2 * rand)))


def png(pfad, groesse, rand_anteil, rund):
    massstab = groesse * (1 - 2 * rand_anteil) / 100
    versatz = groesse * rand_anteil
    radius = groesse * 0.22
    zeilen = bytearray()
    for py in range(groesse):
        zeilen.append(0)
        for px in range(groesse):
            alpha = 255
            if rund:
                cx = min(max(px + 0.5, radius), groesse - radius)
                cy = min(max(py + 0.5, radius), groesse - radius)
                aussen = math.hypot(px + 0.5 - cx, py + 0.5 - cy) - radius
                alpha = int(255 * max(0.0, min(1.0, 0.5 - aussen)))
            t = deckung((px + 0.5 - versatz) / massstab, (py + 0.5 - versatz) / massstab, massstab)
            farbe = [round(BG[i] + (FIGUR[i] - BG[i]) * t) for i in range(3)]
            zeilen.extend((*farbe, alpha))

    def block(typ, daten):
        return struct.pack('>I', len(daten)) + typ + daten + struct.pack('>I', zlib.crc32(typ + daten) & 0xFFFFFFFF)

    with open(pfad, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(block(b'IHDR', struct.pack('>IIBBBBB', groesse, groesse, 8, 6, 0, 0, 0)))
        f.write(block(b'IDAT', zlib.compress(bytes(zeilen), 9)))
        f.write(block(b'IEND', b''))


if __name__ == '__main__':
    ziel = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')
    os.makedirs(ziel, exist_ok=True)
    png(os.path.join(ziel, 'icon-192.png'), 192, 0.04, True)
    png(os.path.join(ziel, 'icon-512.png'), 512, 0.04, True)
    # Maskable: vollflächiger Hintergrund, Figur in der sicheren Mitte.
    png(os.path.join(ziel, 'icon-maskable-512.png'), 512, 0.16, False)
    print('Icons geschrieben nach', os.path.normpath(ziel))
