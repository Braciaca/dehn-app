# Dehnen

Eine installierbare Web-App für Dehn- und Mobilitätsübungen: 64 Übungen mit drehbarer 3D-Figur, eigene Routinen und ein Player mit Timer und Pieptönen. Die App besteht nur aus statischen Dateien und braucht keinen Build-Schritt.

Die 3D-Darstellung nutzt die Bibliothek three.js (MIT-Lizenz, siehe `vendor/three/LICENSE`). Auf Geräten ohne WebGL zeigt die App die einfache 2D-Figur.

## Am Laptop starten

Im Projektordner:

```bash
python -m http.server 8123
```

Dann im Browser `http://localhost:8123` öffnen. In Chrome oder Edge lässt sich die App über das Installieren-Symbol in der Adressleiste als eigenes Fenster installieren.

## Aufs Handy bringen

Damit Android die App installiert, offline startet und den Bildschirm anlässt, muss sie über **HTTPS** erreichbar sein. Am einfachsten ist eine kostenlose statische Seite, zum Beispiel GitHub Pages:

1. Auf github.com ein neues Repository anlegen.
2. Alle Dateien dieses Ordners hochladen (ohne `docs/` und `tests/`, wenn du magst).
3. Im Repository unter **Settings → Pages** als Quelle den Branch `main` und den Ordner `/ (root)` wählen.
4. Nach ein bis zwei Minuten ist die App unter `https://<name>.github.io/<repository>/` erreichbar.
5. Diese Adresse am Handy in Chrome öffnen und im Menü **App installieren** bzw. **Zum Startbildschirm hinzufügen** wählen.

Die Seite ist dann öffentlich abrufbar. Sie enthält nur die App selbst; deine Routinen liegen ausschließlich im Browser deines Geräts.

Zum schnellen Ausprobieren ohne Veröffentlichung kannst du am Handy im selben WLAN `http://<IP-des-Laptops>:8123` öffnen. Das funktioniert als normale Webseite, aber ohne Installation, ohne Offline-Betrieb und ohne „Bildschirm anlassen“.

## Routinen zwischen Geräten übertragen

Routinen werden pro Gerät gespeichert. Unter **Einstellungen** exportierst du sie als Datei und importierst sie auf dem anderen Gerät.

## Übungen ergänzen

Merkmale und Texte der Übungen stehen in `js/data/exercises.js`, die 3D-Posen in `js/data/poses3d.js` (die Bedeutung der Winkel steht am Anfang von `js/figure3d.js`). Die Höhe der Figur ergibt sich von selbst: Ihr tiefster Punkt steht auf dem Boden. Hände, die sich abstützen, werden automatisch auf den Boden gelegt.

Nach Änderungen prüfen die Tests, ob alle Merkmale gültig sind, nichts im Boden versinkt und abgestützte Hände den Boden erreichen:

```bash
node --test
```

Neue Dateien müssen zusätzlich in die Liste in `sw.js` eingetragen werden, sonst fehlen sie offline. Der Test meldet das.

## Icons neu erzeugen

```bash
python tools/make-icons.py
```
