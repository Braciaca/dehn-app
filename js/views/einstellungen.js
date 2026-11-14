// Einstellungen: Töne, Export und Import.
import { h, toast } from '../ui.js';

export function render(el, ctx) {
  ctx.setTitel('Einstellungen');
  const e = ctx.store.einstellungen();

  const an = h('input', { type: 'checkbox', checked: e.toeneAn, id: 'toene-an' });
  const regler = h('input', { type: 'range', min: 0, max: 100, step: 5, value: Math.round(e.lautstaerke * 100), id: 'lautstaerke', disabled: !e.toeneAn });
  const wert = h('span', { class: 'leise' }, `${Math.round(e.lautstaerke * 100)} %`);
  const uebernehmen = () => {
    ctx.store.setzeEinstellungen({ toeneAn: an.checked, lautstaerke: Number(regler.value) / 100 });
    ctx.einstellungenGeaendert();
    regler.disabled = !an.checked;
    wert.textContent = `${regler.value} %`;
  };
  an.addEventListener('change', uebernehmen);
  regler.addEventListener('input', uebernehmen);

  const datei = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  const meldung = h('p', { class: 'leise', role: 'status' });
  datei.addEventListener('change', async () => {
    const f = datei.files[0];
    datei.value = '';
    if (!f) return;
    let text = '';
    try { text = await f.text(); } catch { text = ''; }
    const erg = ctx.store.importJson(text);
    ctx.namenAnwenden();
    meldung.className = erg.ok ? 'leise' : 'fehler';
    meldung.textContent = erg.ok
      ? `${erg.anzahl} ${erg.anzahl === 1 ? 'Routine' : 'Routinen'} importiert.`
      : `Import nicht möglich: ${erg.fehler}`;
  });

  const exportieren = () => {
    if (!ctx.store.routinen().length) { toast('Es gibt noch keine eigenen Routinen'); return; }
    const url = URL.createObjectURL(new Blob([ctx.store.exportJson()], { type: 'application/json' }));
    const a = h('a', { href: url, download: `dehn-routinen-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  el.append(
    ctx.store.ladeFehler ? h('p', { class: 'hinweis' }, 'Die gespeicherten Routinen waren beschädigt und konnten nicht geladen werden.') : '',
    h('section', { class: 'karte einstellung' },
      h('h2', {}, 'Töne'),
      h('label', { class: 'schalter', htmlFor: 'toene-an' }, h('span', {}, 'Pieptöne beim Countdown'), an),
      h('label', { class: 'feld', htmlFor: 'lautstaerke' }, h('span', {}, 'Lautstärke ', wert), regler),
      h('button', { type: 'button', class: 'knopf', onclick: () => { ctx.audio.beep(3); setTimeout(() => ctx.audio.wechsel(), 600); } }, 'Testton abspielen'),
      h('p', { class: 'leise' }, 'Drei leise Töne zählen die letzten Sekunden herunter, ein höherer Ton markiert den Wechsel. Die Lautstärke hängt zusätzlich von der Medienlautstärke des Geräts ab.')),
    h('section', { class: 'karte einstellung' },
      h('h2', {}, 'Routinen sichern und übertragen'),
      h('p', { class: 'leise' }, 'Routinen werden nur auf diesem Gerät gespeichert. Mit Export und Import überträgst du sie auf ein anderes Gerät.'),
      h('div', { class: 'routine-knoepfe' },
        h('button', { type: 'button', class: 'knopf', onclick: exportieren }, 'Exportieren'),
        h('button', { type: 'button', class: 'knopf', onclick: () => datei.click() }, 'Importieren')),
      datei, meldung));
}
