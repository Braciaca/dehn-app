// Katalog aller Übungen mit Suche und Filtern.
import { UEBUNGEN } from '../data/exercises.js';
import { filtere, leererFilter } from '../filter.js';
import { h, figur, tags, filterLeiste, stoppeFiguren } from '../ui.js';

// Der Filter bleibt erhalten, wenn man aus der Detailansicht zurückkommt.
const zustand = leererFilter();

export function uebungKarte(u, { href = null, onclick = null, standbild = false, marke = 0 } = {}) {
  const inhalt = [
    marke ? h('span', { class: 'marke' }, marke > 1 ? `✓ ${marke}×` : '✓ hinzugefügt') : null,
    figur(u, { standbild: true }), h('div', { class: 'karte-text' }, h('h3', {}, u.name), tags(u))];
  return href
    ? h('a', { class: 'karte uebung-karte', href }, inhalt)
    : h('button', { type: 'button', class: marke ? 'karte uebung-karte ist-gewaehlt' : 'karte uebung-karte', onclick }, inhalt);
}

export function render(el, ctx) {
  ctx.setTitel('Übungen');
  const zaehler = h('p', { class: 'zaehler' });
  const raster = h('div', { class: 'raster' });
  const zeichne = () => {
    stoppeFiguren(raster);
    const treffer = filtere(UEBUNGEN, zustand);
    zaehler.textContent = `${treffer.length} von ${UEBUNGEN.length} Übungen`;
    raster.replaceChildren(...(treffer.length
      ? treffer.map((u) => uebungKarte(u, { href: `#/uebung/${u.id}` }))
      : [h('p', { class: 'leer' }, 'Keine Übung passt zu diesen Filtern.')]));
  };
  el.append(filterLeiste(zustand, zeichne), zaehler, raster);
  zeichne();
}
