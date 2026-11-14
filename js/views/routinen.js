// Liste der eigenen Routinen und der Vorlagen.
import { UEBUNGEN_BY_ID } from '../data/exercises.js';
import { VORLAGEN } from '../data/templates.js';
import { buildSequence, totalDuration } from '../sequence.js';
import { formatDauer } from '../filter.js';
import { h, icon, toast } from '../ui.js';

function karte(routine, ctx) {
  const steps = buildSequence(routine, UEBUNGEN_BY_ID);
  const leer = steps.length === 0;
  const info = `${routine.eintraege.length} ${routine.eintraege.length === 1 ? 'Übung' : 'Übungen'} · ${formatDauer(totalDuration(steps))} min`;
  const zweit = routine.vorlage
    ? h('button', {
      type: 'button', class: 'knopf',
      onclick: () => {
        const kopie = ctx.store.speichere({ name: routine.name, pause: routine.pause, eintraege: routine.eintraege });
        toast('Vorlage kopiert');
        ctx.navigate(`#/routine/${kopie.id}`);
      },
    }, 'Kopieren und anpassen')
    : h('a', { class: 'knopf', href: `#/routine/${routine.id}` }, 'Bearbeiten');
  return h('article', { class: 'karte routine-karte' },
    h('div', { class: 'routine-kopf' }, h('h3', {}, routine.name), h('p', { class: 'leise' }, info)),
    h('div', { class: 'routine-knoepfe' },
      zweit,
      leer
        ? h('button', { type: 'button', class: 'knopf knopf-haupt', disabled: true }, icon('play'), 'Start')
        : h('a', { class: 'knopf knopf-haupt', href: `#/play/${routine.id}` }, icon('play'), 'Start')));
}

export function render(el, ctx) {
  ctx.setTitel('Routinen');
  const eigene = ctx.store.routinen();
  el.append(
    ctx.store.ladeFehler ? h('p', { class: 'hinweis' }, 'Deine gespeicherten Routinen konnten nicht gelesen werden. Die App wurde mit leerem Stand gestartet.') : '',
    h('div', { class: 'abschnitt-kopf' }, h('h2', {}, 'Meine Routinen'),
      h('button', {
        type: 'button', class: 'knopf knopf-haupt',
        onclick: () => {
          const r = ctx.store.speichere({ name: 'Neue Routine', pause: 10, eintraege: [] });
          ctx.navigate(`#/routine/${r.id}`);
        },
      }, 'Neue Routine')),
    eigene.length
      ? h('div', { class: 'stapel' }, eigene.map((r) => karte(r, ctx)))
      : h('p', { class: 'leer' }, 'Noch keine eigene Routine. Lege eine neue an oder kopiere eine Vorlage.'),
    h('div', { class: 'abschnitt-kopf' }, h('h2', {}, 'Vorlagen')),
    h('div', { class: 'stapel' }, VORLAGEN.map((v) => karte(v, ctx))));
}
