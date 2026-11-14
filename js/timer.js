// Zustand eines laufenden Ablaufs. Kennt weder DOM noch Systemuhr:
// die aktuelle Zeit (ms) wird bei jedem Aufruf übergeben.

const SPRUNG_MS = 1500; // ab dieser Lücke zwischen zwei Ticks gilt die Zeit als übersprungen
const NEUSTART_MS = 2000; // "Zurück" startet den Schritt neu, wenn er schon länger läuft

export function createTimer(steps) {
  let index = 0;
  let stepStart = 0;
  let pausedAt = null;
  let lastTick = 0;
  let started = false;
  let finished = false;
  let beeped = new Set();

  const dauerMs = (i) => steps[i].dauer * 1000;
  const aktiv = () => started && !finished;

  function gehezu(i, now) {
    if (i >= steps.length) {
      finished = true;
      return [{ type: 'fertig' }];
    }
    index = Math.max(0, i);
    stepStart = now;
    if (pausedAt !== null) pausedAt = now;
    lastTick = now;
    beeped = new Set();
    return [{ type: 'wechsel', index }];
  }

  return {
    start(now) {
      started = true;
      index = 0;
      stepStart = now;
      lastTick = now;
      pausedAt = null;
      beeped = new Set();
      finished = steps.length === 0;
    },

    tick(now) {
      if (!aktiv() || pausedAt !== null) return [];
      const events = [];
      const sprung = now - lastTick > SPRUNG_MS;
      lastTick = now;

      let gewechselt = false;
      while (now >= stepStart + dauerMs(index)) {
        stepStart += dauerMs(index);
        index += 1;
        gewechselt = true;
        beeped = new Set();
        if (index >= steps.length) {
          finished = true;
          return [{ type: 'fertig' }];
        }
      }
      if (gewechselt) events.push({ type: 'wechsel', index });

      const rest = stepStart + dauerMs(index) - now;
      for (const n of [3, 2, 1]) {
        if (rest <= n * 1000 && rest > (n - 1) * 1000 && !beeped.has(n)) {
          beeped.add(n);
          // Kein Countdown-Ton zusammen mit dem Wechselton und keiner für übersprungene Zeit.
          if (!gewechselt && !sprung) events.push({ type: 'beep', n });
        }
      }
      return events;
    },

    pause(now) {
      if (!aktiv() || pausedAt !== null) return;
      pausedAt = now;
    },

    resume(now) {
      if (!aktiv() || pausedAt === null) return;
      stepStart += now - pausedAt;
      pausedAt = null;
      lastTick = now;
    },

    next(now) {
      if (!aktiv()) return [];
      return gehezu(index + 1, now);
    },

    prev(now) {
      if (!aktiv()) return [];
      const eff = pausedAt !== null ? pausedAt : now;
      const neuStarten = eff - stepStart > NEUSTART_MS || index === 0;
      return gehezu(neuStarten ? index : index - 1, now);
    },

    state(now) {
      if (finished || !started) {
        const gesamt = steps.reduce((s, x) => s + x.dauer * 1000, 0);
        return { index, step: null, remainingMs: 0, paused: false, finished, elapsedTotalMs: finished ? gesamt : 0 };
      }
      const eff = pausedAt !== null ? pausedAt : now;
      const imSchritt = Math.min(dauerMs(index), Math.max(0, eff - stepStart));
      let davor = 0;
      for (let i = 0; i < index; i++) davor += dauerMs(i);
      return {
        index,
        step: steps[index],
        remainingMs: dauerMs(index) - imSchritt,
        paused: pausedAt !== null,
        finished: false,
        elapsedTotalMs: davor + imSchritt,
      };
    },
  };
}
