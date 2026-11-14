// Editor für eine eigene Routine. Jede Änderung wird sofort gespeichert.
import { UEBUNGEN, UEBUNGEN_BY_ID } from '../data/exercises.js';
import { buildSequence, totalDuration, clampDauer, clampPause, MIN_DAUER, MAX_DAUER, MAX_PAUSE } from '../sequence.js';
import { filtere, formatDauer, leererFilter } from '../filter.js';
import { h, icon, figur, dialog, toast, filterLeiste, stoppeFiguren } from '../ui.js';
import { eintragFuer, vorschauDialog } from './detail.js';
import { uebungKarte } from './uebungen.js';

const SEITEN = [['beide', 'Beide'], ['links', 'Links'], ['rechts', 'Rechts']];

// Zahlenfeld mit Minus- und Plus-Knopf in 5er-Schritten.
function stepper(wert, { min, max, label, onChange }) {
  const feld = h('input', { type: 'number', inputMode: 'numeric', min, max, step: 5, value: wert, 'aria-label': label });
  const setze = (v) => {
    const n = Math.min(max, Math.max(min, Math.round(Number(v)) || min));
    feld.value = n;
    onChange(n);
  };
  feld.addEventListener('change', () => setze(feld.value));
  return h('div', { class: 'stepper' },
    h('button', { type: 'button', 'aria-label': `${label} verringern`, onclick: () => setze(Number(feld.value) - 5) }, '−'),
    feld, h('span', { class: 'einheit' }, 's'),
    h('button', { type: 'button', 'aria-label': `${label} erhöhen`, onclick: () => setze(Number(feld.value) + 5) }, '+'));
}

export function render(el, ctx) {
  let routine = ctx.store.routine(ctx.param);
  if (!routine) {
    ctx.setTitel('Routine', '#/routinen');
    el.append(h('p', { class: 'leer' }, 'Diese Routine gibt es nicht (mehr).'));
    return;
  }
  ctx.setTitel('Routine bearbeiten', '#/routinen');

  const sichern = () => { routine = ctx.store.speichere(routine); zeichneFuss(); };
  const liste = h('div', { class: 'stapel' });
  const fuss = h('div', { class: 'editor-fuss' });

  function zeichneFuss() {
    const steps = buildSequence(routine, UEBUNGEN_BY_ID);
    fuss.replaceChildren(
      h('p', {}, h('strong', {}, `${formatDauer(totalDuration(steps))} min`), ` · ${routine.eintraege.length} Übungen`),
      steps.length
        ? h('a', { class: 'knopf knopf-haupt', href: `#/play/${routine.id}` }, icon('play'), 'Start')
        : h('button', { type: 'button', class: 'knopf knopf-haupt', disabled: true }, icon('play'), 'Start'));
  }

  function verschiebe(i, richtung) {
    const j = i + richtung;
    if (j < 0 || j >= routine.eintraege.length) return;
    [routine.eintraege[i], routine.eintraege[j]] = [routine.eintraege[j], routine.eintraege[i]];
    sichern();
    zeichneListe();
  }

  function zeile(eintrag, i) {
    const u = UEBUNGEN_BY_ID[eintrag.uebungId];
    const letzte = routine.eintraege.length - 1;
    const kopfzeile = h('div', { class: 'eintrag-kopf' },
      u
        ? h('button', {
          type: 'button', class: 'eintrag-vorschau', 'aria-label': `Animation von ${u.name} ansehen`,
          onclick: () => vorschauDialog(u, ctx, { seite: eintrag.seite === 'links' ? 'links' : null, onGeaendert: zeichneListe }),
        }, figur(u, { standbild: true }), h('span', { class: 'eintrag-name' }, h('h3', {}, u.name), h('span', { class: 'leise' }, 'Animation ansehen')))
        : h('div', { class: 'eintrag-vorschau' }, h('div', { class: 'figur-box figur-fehlt' }, '?'),
          h('div', { class: 'eintrag-name' }, h('h3', {}, 'Unbekannte Übung'),
            h('p', { class: 'fehler' }, 'Diese Übung gibt es nicht mehr. Sie wird übersprungen.'))),
      h('div', { class: 'eintrag-knoepfe' },
        h('button', { type: 'button', class: 'rund', disabled: i === 0, 'aria-label': 'Nach oben', onclick: () => verschiebe(i, -1) }, '▲'),
        h('button', { type: 'button', class: 'rund', disabled: i === letzte, 'aria-label': 'Nach unten', onclick: () => verschiebe(i, 1) }, '▼'),
        h('button', {
          type: 'button', class: 'rund', 'aria-label': 'Entfernen',
          onclick: () => { routine.eintraege.splice(i, 1); sichern(); zeichneListe(); },
        }, icon('zu'))));
    if (!u) return h('article', { class: 'karte eintrag eintrag-unbekannt' }, kopfzeile);

    const seite = u.wechselseitig ? h('div', { class: 'segment', role: 'group', 'aria-label': 'Seite' },
      SEITEN.map(([key, text]) => h('button', {
        type: 'button', 'aria-pressed': String(eintrag.seite === key),
        onclick: (e) => {
          eintrag.seite = key;
          e.currentTarget.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
          sichern();
          zeichneListe();
        },
      }, text))) : null;
    return h('article', { class: 'karte eintrag' }, kopfzeile,
      h('div', { class: 'eintrag-werte' },
        h('div', { class: 'feld' }, h('span', {}, u.wechselseitig && eintrag.seite === 'beide' ? 'Dauer pro Seite' : 'Dauer'),
          stepper(eintrag.dauer, { min: MIN_DAUER, max: MAX_DAUER, label: 'Dauer', onChange: (n) => { eintrag.dauer = clampDauer(n); sichern(); } })),
        seite));
  }

  function zeichneListe() {
    stoppeFiguren(liste);
    liste.replaceChildren(...(routine.eintraege.length
      ? routine.eintraege.map(zeile)
      : [h('p', { class: 'leer' }, 'Noch keine Übungen. Füge die erste hinzu.')]));
  }

  function auswahl() {
    const zustand = leererFilter();
    const treffer = h('div', { class: 'raster raster-klein' });
    const gewaehlt = h('div', { class: 'gewaehlt' });
    let fenster = null;

    // Leiste am unteren Rand: zeigt, was schon in der Routine ist, und erlaubt das Entfernen.
    const zeichneGewaehlt = () => {
      const n = routine.eintraege.length;
      gewaehlt.replaceChildren(
        h('div', { class: 'gewaehlt-kopf' },
          h('strong', {}, n ? `In der Routine: ${n} ${n === 1 ? 'Übung' : 'Übungen'}` : 'Noch nichts hinzugefügt'),
          h('button', { type: 'button', class: 'knopf knopf-haupt', onclick: () => fenster?.schliessen() }, 'Fertig')),
        h('ol', { class: 'gewaehlt-liste' }, routine.eintraege.map((e, i) => h('li', {},
          h('span', {}, `${i + 1}. ${UEBUNGEN_BY_ID[e.uebungId]?.name ?? 'Unbekannte Übung'}`),
          h('button', {
            type: 'button', 'aria-label': 'Aus der Routine entfernen',
            onclick: () => { routine.eintraege.splice(i, 1); sichern(); zeichneListe(); zeichne(); },
          }, icon('zu'))))));
      gewaehlt.querySelector('.gewaehlt-liste').scrollLeft = 1e6;
    };

    const zeichne = () => {
      const rollen = fenster?.el.scrollTop ?? 0;
      stoppeFiguren(treffer);
      const gefunden = filtere(UEBUNGEN, zustand);
      const anzahl = (id) => routine.eintraege.filter((e) => e.uebungId === id).length;
      treffer.replaceChildren(...(gefunden.length ? gefunden.map((u) => uebungKarte(u, {
        standbild: true,
        marke: anzahl(u.id),
        onclick: () => {
          routine.eintraege.push(eintragFuer(u));
          sichern();
          zeichneListe();
          zeichne();
        },
      })) : [h('p', { class: 'leer' }, 'Keine Übung passt zu diesen Filtern.')]));
      zeichneGewaehlt();
      if (fenster) fenster.el.scrollTop = rollen;
    };
    fenster = dialog('Übung hinzufügen', h('div', {}, filterLeiste(zustand, zeichne), treffer, gewaehlt), { gross: true });
    zeichne();
  }

  const name = h('input', { type: 'text', class: 'name-feld', value: routine.name, maxLength: 60, 'aria-label': 'Name der Routine' });
  name.addEventListener('change', () => { routine.name = name.value; sichern(); name.value = routine.name; });

  el.append(
    h('div', { class: 'karte editor-kopf' },
      h('label', { class: 'feld' }, h('span', {}, 'Name'), name),
      h('div', { class: 'feld' }, h('span', {}, 'Pause zwischen den Übungen'),
        stepper(routine.pause, { min: 0, max: MAX_PAUSE, label: 'Pause', onChange: (n) => { routine.pause = clampPause(n); sichern(); } }))),
    liste,
    h('button', { type: 'button', class: 'knopf knopf-breit', onclick: auswahl }, '+ Übung hinzufügen'),
    h('div', { class: 'editor-aktionen' },
      h('button', {
        type: 'button', class: 'link',
        onclick: () => { const k = ctx.store.dupliziere(routine.id); toast('Routine dupliziert'); ctx.navigate(`#/routine/${k.id}`); },
      }, 'Duplizieren'),
      h('button', {
        type: 'button', class: 'link link-gefahr',
        onclick: () => {
          if (!window.confirm(`Routine „${routine.name}“ wirklich löschen?`)) return;
          ctx.store.loesche(routine.id);
          ctx.navigate('#/routinen');
        },
      }, 'Routine löschen')),
    fuss);
  zeichneListe();
  zeichneFuss();
}
