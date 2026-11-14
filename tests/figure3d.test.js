import test from 'node:test';
import assert from 'node:assert/strict';
import { UEBUNGEN } from '../js/data/exercises.js';
import { erstelleRig, spiegeln3d, vollePose3d, mischen3d, pose3dZurZeit, dauer3d } from '../js/figure3d.js';

const nah = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test('spiegeln3d ist umkehrbar und tauscht die Seiten', () => {
  const p = vollePose3d({ becken: { pos: [0.1, 0.2], rot: [10, 20, 5] }, brust: [5, 10, 15], schulterR: [90, 20, 5], knieL: 40, handgelenkR: 30 });
  assert.deepEqual(spiegeln3d(spiegeln3d(p)), p);
  const s = spiegeln3d(p);
  assert.deepEqual(s.schulterL, [90, 20, 5]);
  assert.equal(s.knieR, 40);
  assert.equal(s.handgelenkL, 30);
  assert.deepEqual(s.brust, [5, -10, -15]);
  assert.deepEqual(s.becken.pos, [-0.1, 0.2]);
});

test('mischen3d im Kreis nimmt den kürzeren Weg', () => {
  const a = vollePose3d({ schulterL: [350, 0, 0] });
  const b = vollePose3d({ schulterL: [10, 0, 0] });
  nah(((mischen3d(a, b, 0.5, true).schulterL[0] % 360) + 360) % 360, 0);
  nah(mischen3d(a, b, 0.5).schulterL[0], 180);
});

test('kreisen läuft nach der letzten Pose zur ersten weiter', () => {
  const anim = { modus: 'kreisen', zyklus: 4, posen: [0, 90, 180, 270].map((w) => vollePose3d({ schulterL: [w, 0, 0] })) };
  nah(((pose3dZurZeit(anim, 3.5).schulterL[0] % 360) + 360) % 360, 315);
});

test('jede Übung hat eine passende 3D-Animation', () => {
  for (const u of UEBUNGEN) {
    const a = u.animation3d;
    assert.ok(a, `${u.id}: keine 3D-Animation`);
    assert.ok(a.posen.length >= 2, `${u.id}: zu wenige Posen`);
    if (u.art === 'statisch') assert.equal(a.modus, 'halten', u.id);
    else assert.ok(['pendeln', 'kreisen'].includes(a.modus), `${u.id}: Modus ${a.modus}`);
    assert.ok(Array.isArray(a.kamera) && a.kamera.length === 2, `${u.id}: Kamera`);
    if (u.position === 'sitzend') assert.equal(a.requisit, 'stuhl', `${u.id}: Stuhl fehlt`);
  }
});

// Für jede Übung und jede Seite: über den ganzen Ablauf darf nichts im Boden
// versinken, die Figur steht auf dem Boden, und abgestützte Hände erreichen ihren Punkt.
for (const u of UEBUNGEN) {
  test(`3D-Ablauf ohne Fehler: ${u.id}`, () => {
    const a = u.animation3d;
    for (const seite of u.wechselseitig ? ['rechts', 'links'] : [null]) {
      const rig = erstelleRig(a, { seite });
      const dauer = dauer3d(a);
      const zeiten = [...Array.from({ length: 21 }, (_, k) => (dauer * k) / 20), rig.bildZeit];
      for (const t of zeiten) {
        const m = rig.messe(t);
        const wo = `${u.id} ${seite || ''} t=${t.toFixed(2)}`;
        for (const p of m.punkte) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), `${wo}: ungültige Zahl`);
        const koerper = Math.min(...m.punkte.filter((p) => !p.arm).map((p) => p.y));
        if (a.requisit === 'stuhl') assert.ok(koerper >= -0.012, `${wo}: Bein im Boden (${koerper.toFixed(3)})`);
        else assert.ok(Math.abs(koerper) < 0.002, `${wo}: steht nicht auf dem Boden (${koerper.toFixed(3)})`);
        const arme = Math.min(...m.punkte.filter((p) => p.arm).map((p) => p.y));
        assert.ok(arme >= -0.02, `${wo}: Arm im Boden (${arme.toFixed(3)})`);
        // Während des Übergangs in eine gehaltene Pose darf eine Hand kurz knapp über dem Boden schweben.
        const toleranz = a.modus === 'halten' && t > 0 && t < 2 ? 0.05 : 0.03;
        for (const [h, wert] of Object.entries(m.haende)) {
          assert.ok(wert.abstand < toleranz, `${wo}: ${h} erreicht den Boden nicht (${wert.abstand.toFixed(3)} m)`);
        }
        const breite = Math.max(...m.punkte.map((p) => Math.abs(p.x)), ...m.punkte.map((p) => Math.abs(p.z)));
        assert.ok(breite < 1.6, `${wo}: Figur läuft aus dem Bild`);
      }
    }
  });
}
