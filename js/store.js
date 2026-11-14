// Laden, Speichern, Export und Import von Routinen und Einstellungen.
import { clampDauer, clampPause } from './sequence.js';

const K_ROUTINEN = 'dehnapp.routinen';
const K_EINSTELLUNGEN = 'dehnapp.einstellungen';
const K_DEFEKT = 'dehnapp.defekt';
const K_NAMEN = 'dehnapp.namen';
const SEITEN = ['beide', 'links', 'rechts', 'keine'];
const STANDARD = { lautstaerke: 0.3, toeneAn: true };

let zaehler = 0;
function neueId() {
  zaehler += 1;
  return `r-${Date.now().toString(36)}-${zaehler.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function normalisiereRoutine(roh) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null;
  let name = typeof roh.name === 'string' ? roh.name.trim().slice(0, 60) : '';
  if (!name) name = 'Ohne Namen';
  const eintraege = (Array.isArray(roh.eintraege) ? roh.eintraege : [])
    .filter((e) => e && typeof e === 'object' && typeof e.uebungId === 'string' && e.uebungId)
    .map((e) => ({
      uebungId: e.uebungId,
      dauer: clampDauer(e.dauer),
      seite: SEITEN.includes(e.seite) ? e.seite : 'beide',
    }));
  return {
    id: typeof roh.id === 'string' && roh.id ? roh.id : '',
    name,
    pause: clampPause(roh.pause),
    geaendert: Number.isFinite(roh.geaendert) ? roh.geaendert : 0,
    eintraege,
  };
}

function normalisiereEinstellungen(roh) {
  const e = { ...STANDARD };
  if (roh && typeof roh === 'object') {
    const v = roh.lautstaerke;
    if (typeof v === 'number' && Number.isFinite(v)) e.lautstaerke = Math.min(1, Math.max(0, v));
    if (typeof roh.toeneAn === 'boolean') e.toeneAn = roh.toeneAn;
  }
  return e;
}

// Eigene Namen für Übungen: nur bekannte IDs, nur nicht leere Texte, höchstens 60 Zeichen.
function normalisiereNamen(roh, uebungIds) {
  const namen = {};
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return namen;
  for (const [id, wert] of Object.entries(roh)) {
    if (!uebungIds.has(id) || typeof wert !== 'string') continue;
    const text = wert.trim().slice(0, 60);
    if (text) namen[id] = text;
  }
  return namen;
}

export function createStore(storage, uebungIds = new Set()) {
  let routinen = [];
  let einstellungen = { ...STANDARD };
  let ladeFehler = false;
  let namen = {};

  const lies = (k) => { try { return storage.getItem(k); } catch { return null; } };
  const schreib = (k, v) => { try { storage.setItem(k, v); return true; } catch { return false; } };

  const rohR = lies(K_ROUTINEN);
  if (rohR !== null) {
    try {
      const daten = JSON.parse(rohR);
      if (!Array.isArray(daten)) throw new Error('keine Liste');
      routinen = daten.map(normalisiereRoutine).filter((r) => r && r.id);
    } catch {
      ladeFehler = true;
      schreib(K_DEFEKT, rohR);
      routinen = [];
    }
  }
  try { einstellungen = normalisiereEinstellungen(JSON.parse(lies(K_EINSTELLUNGEN) ?? 'null')); } catch { /* Standard bleibt */ }

  try { namen = normalisiereNamen(JSON.parse(lies(K_NAMEN) ?? 'null'), uebungIds); } catch { /* keine eigenen Namen */ }

  const sichern = () => schreib(K_ROUTINEN, JSON.stringify(routinen));
  const kopie = (r) => JSON.parse(JSON.stringify(r));

  const store = {
    get ladeFehler() { return ladeFehler; },
    uebungIds,
    routinen: () => routinen.map(kopie),
    routine: (id) => { const r = routinen.find((x) => x.id === id); return r ? kopie(r) : null; },

    speichere(roh) {
      const r = normalisiereRoutine(roh);
      if (!r) return null;
      if (!r.id) r.id = neueId();
      r.geaendert = Date.now();
      const i = routinen.findIndex((x) => x.id === r.id);
      if (i >= 0) routinen[i] = r; else routinen.push(r);
      sichern();
      return kopie(r);
    },

    loesche(id) {
      routinen = routinen.filter((x) => x.id !== id);
      sichern();
    },

    dupliziere(id, neuerName) {
      const r = routinen.find((x) => x.id === id);
      if (!r) return null;
      return store.speichere({ ...kopie(r), id: '', name: neuerName || `${r.name} (Kopie)` });
    },

    einstellungen: () => ({ ...einstellungen }),
    setzeEinstellungen(teil) {
      einstellungen = normalisiereEinstellungen({ ...einstellungen, ...teil });
      schreib(K_EINSTELLUNGEN, JSON.stringify(einstellungen));
    },

    namen: () => ({ ...namen }),
    // Leerer Name stellt den Originalnamen wieder her.
    setzeName(id, name) {
      const neu = { ...namen };
      delete neu[id];
      if (typeof name === 'string') neu[id] = name;
      namen = normalisiereNamen(neu, uebungIds);
      schreib(K_NAMEN, JSON.stringify(namen));
    },

    exportJson: () => JSON.stringify({ version: 1, routinen, namen }, null, 2),

    importJson(text) {
      let daten;
      try { daten = JSON.parse(text); } catch { return { ok: false, fehler: 'Die Datei ist keine gültige JSON-Datei.' }; }
      if (!daten || typeof daten !== 'object' || !Array.isArray(daten.routinen)) {
        return { ok: false, fehler: 'Die Datei enthält keine Routinen dieser App.' };
      }
      const neue = daten.routinen.map(normalisiereRoutine).filter(Boolean);
      if (neue.length === 0) return { ok: false, fehler: 'In der Datei wurden keine Routinen gefunden.' };
      for (const r of neue) {
        if (!r.id || routinen.some((x) => x.id === r.id)) r.id = neueId();
        r.geaendert = Date.now();
        routinen.push(r);
      }
      sichern();
      namen = { ...namen, ...normalisiereNamen(daten.namen, uebungIds) };
      schreib(K_NAMEN, JSON.stringify(namen));
      return { ok: true, anzahl: neue.length };
    },
  };
  return store;
}
