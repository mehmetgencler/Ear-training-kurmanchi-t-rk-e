import { useState } from 'react';
import { Instrument, SectionType, Language } from './types/music.js';
import { CHORD_DEFINITIONS, INTERVAL_DEFINITIONS } from './music/definitions.js';
import { InstrumentSelector } from './components/InstrumentSelector.tsx';
import { PitchRangeControl } from './components/PitchRangeControl.tsx';
import { ChordTraining } from './components/ChordTraining.tsx';
import { IntervalTraining } from './components/IntervalTraining.tsx';
import { audioEngine } from './audio/audioEngine.js';
import { TRANSLATIONS } from './i18n/translations.js';
import { Music2, Layers, Languages } from 'lucide-react';

export default function App() {
  // GUI language: Default is Kurdish (Kurmancî in Turkey), secondary is Turkish (Türkçe in Turkey)
  const [language, setLanguage] = useState<Language>('ku');

  // Shared instrument selection across both sections (Acoustic Piano & Electric Piano)
  const [instrument, setInstrument] = useState<Instrument>('acoustic-piano');

  // Shared question pitch range in octaves (2 to 8, default 2)
  const [pitchRangeOctaves, setPitchRangeOctaves] = useState<number>(2);

  // Navigation section
  const [activeSection, setActiveSection] = useState<SectionType>('chords');

  // Preserve selections across section changes during session
  // Default to all active initially for immediate readiness
  const [activeChordIds, setActiveChordIds] = useState<string[]>(() =>
    CHORD_DEFINITIONS.map((c) => c.id)
  );

  const [activeIntervalIds, setActiveIntervalIds] = useState<string[]>(() =>
    INTERVAL_DEFINITIONS.map((i) => i.id)
  );

  const t = TRANSLATIONS[language];

  const handleInstrumentChange = (newInstrument: Instrument) => {
    setInstrument(newInstrument);
  };

  const handleSectionChange = (section: SectionType) => {
    audioEngine.stopAllPlayback();
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <header className="border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  {t.appTitle}
                </h1>
                <span className="inline-flex items-center text-[10px] sm:text-[11px] font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {t.madeBy}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Top Actions: Language Switcher & Section Navigation */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Language Switcher at the top */}
            <div
              className="inline-flex items-center p-1 bg-stone-950 border border-stone-800 rounded-xl"
              role="radiogroup"
              aria-label={t.languageSelectLabel}
            >
              <Languages className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-1" />
              <button
                type="button"
                role="radio"
                aria-checked={language === 'ku'}
                onClick={() => setLanguage('ku')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  language === 'ku'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
                aria-label="Kurdî / Kurmancî"
              >
                Kurmancî
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={language === 'tr'}
                onClick={() => setLanguage('tr')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  language === 'tr'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
                aria-label="Türkçe"
              >
                Türkçe
              </button>
            </div>

            {/* Section Navigation Tabs */}
            <nav className="inline-flex p-1 bg-stone-950 border border-stone-800 rounded-xl" aria-label="Training Sections">
              <button
                type="button"
                onClick={() => handleSectionChange('chords')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeSection === 'chords'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.chordTrainingTab}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSectionChange('intervals')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeSection === 'intervals'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <Music2 className="w-3.5 h-3.5" />
                <span>{t.intervalTrainingTab}</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Global Settings: Instrument & Pitch Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InstrumentSelector
            currentInstrument={instrument}
            onSelectInstrument={handleInstrumentChange}
            language={language}
          />
          <PitchRangeControl
            pitchRangeOctaves={pitchRangeOctaves}
            onChangePitchRange={setPitchRangeOctaves}
            language={language}
          />
        </div>

        {/* Section View */}
        {activeSection === 'chords' ? (
          <ChordTraining
            instrument={instrument}
            activeChordIds={activeChordIds}
            setActiveChordIds={setActiveChordIds}
            pitchRangeOctaves={pitchRangeOctaves}
            language={language}
          />
        ) : (
          <IntervalTraining
            instrument={instrument}
            activeIntervalIds={activeIntervalIds}
            setActiveIntervalIds={setActiveIntervalIds}
            pitchRangeOctaves={pitchRangeOctaves}
            language={language}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-stone-800/60 py-4 text-center text-xs text-stone-500 px-4">
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
}
