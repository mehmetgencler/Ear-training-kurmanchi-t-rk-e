import React from 'react';
import { Instrument, Language } from '../types/music.js';
import { TRANSLATIONS } from '../i18n/translations.js';

interface InstrumentSelectorProps {
  currentInstrument: Instrument;
  onSelectInstrument: (instrument: Instrument) => void;
  language: Language;
}

export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({
  currentInstrument,
  onSelectInstrument,
  language,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-900 border border-stone-800 rounded-xl p-3 sm:px-4">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-stone-400">
          {t.instrumentLabel}
        </span>
        <span className="text-xs text-stone-500 hidden md:inline">
          {t.instrumentSubtitle}
        </span>
      </div>

      <div className="inline-flex p-1 bg-stone-950 border border-stone-800 rounded-lg w-full sm:w-auto" role="radiogroup" aria-label={t.instrumentLabel}>
        <button
          type="button"
          role="radio"
          aria-checked={currentInstrument === 'acoustic-piano' || currentInstrument === 'piano'}
          onClick={() => onSelectInstrument('acoustic-piano')}
          className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentInstrument === 'acoustic-piano' || currentInstrument === 'piano'
              ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          {t.acousticPiano}
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={currentInstrument === 'electric-piano'}
          onClick={() => onSelectInstrument('electric-piano')}
          className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentInstrument === 'electric-piano'
              ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          {t.electricPiano}
        </button>
      </div>
    </div>
  );
};
