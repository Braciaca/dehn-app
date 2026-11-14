import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';

function fake(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
}
const ids = new Set(['a', 'b']);
const roh = () => ({ name: 'Test', pause: 10, eintraege: [{ uebungId: 'a', dauer: 30, seite: 'keine' }] });

test('leerer Speicher → keine Routinen, Standard-Einstellungen', () => {
  const s = createStore(fake(), ids);
  assert.deepEqual(s.routinen(), []);
  assert.deepEqual(s.einstellungen(), { lautstaerke: 0.3, toeneAn: true });
  assert.equal(s.ladeFehler, false);
});

test('speichern vergibt ID und Zeitstempel und übersteht Neuladen', () => {
  const st = fake();
  const s = createStore(st, ids);
  const r = s.speichere(roh());
  assert.ok(r.id);
  assert.ok(r.geaendert > 0);
  const s2 = createStore(st, ids);
  assert.equal(s2.routinen().length, 1);
  assert.equal(s2.routine(r.id).name, 'Test');
});

test('speichern mit vorhandener ID ersetzt', () => {
  const s = createStore(fake(), ids);
  const r = s.speichere(roh());
  s.speichere({ ...r, name: 'Neu' });
  assert.equal(s.routinen().length, 1);
  assert.equal(s.routine(r.id).name, 'Neu');
});

test('dupliziere erzeugt neue ID, loesche entfernt', () => {
  const s = createStore(fake(), ids);
  const r = s.speichere(roh());
  const d = s.dupliziere(r.id);
  assert.notEqual(d.id, r.id);
  assert.equal(d.name, 'Test (Kopie)');
  s.loesche(r.id);
  assert.deepEqual(s.routinen().map((x) => x.id), [d.id]);
});

test('defektes JSON im Speicher wird aufbewahrt, App startet leer', () => {
  const st = fake({ 'dehnapp.routinen': '{kaputt' });
  const s = createStore(st, ids);
  assert.equal(s.ladeFehler, true);
  assert.deepEqual(s.routinen(), []);
  assert.equal(st.m.get('dehnapp.defekt'), '{kaputt');
});

test('Import: kein JSON oder falsche Form → Fehler, Bestand unverändert', () => {
  const s = createStore(fake(), ids);
  s.speichere(roh());
  for (const text of ['kein json', '{"routinen":5}', '[]', 'null', '{"routinen":[]}']) {
    const erg = s.importJson(text);
    assert.equal(erg.ok, false, text);
    assert.equal(typeof erg.fehler, 'string');
  }
  assert.equal(s.routinen().length, 1);
});

test('Export und Import: vorhandene ID bekommt eine neue', () => {
  const s = createStore(fake(), ids);
  const r = s.speichere(roh());
  const erg = s.importJson(s.exportJson());
  assert.deepEqual(erg, { ok: true, anzahl: 1 });
  assert.equal(s.routinen().length, 2);
  assert.equal(new Set(s.routinen().map((x) => x.id)).size, 2);
  assert.ok(s.routine(r.id));
});

test('Import normalisiert Werte', () => {
  const s = createStore(fake(), ids);
  const erg = s.importJson(JSON.stringify({ routinen: [{
    name: '', pause: -5,
    eintraege: [
      { uebungId: 'a', dauer: -1, seite: 'quer' },
      { uebungId: 'gibtsnicht', dauer: 40, seite: 'links' },
      { dauer: 20 }, 'unsinn', null,
    ],
  }, 'unsinn'] }));
  assert.deepEqual(erg, { ok: true, anzahl: 1 });
  const r = s.routinen()[0];
  assert.equal(r.name, 'Ohne Namen');
  assert.equal(r.pause, 0);
  assert.deepEqual(r.eintraege, [
    { uebungId: 'a', dauer: 5, seite: 'beide' },
    { uebungId: 'gibtsnicht', dauer: 40, seite: 'links' },
  ]);
});

test('Einstellungen werden begrenzt und gespeichert', () => {
  const st = fake();
  const s = createStore(st, ids);
  s.setzeEinstellungen({ lautstaerke: 7 });
  assert.equal(s.einstellungen().lautstaerke, 1);
  s.setzeEinstellungen({ lautstaerke: 'x', toeneAn: false });
  assert.deepEqual(createStore(st, ids).einstellungen(), { lautstaerke: 0.3, toeneAn: false });
});

test('Speicher wirft beim Schreiben → kein Absturz', () => {
  const st = fake();
  st.setItem = () => { throw new Error('voll'); };
  const s = createStore(st, ids);
  assert.doesNotThrow(() => s.speichere(roh()));
  assert.equal(s.routinen().length, 1);
});

test('eigene Übungsnamen: setzen, kürzen, zurücksetzen, Neuladen', () => {
  const st = fake();
  const s = createStore(st, ids);
  assert.deepEqual(s.namen(), {});
  s.setzeName('a', '  Mein Name  ');
  s.setzeName('b', 'x'.repeat(100));
  s.setzeName('gibtsnicht', 'egal');
  assert.equal(s.namen().a, 'Mein Name');
  assert.equal(s.namen().b.length, 60);
  assert.equal('gibtsnicht' in s.namen(), false);
  assert.deepEqual(createStore(st, ids).namen(), s.namen());
  s.setzeName('a', '   ');
  assert.equal('a' in s.namen(), false);
});

test('defekte Namen im Speicher werden ignoriert', () => {
  assert.deepEqual(createStore(fake({ 'dehnapp.namen': '{kaputt' }), ids).namen(), {});
  assert.deepEqual(createStore(fake({ 'dehnapp.namen': '{"a":5,"b":"ok","zz":"x"}' }), ids).namen(), { b: 'ok' });
});

test('Export enthält die Namen, Import übernimmt sie', () => {
  const s = createStore(fake(), ids);
  s.speichere(roh());
  s.setzeName('a', 'Eigen');
  const text = s.exportJson();
  const s2 = createStore(fake(), ids);
  assert.equal(s2.importJson(text).ok, true);
  assert.deepEqual(s2.namen(), { a: 'Eigen' });
});
