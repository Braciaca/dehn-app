import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSequence, totalDuration, clampDauer } from '../js/sequence.js';

const ex = { a: { id: 'a', wechselseitig: false }, b: { id: 'b', wechselseitig: true } };
const r = (eintraege, pause = 10) => ({ id: 'r', name: 'R', pause, eintraege });
const kurz = (steps) => steps.map((x) => [x.art, x.dauer, x.seite]);

test('einfache Übung: Vorbereitung + Übung', () => {
  assert.deepEqual(buildSequence(r([{ uebungId: 'a', dauer: 30, seite: 'keine' }]), ex), [
    { art: 'vorbereitung', dauer: 5, uebungId: 'a', seite: null },
    { art: 'uebung', dauer: 30, uebungId: 'a', seite: null },
  ]);
});

test('beide Seiten: links, Wechsel 3 s, rechts, Dauer pro Seite', () => {
  const s = buildSequence(r([{ uebungId: 'b', dauer: 20, seite: 'beide' }]), ex).slice(1);
  assert.deepEqual(kurz(s), [['uebung', 20, 'links'], ['seitenwechsel', 3, 'rechts'], ['uebung', 20, 'rechts']]);
});

test('nur rechts: ein Schritt', () => {
  const s = buildSequence(r([{ uebungId: 'b', dauer: 20, seite: 'rechts' }]), ex).slice(1);
  assert.deepEqual(kurz(s), [['uebung', 20, 'rechts']]);
});

test('Vorbereitung zeigt die Seite der ersten Übung', () => {
  const s = buildSequence(r([{ uebungId: 'b', dauer: 20, seite: 'beide' }]), ex);
  assert.deepEqual(s[0], { art: 'vorbereitung', dauer: 5, uebungId: 'b', seite: 'links' });
});

test('Pause zwischen Übungen, nicht nach der letzten', () => {
  const s = buildSequence(r([
    { uebungId: 'a', dauer: 30, seite: 'keine' },
    { uebungId: 'b', dauer: 20, seite: 'links' },
  ]), ex).slice(1);
  assert.deepEqual(s, [
    { art: 'uebung', dauer: 30, uebungId: 'a', seite: null },
    { art: 'pause', dauer: 10, uebungId: 'b', seite: 'links' },
    { art: 'uebung', dauer: 20, uebungId: 'b', seite: 'links' },
  ]);
});

test('Pause 0 entfällt', () => {
  const s = buildSequence(r([
    { uebungId: 'a', dauer: 30, seite: 'keine' },
    { uebungId: 'a', dauer: 30, seite: 'keine' },
  ], 0), ex).slice(1);
  assert.deepEqual(kurz(s), [['uebung', 30, null], ['uebung', 30, null]]);
});

test('unbekannte Übung wird übersprungen, keine doppelte Pause', () => {
  const s = buildSequence(r([
    { uebungId: 'a', dauer: 30, seite: 'keine' },
    { uebungId: 'x', dauer: 30, seite: 'keine' },
    { uebungId: 'a', dauer: 30, seite: 'keine' },
  ]), ex).slice(1);
  assert.deepEqual(kurz(s), [['uebung', 30, null], ['pause', 10, null], ['uebung', 30, null]]);
});

test('leere Routine und nur unbekannte Übungen → []', () => {
  assert.deepEqual(buildSequence(r([]), ex), []);
  assert.deepEqual(buildSequence(r([{ uebungId: 'x', dauer: 30, seite: 'keine' }]), ex), []);
  assert.deepEqual(buildSequence({}, ex), []);
});

test('seite beide bei nicht wechselseitiger Übung → ein Schritt ohne Seite', () => {
  const s = buildSequence(r([{ uebungId: 'a', dauer: 30, seite: 'beide' }]), ex).slice(1);
  assert.deepEqual(kurz(s), [['uebung', 30, null]]);
});

test('ungültige Dauer und Pause werden begrenzt', () => {
  const s = buildSequence(r([
    { uebungId: 'a', dauer: -4, seite: 'keine' },
    { uebungId: 'a', dauer: 'abc', seite: 'keine' },
  ], 99999), ex).slice(1);
  assert.deepEqual(kurz(s), [['uebung', 5, null], ['pause', 600, null], ['uebung', 30, null]]);
});

test('clampDauer', () => {
  assert.equal(clampDauer(0), 5);
  assert.equal(clampDauer(-3), 5);
  assert.equal(clampDauer(99999), 3600);
  assert.equal(clampDauer('45'), 45);
  assert.equal(clampDauer('abc'), 30);
  assert.equal(clampDauer(null), 30);
  assert.equal(clampDauer(undefined), 30);
  assert.equal(clampDauer(''), 30);
  assert.equal(clampDauer(12.6), 13);
});

test('totalDuration summiert alle Schritte', () => {
  const s = buildSequence(r([{ uebungId: 'b', dauer: 20, seite: 'beide' }]), ex);
  assert.equal(totalDuration(s), 48);
  assert.equal(totalDuration([]), 0);
});
