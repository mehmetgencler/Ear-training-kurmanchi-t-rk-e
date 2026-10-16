import React from 'react';
import { getPitchRange } from '../music/definitions.js';
import { Language } from '../types/music.js';
import { TRANSLATIONS } from '../i18n/translations.js';

interface PitchRangeControlProps {
  pitchRangeOctaves: number;
  onChangePitchRange: (octaves: number) => void;
  language: Language;
}

export const PitchRangeControl: React.FC<PitchRangeControlProps> = ({
  pitchRangeOctaves,
  onChangePitchRange,
  language,
}) => {
  const currentRange = getPitchRange(pitchRangeOctaves);
  const t = TRANSLATIONS[language];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-900 border border-stone-800 rounded-xl p-3 sm:px-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <label htmlFor="pitch-range-slider" className="text-xs uppercase tracking-wider font-semibold text-stone-400">
            {t.pitchRangeLabel}
          </label>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {pitchRangeOctaves} {t.pitchRangeOctaves} ({currentRange.label})
          </span>
        </div>
        <span className="text-[11px] text-stone-500 mt-0.5">
          {t.pitchRangeSubtitle(currentRange.label, currentRange.minMidi, currentRange.maxMidi)}
        </span>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <span className="text-[11px] font-mono text-stone-500">2</span>
        <input
          id="pitch-range-slider"
          type="range"
          min="2"
          max="8"
          step="1"
          value={pitchRangeOctaves}
          onChange={(e) => onChangePitchRange(Number(e.target.value))}
          className="w-full sm:w-36 h-2 bg-stone-950 border border-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
          aria-label={t.pitchRangeLabel}
          aria-valuemin={2}
          aria-valuemax={8}
          aria-valuenow={pitchRangeOctaves}
        />
        <span className="text-[11px] font-mono text-stone-500">8</span>
      </div>
    </div>
  );
};
