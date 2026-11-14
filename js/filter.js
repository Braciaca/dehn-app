// Filtern des Katalogs und Formatieren von Zeiten (ohne DOM).

export const leererFilter = () => ({ suche: '', koerperteile: [], art: null, position: null });

export function filtere(uebungen, f) {
  const suche = (f.suche || '').trim().toLowerCase();
  return uebungen.filter((u) =>
    (!suche || u.name.toLowerCase().includes(suche))
    && (!f.koerperteile?.length || u.koerperteile.some((k) => f.koerperteile.includes(k)))
    && (!f.art || u.art === f.art)
    && (!f.position || u.position === f.position));
}

export function formatDauer(sek) {
  const s = Math.max(0, Math.round(Number(sek) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
