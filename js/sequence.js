// Übersetzt eine Routine in eine flache Liste von Schritten.

export const VORBEREITUNG_S = 5;
export const SEITENWECHSEL_S = 3;
export const MIN_DAUER = 5;
export const MAX_DAUER = 3600;
export const MAX_PAUSE = 600;
const STANDARD_DAUER = 30;

export function clampDauer(wert) {
  if (wert === null || wert === undefined || wert === '') return STANDARD_DAUER;
  const n = Number(wert);
  if (!Number.isFinite(n)) return STANDARD_DAUER;
  return Math.min(MAX_DAUER, Math.max(MIN_DAUER, Math.round(n)));
}

export function clampPause(wert) {
  const n = Number(wert);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_PAUSE, Math.max(0, Math.round(n)));
}

export function buildSequence(routine, uebungenById) {
  const eintraege = Array.isArray(routine?.eintraege) ? routine.eintraege : [];
  const pause = clampPause(routine?.pause);

  // Jede gültige Übung wird zu einem Block aus einem oder drei Schritten.
  const bloecke = [];
  for (const e of eintraege) {
    const uebung = e && uebungenById[e.uebungId];
    if (!uebung) continue;
    const dauer = clampDauer(e.dauer);
    const id = uebung.id;
    if (!uebung.wechselseitig) {
      bloecke.push([{ art: 'uebung', dauer, uebungId: id, seite: null }]);
    } else if (e.seite === 'links' || e.seite === 'rechts') {
      bloecke.push([{ art: 'uebung', dauer, uebungId: id, seite: e.seite }]);
    } else {
      bloecke.push([
        { art: 'uebung', dauer, uebungId: id, seite: 'links' },
        { art: 'seitenwechsel', dauer: SEITENWECHSEL_S, uebungId: id, seite: 'rechts' },
        { art: 'uebung', dauer, uebungId: id, seite: 'rechts' },
      ]);
    }
  }
  if (bloecke.length === 0) return [];

  const steps = [];
  bloecke.forEach((block, i) => {
    const erster = block[0];
    if (i === 0) {
      steps.push({ art: 'vorbereitung', dauer: VORBEREITUNG_S, uebungId: erster.uebungId, seite: erster.seite });
    } else if (pause > 0) {
      steps.push({ art: 'pause', dauer: pause, uebungId: erster.uebungId, seite: erster.seite });
    }
    steps.push(...block);
  });
  return steps;
}

export function totalDuration(steps) {
  return steps.reduce((summe, s) => summe + s.dauer, 0);
}
