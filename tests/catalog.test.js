import test from 'node:test';
import assert from 'node:assert/strict';
import { UEBUNGEN, UEBUNGEN_BY_ID, KOERPERTEILE, ARTEN, POSITIONEN } from '../js/data/exercises.js';
import { VORLAGEN } from '../js/data/templates.js';
import { gelenke, BODEN_Y, BREITE } from '../js/figure.js';
import { buildSequence } from '../js/sequence.js';

const teile = KOERPERTEILE.map((k) => k.key);
const arten = ARTEN.map((k) => k.key);
const positionen = POSITIONEN.map((k) => k.key);

test('Umfang und eindeutige IDs', () => {
  assert.ok(UEBUNGEN.length >= 55, `nur ${UEBUNGEN.length}`);
  assert.equal(new Set(UEBUNGEN.map((u) => u.id)).size, UEBUNGEN.length);
  for (const u of UEBUNGEN) assert.match(u.id, /^[a-z0-9-]+$/);
  assert.equal(Object.keys(UEBUNGEN_BY_ID).length, UEBUNGEN.length);
});

test('Merkmale jeder Übung sind gültig', () => {
  for (const u of UEBUNGEN) {
    assert.ok(u.name.length >= 3, u.id);
    assert.ok(u.koerperteile.length >= 1 && u.koerperteile.every((k) => teile.includes(k)), `${u.id} Körperteile`);
    assert.ok(arten.includes(u.art), `${u.id} Art`);
    assert.ok(positionen.includes(u.position), `${u.id} Position`);
    assert.equal(typeof u.wechselseitig, 'boolean', u.id);
    assert.ok(u.standardDauer >= 15 && u.standardDauer <= 120, `${u.id} Dauer`);
    assert.ok(u.beschreibung.length >= 40, `${u.id} Beschreibung`);
    assert.ok(u.hinweise.length >= 10, `${u.id} Hinweise`);
  }
});

test('Animationen sind vollständig und bleiben im Bild', () => {
  for (const u of UEBUNGEN) {
    const a = u.animation;
    assert.ok(['seite', 'front'].includes(a.ansicht), `${u.id} Ansicht`);
    assert.ok(a.posen.length >= 2, `${u.id} Posen`);
    assert.ok(a.zyklus > 0, `${u.id} Zyklus`);
    if (u.art === 'statisch') assert.equal(a.modus, 'halten', u.id);
    else assert.ok(['pendeln', 'kreisen'].includes(a.modus), `${u.id} Modus`);
    a.posen.forEach((pose, i) => {
      for (const [name, [x, y]] of Object.entries(gelenke(pose, a.ansicht))) {
        const wo = `${u.id} Pose ${i} ${name} (${x.toFixed(0)}, ${y.toFixed(0)})`;
        assert.ok(Number.isFinite(x) && Number.isFinite(y), wo);
        assert.ok(x >= 6 && x <= BREITE - 6, wo);
        assert.ok(y >= -6 && y <= BODEN_Y + 0.5, wo);
      }
    });
  }
});

test('Katalog deckt alle Bereiche ab', () => {
  for (const k of teile) assert.ok(UEBUNGEN.filter((u) => u.koerperteile.includes(k)).length >= 4, k);
  for (const p of positionen) assert.ok(UEBUNGEN.filter((u) => u.position === p).length >= 12, p);
  for (const a of arten) assert.ok(UEBUNGEN.filter((u) => u.art === a).length >= 20, a);
});

test('Vorlagen verweisen nur auf vorhandene Übungen', () => {
  assert.ok(VORLAGEN.length >= 5);
  assert.equal(new Set(VORLAGEN.map((v) => v.id)).size, VORLAGEN.length);
  for (const v of VORLAGEN) {
    assert.match(v.id, /^vorlage-/);
    assert.equal(v.vorlage, true);
    assert.ok(v.eintraege.length >= 6 && v.eintraege.length <= 10, v.id);
    for (const e of v.eintraege) {
      const u = UEBUNGEN_BY_ID[e.uebungId];
      assert.ok(u, `${v.id}: ${e.uebungId}`);
      assert.equal(e.seite === 'keine', !u.wechselseitig, `${v.id}: ${e.uebungId} Seite`);
      assert.ok(e.dauer >= 15, `${v.id}: ${e.uebungId} Dauer`);
    }
    assert.ok(buildSequence(v, UEBUNGEN_BY_ID).length > v.eintraege.length);
  }
});

test('Vorlagen halten ihr Versprechen', () => {
  const von = (id) => VORLAGEN.find((v) => v.id === id).eintraege.map((e) => UEBUNGEN_BY_ID[e.uebungId]);
  assert.ok(von('vorlage-buero').every((u) => u.position !== 'boden'));
  assert.ok(von('vorlage-abend').every((u) => u.art === 'statisch'));
});
