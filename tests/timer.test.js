import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimer } from '../js/timer.js';

const mk = () => [
  { art: 'vorbereitung', dauer: 5, uebungId: 'a', seite: null },
  { art: 'uebung', dauer: 10, uebungId: 'a', seite: null },
  { art: 'pause', dauer: 2, uebungId: 'b', seite: null },
  { art: 'uebung', dauer: 10, uebungId: 'b', seite: null },
];

function lauf(t, von, bis, schritt = 100) {
  const log = [];
  for (let now = von; now <= bis; now += schritt) {
    for (const e of t.tick(now)) log.push([now, e.type, e.n ?? e.index ?? null]);
  }
  return log;
}

test('Beeps bei 3, 2, 1 und Wechsel bei 0', () => {
  const t = createTimer(mk());
  t.start(0);
  assert.deepEqual(lauf(t, 0, 5000), [
    [2000, 'beep', 3], [3000, 'beep', 2], [4000, 'beep', 1], [5000, 'wechsel', 1],
  ]);
});

test('kurzer Schritt: kein Beep im Moment des Wechsels, danach nur passende', () => {
  const t = createTimer(mk());
  t.start(0);
  const log = lauf(t, 0, 17000).filter(([now]) => now >= 15000);
  assert.deepEqual(log, [[15000, 'wechsel', 2], [16000, 'beep', 1], [17000, 'wechsel', 3]]);
});

test('ganze Routine endet mit genau einem fertig', () => {
  const t = createTimer(mk());
  t.start(0);
  const log = lauf(t, 0, 40000);
  assert.equal(log.filter((e) => e[1] === 'fertig').length, 1);
  assert.deepEqual(log.at(-1), [27000, 'fertig', null]);
  assert.equal(t.state(40000).finished, true);
});

test('pause friert Restzeit ein, resume setzt fort', () => {
  const t = createTimer(mk());
  t.start(0);
  t.tick(1000);
  t.pause(1000);
  assert.equal(t.state(9000).remainingMs, 4000);
  assert.equal(t.state(9000).paused, true);
  assert.deepEqual(t.tick(9000), []);
  t.resume(9000);
  assert.equal(t.state(10000).remainingMs, 3000);
  assert.deepEqual(t.tick(10000), [{ type: 'beep', n: 3 }]);
});

test('großer Zeitsprung: richtiger Schritt, keine Beep-Flut', () => {
  const t = createTimer(mk());
  t.start(0);
  t.tick(100);
  const ev = t.tick(16000);
  assert.equal(t.state(16000).index, 2);
  assert.equal(t.state(16000).remainingMs, 1000);
  assert.deepEqual(ev, [{ type: 'wechsel', index: 2 }]);
});

test('Sprung über das Ende hinaus → fertig genau einmal', () => {
  const t = createTimer(mk());
  t.start(0);
  assert.deepEqual(t.tick(999999), [{ type: 'fertig' }]);
  assert.deepEqual(t.tick(1999999), []);
  assert.equal(t.state(1999999).finished, true);
});

test('next und prev bleiben im Bereich', () => {
  const t = createTimer(mk());
  t.start(0);
  t.prev(100);
  assert.equal(t.state(100).index, 0);
  let fertig = 0;
  for (let i = 0; i < 10; i++) fertig += t.next(200 + i).filter((e) => e.type === 'fertig').length;
  assert.equal(fertig, 1);
  assert.equal(t.state(999).finished, true);
  assert.deepEqual(t.prev(1000), []);
  assert.equal(t.state(1000).finished, true);
});

test('next startet den nächsten Schritt mit voller Dauer', () => {
  const t = createTimer(mk());
  t.start(0);
  assert.deepEqual(t.next(1200), [{ type: 'wechsel', index: 1 }]);
  assert.equal(t.state(1200).remainingMs, 10000);
});

test('prev: nach mehr als 2 s Neustart des Schritts, sonst vorheriger', () => {
  const t = createTimer(mk());
  t.start(0);
  t.next(1000);
  t.prev(4500);
  assert.equal(t.state(4500).index, 1);
  assert.equal(t.state(4500).remainingMs, 10000);
  t.prev(5000);
  assert.equal(t.state(5000).index, 0);
  assert.equal(t.state(5000).remainingMs, 5000);
});

test('next im pausierten Zustand bleibt pausiert', () => {
  const t = createTimer(mk());
  t.start(0);
  t.pause(1000);
  t.next(3000);
  assert.equal(t.state(8000).index, 1);
  assert.equal(t.state(8000).paused, true);
  assert.equal(t.state(8000).remainingMs, 10000);
  t.resume(8000);
  assert.equal(t.state(9000).remainingMs, 9000);
});

test('leere Schrittliste → sofort finished', () => {
  const t = createTimer([]);
  t.start(0);
  assert.equal(t.state(0).finished, true);
  assert.deepEqual(t.tick(100), []);
  assert.deepEqual(t.next(100), []);
});

test('state liefert Schritt und verstrichene Gesamtzeit', () => {
  const t = createTimer(mk());
  t.start(0);
  t.tick(100);
  t.tick(6000);
  const s = t.state(6000);
  assert.equal(s.step.art, 'uebung');
  assert.equal(s.elapsedTotalMs, 6000);
});
