import test from 'node:test';
import assert from 'node:assert/strict';
import { STAND, BODEN_Y, gelenke, mischen, spiegeln, poseZurZeit, vollePose, erden } from '../js/figure.js';

const nah = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);
const alleZahlen = (o) => Object.values(o).flat(2).every((v) => Number.isFinite(v));

test('Standpose: Kopf über Schulter über Hüfte, Füße am Boden', () => {
  const g = gelenke(STAND, 'seite');
  assert.ok(g.head[1] < g.shoulder[1] && g.shoulder[1] < g.hip[1]);
  nah(g.ankleN[1], BODEN_Y, 1);
  nah(g.ankleF[1], BODEN_Y, 1);
  assert.ok(alleZahlen(g));
});

test('Frontansicht: Schultern und Hüften liegen nebeneinander', () => {
  const g = gelenke(STAND, 'front');
  assert.ok(g.shoulderN[0] < g.shoulderF[0]);
  assert.ok(g.hipN[0] < g.hipF[0]);
  nah(g.shoulderN[1], g.shoulderF[1]);
});

test('mischen', () => {
  const a = vollePose({ torso: 0, armN: [180, 180] });
  const b = vollePose({ torso: 40, armN: [90, 60], hip: [140, 120] });
  assert.deepEqual(mischen(a, b, 0), a);
  assert.deepEqual(mischen(a, b, 1), b);
  const m = mischen(a, b, 0.5);
  nah(m.torso, 20); nah(m.armN[0], 135); nah(m.armN[1], 120); nah(m.hip[0], 130);
});

test('mischen im Kreis nimmt den kurzen Weg', () => {
  const a = vollePose({ armN: [350, 350] });
  const b = vollePose({ armN: [10, 10] });
  const m = mischen(a, b, 0.5, true);
  nah(((m.armN[0] % 360) + 360) % 360, 0);
});

test('spiegeln ist umkehrbar und tauscht die Seiten', () => {
  const p = vollePose({ torso: 12, armN: [90, 45], legF: [200, 230], hip: [100, 110] });
  for (const ansicht of ['seite', 'front']) {
    assert.deepEqual(spiegeln(spiegeln(p, ansicht), ansicht), p);
  }
  assert.deepEqual(spiegeln(p, 'seite').armF, [90, 45]);
  assert.deepEqual(spiegeln(p, 'front').armF, [-90, -45]);
  assert.equal(spiegeln(p, 'front').torso, -12);
});

test('pendeln: Anfang und Ende gleich, Mitte ist letzte Pose', () => {
  const anim = { ansicht: 'seite', modus: 'pendeln', zyklus: 4, posen: [{ torso: 0 }, { torso: 30 }, { torso: 60 }] };
  nah(poseZurZeit(anim, 0).torso, 0);
  nah(poseZurZeit(anim, 4).torso, 0);
  nah(poseZurZeit(anim, 2).torso, 60);
  nah(poseZurZeit(anim, 1).torso, 30);
  nah(poseZurZeit(anim, 3).torso, 30);
});

test('halten: nach 1,5 s nahe der letzten Pose', () => {
  const anim = { ansicht: 'seite', modus: 'halten', zyklus: 4, posen: [{ torso: 0 }, { torso: 50 }] };
  nah(poseZurZeit(anim, 0).torso, 0);
  for (const t of [1.5, 2, 3.3, 10]) {
    const p = poseZurZeit(anim, t);
    nah(p.torso, 50);
    assert.ok(Math.abs(p.spine) <= 1.5);
  }
});

test('kreisen: läuft nach der letzten Pose zur ersten weiter', () => {
  const anim = { ansicht: 'seite', modus: 'kreisen', zyklus: 4, posen: [0, 90, 180, 270].map((w) => ({ armN: [w, w] })) };
  nah(((poseZurZeit(anim, 3.5).armN[0] % 360) + 360) % 360, 315);
});

test('unvollständige Pose liefert nur endliche Zahlen', () => {
  assert.ok(alleZahlen(gelenke({}, 'seite')));
  assert.ok(alleZahlen(gelenke({ armN: [10] }, 'front')));
  assert.ok(alleZahlen(poseZurZeit({ posen: [{}] }, 1)));
});

test('erden setzt den tiefsten Punkt auf den Boden', () => {
  const p = erden({ hip: [120, 20], legN: [90, 90], legF: [90, 90], torso: 270 }, 'seite');
  const g = gelenke(p, 'seite');
  const tief = Math.max(...Object.values(g).map((q) => q[1]));
  nah(tief, BODEN_Y, 0.01);
});
