import test from 'node:test';
import assert from 'node:assert/strict';
import { filtere, formatDauer, leererFilter } from '../js/filter.js';

const liste = [
  { id: 'a', name: 'Katze-Kuh', koerperteile: ['unterer-ruecken'], art: 'dynamisch', position: 'boden' },
  { id: 'b', name: 'Nacken neigen', koerperteile: ['nacken'], art: 'statisch', position: 'stehend' },
  { id: 'c', name: 'Taube', koerperteile: ['gesaess', 'huefte'], art: 'statisch', position: 'boden' },
];
const ids = (f) => filtere(liste, { ...leererFilter(), ...f }).map((u) => u.id);

test('leerer Filter liefert alles', () => assert.deepEqual(ids({}), ['a', 'b', 'c']));
test('Körperteile: Treffer bei mindestens einem', () => assert.deepEqual(ids({ koerperteile: ['nacken', 'huefte'] }), ['b', 'c']));
test('Art und Position kombinieren', () => {
  assert.deepEqual(ids({ art: 'statisch' }), ['b', 'c']);
  assert.deepEqual(ids({ art: 'statisch', position: 'boden' }), ['c']);
  assert.deepEqual(ids({ art: 'dynamisch', position: 'stehend' }), []);
});
test('Suche ohne Beachtung von Groß- und Kleinschreibung', () => {
  assert.deepEqual(ids({ suche: 'KATZE' }), ['a']);
  assert.deepEqual(ids({ suche: '  tau ' }), ['c']);
  assert.deepEqual(ids({ suche: 'tau', art: 'dynamisch' }), []);
});
test('formatDauer', () => {
  assert.equal(formatDauer(75), '1:15');
  assert.equal(formatDauer(5), '0:05');
  assert.equal(formatDauer(600), '10:00');
  assert.equal(formatDauer(-3), '0:00');
  assert.equal(formatDauer(3725), '62:05');
});
