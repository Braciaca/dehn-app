// Pieptöne über die Web Audio API, ohne Audiodateien.

export function createAudio() {
  let ctx = null;
  let lautstaerke = 0.3;
  let an = true;

  function kontext() {
    if (!ctx) {
      const Klasse = window.AudioContext || window.webkitAudioContext;
      if (!Klasse) return null;
      ctx = new Klasse();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function ton(frequenz, dauerMs, verzoegerungMs = 0) {
    if (!an || lautstaerke <= 0) return;
    const c = kontext();
    if (!c) return;
    const start = c.currentTime + verzoegerungMs / 1000;
    const ende = start + dauerMs / 1000;
    const osz = c.createOscillator();
    const gain = c.createGain();
    const spitze = lautstaerke * 0.5;
    osz.type = 'sine';
    osz.frequency.value = frequenz;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(spitze, start + 0.01);
    gain.gain.setValueAtTime(spitze, Math.max(start + 0.01, ende - 0.01));
    gain.gain.linearRampToValueAtTime(0, ende);
    osz.connect(gain).connect(c.destination);
    osz.start(start);
    osz.stop(ende + 0.02);
  }

  return {
    // Muss aus einer Nutzeraktion heraus aufgerufen werden, sonst blockiert der Browser den Ton.
    entsperren() { kontext(); },
    beep() { ton(660, 90); },
    wechsel() { ton(990, 220); },
    fertig() { ton(660, 160); ton(990, 320, 190); },
    setLautstaerke(v) { lautstaerke = Math.min(1, Math.max(0, Number(v) || 0)); },
    setAn(b) { an = Boolean(b); },
  };
}
