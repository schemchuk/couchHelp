/**
 * Німецька локалізація інтерфейсу couchHelp.
 * Структура під майбутній перемикач DE/RU/UA/EN.
 *
 * Блок 05 — Inbox UI
 */

export const de = {
  inbox: {
    title: 'Posteingang',
    empty: 'Keine Nachrichten vorhanden',
    emptyHint: 'Neue Kundenanfragen erscheinen hier automatisch.',
    loading: 'Nachrichten werden geladen…',
    error: 'Fehler beim Laden der Nachrichten',
    retry: 'Erneut versuchen',
    searchPlaceholder: 'Kunden suchen…',
    unread: 'Ungelesen',
    all: 'Alle',
  },
  messageThread: {
    title: 'Gespräch',
    noSelection: 'Wählen Sie eine Unterhaltung aus der Liste',
    inboundLabel: 'Kunde',
    outboundLabel: 'Sie',
    draftLabel: 'Entwurf',
    audioTranscription: 'Sprachnachricht – Transkription',
  },
  draftCard: {
    title: 'KI-Entwurf',
    approve: 'Freigeben',
    edit: 'Bearbeiten',
    discard: 'Verwerfen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    warningLowConfidence:
      'KI ist sich unsicher – bitte manuell prüfen',
    warningUnclear: 'Nachricht unklar klassifiziert – bitte prüfen',
    confidence: 'Konfidenz',
    language: 'Sprache',
    tone: 'Tonfall',
    type: 'Typ',
  },
  classification: {
    new_lead: 'Neuer Lead',
    existing_client: 'Bestandskunde',
    spam: 'Spam',
    unclear: 'Unklar',
  },
  tone: {
    neutral: 'Neutral',
    urgent: 'Dringend',
    positive: 'Positiv',
    negative: 'Negativ',
  },
  client: {
    unknown: 'Unbekannt',
  },
  errors: {
    generic: 'Ein Fehler ist aufgetreten',
    saveFailed: 'Speichern fehlgeschlagen',
    updateFailed: 'Aktualisierung fehlgeschlagen',
  },
} as const

export type Translation = typeof de
