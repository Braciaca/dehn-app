// Mitgelieferte Vorlagen. Sie sind schreibgeschützt und lassen sich kopieren.
import { UEBUNGEN_BY_ID } from './exercises.js';

const e = (uebungId, dauer) => ({
  uebungId,
  dauer: dauer ?? UEBUNGEN_BY_ID[uebungId].standardDauer,
  seite: UEBUNGEN_BY_ID[uebungId].wechselseitig ? 'beide' : 'keine',
});
const vorlage = (id, name, pause, eintraege) => ({ id: `vorlage-${id}`, name, pause, vorlage: true, geaendert: 0, eintraege });

export const VORLAGEN = [
  vorlage('morgen', 'Morgenroutine', 5, [
    e('katze-kuh'), e('vierfuessler-wiegen'), e('herabschauender-hund', 30), e('weltbeste-dehnung', 30),
    e('wirbelsaeule-abrollen'), e('armkreisen', 30), e('hueftkreisen', 30), e('rumpfrotation-stehend', 30),
  ]),
  vorlage('buero', 'Büro-Pause', 5, [
    e('sitz-katze-kuh'), e('sitz-nacken-diagonal', 25), e('sitz-rudern', 30), e('sitz-brustoeffner'),
    e('sitz-drehung', 25), e('sitz-figur-4', 30), e('sitz-gebetshaltung', 25), e('schulterkreisen', 30),
  ]),
  vorlage('huefte-ruecken', 'Hüfte und unterer Rücken', 8, [
    e('katze-kuh'), e('kindhaltung', 45), e('tiefer-ausfallschritt', 40), e('taube', 45),
    e('figur-4-liegend', 40), e('knie-zur-brust-liegend', 30), e('glueckliches-baby', 40), e('schulterbruecke'),
  ]),
  vorlage('schultern-nacken', 'Schultern und Nacken', 5, [
    e('nacken-halbkreise', 30), e('nackenneigung', 25), e('kinn-zur-brust', 25), e('schulterkreisen', 30),
    e('schulterdehnung-quer', 25), e('trizepsdehnung', 25), e('brustoeffner-stehend'), e('faden-durchs-nadeloehr'),
    e('welpenhaltung'),
  ]),
  vorlage('abend', 'Abendroutine', 8, [
    e('kindhaltung', 60), e('faden-durchs-nadeloehr', 30), e('langsitz-vorbeuge', 45), e('schmetterling', 45),
    e('drehsitz', 30), e('knie-zur-brust-liegend', 30), e('figur-4-liegend', 45), e('liegender-schmetterling', 60),
  ]),
];
