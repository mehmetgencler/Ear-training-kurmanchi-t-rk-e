import React, { useState, useEffect } from 'react';
import { Language, ChordMistakeRecord } from '../types/music.js';
import { CHORD_DEFINITIONS } from '../music/definitions.js';
import { TRANSLATIONS, getLocalizedChord } from '../i18n/translations.js';
import {
  loadChordMistakes,
  calculateMistakesSummary,
  clearChordMistakes,
} from '../storage/mistakesStorage.js';
import {
  BarChart3,
  Trash2,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';

interface ChordMistakesViewProps {
  language: Language;
  onNavigateToQuiz?: () => void;
  onMistakesUpdated?: () => void;
}

export const ChordMistakesView: React.FC<ChordMistakesViewProps> = ({
  language,
  onNavigateToQuiz,
  onMistakesUpdated,
}) => {
  const [records, setRecords] = useState<ChordMistakeRecord[]>(() => loadChordMistakes());
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);

  const t = TRANSLATIONS[language];

  // Reload records whenever component mounts or updates
  useEffect(() => {
    setRecords(loadChordMistakes());
  }, []);

  const summary = calculateMistakesSummary(records);

  const handleClearAll = () => {
    clearChordMistakes();
    setRecords([]);
    setShowConfirmClear(false);
    if (onMistakesUpdated) {
      onMistakesUpdated();
    }
  };

  // Format ISO timestamp into clean readable date/time
  const formatDate = (isoString: string | null): string => {
    if (!isoString) return t.neverRecorded;
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return new Intl.DateTimeFormat(language === 'ku' ? 'tr-TR' : 'tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const getChordInfo = (chordId: string) => {
    const def = CHORD_DEFINITIONS.find((c) => c.id === chordId);
    const defaultName = def ? def.name : chordId;
    const defaultShort = def ? def.shortName : '';
    const defaultDesc = def ? def.description : '';
    const localized = getLocalizedChord(chordId, language, defaultName, defaultShort, defaultDesc);
    return {
      name: localized.name,
      symbol: def ? def.symbol : localized.shortName,
      formula: def ? def.formula : '',
      description: localized.description,
    };
  };

  const mostMissedChordInfo = summary.mostMissedChordId
    ? getChordInfo(summary.mostMissedChordId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 tracking-tight">
                {t.mistakesTitle}
              </h2>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              {t.mistakesSubtitle}
            </p>
          </div>

          {records.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition self-start sm:self-auto cursor-pointer"
              aria-label={t.clearMistakesButton}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.clearMistakesButton}</span>
            </button>
          )}
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-stone-800/80">
          {/* Metric 1: Total Mistakes */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[11px] font-medium tracking-wide uppercase">
                {t.totalMistakesLabel}
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-300">
              {summary.totalMistakes}
            </div>
            <p className="text-[11px] text-stone-400">
              {t.uniqueChordsMissedLabel}: <span className="font-mono tabular-nums font-semibold text-stone-300">{summary.uniqueChordsMissed}</span>
            </p>
          </div>

          {/* Metric 2: Most Missed Chord */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[11px] font-medium tracking-wide uppercase">
                {t.mostMissedChordLabel}
              </span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-300 truncate">
              {mostMissedChordInfo ? mostMissedChordInfo.name : '—'}
            </div>
            <p className="text-[11px] text-stone-400 truncate">
              {mostMissedChordInfo
                ? `${mostMissedChordInfo.formula ? mostMissedChordInfo.formula + ' · ' : ''}${t.timesCount(
                    records.find((r) => r.chordId === summary.mostMissedChordId)?.mistakeCount ?? 0
                  )}`
                : t.neverRecorded}
            </p>
          </div>

          {/* Metric 3: Latest Mistake Date */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[11px] font-medium tracking-wide uppercase">
                {t.lastMistakeDateLabel}
              </span>
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <div className="text-sm sm:text-base font-semibold font-mono tabular-nums text-stone-200">
              {formatDate(summary.mostRecentMistakeDate)}
            </div>
            <p className="text-[11px] text-stone-400">
              {summary.mostRecentMistakeDate ? (language === 'ku' ? 'Tomarkirina herî dawî' : 'Son kaydedilen hata') : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content: Either Empty State or Charts + Ranked List */}
      {records.length === 0 ? (
        <section className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-stone-100">
              {t.noMistakesTitle}
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              {t.noMistakesDescription}
            </p>
          </div>

          {onNavigateToQuiz && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToQuiz}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>{t.startChordQuiz}</span>
              </button>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Section 1: Mistake Distribution Visual Bar Chart */}
          <section className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-stone-200 tracking-tight">
                {t.mistakeDistributionTitle}
              </h3>
              <p className="text-xs text-stone-400">
                {t.mistakeDistributionSubtitle}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {summary.items.map((item) => {
                const info = getChordInfo(item.chordId);
                return (
                  <div key={item.chordId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-200">{info.name}</span>
                        {info.formula && (
                          <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            {info.formula}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                        <span className="text-rose-400 font-bold">{item.mistakeCount}</span>
                        <span className="text-stone-500">({item.percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800/80">
                      <div
                        className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        role="progressbar"
                        aria-valuenow={item.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${info.name}: ${item.mistakeCount} mistakes`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Detailed Ranked Mistakes Breakdown */}
          <section className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-stone-200 tracking-tight">
                {t.rankedMistakesTitle}
              </h3>
              <p className="text-xs text-stone-400">
                {t.rankedMistakesSubtitle}
              </p>
            </div>

            {/* Desktop / Tablet Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-medium">
                    <th scope="col" className="py-2.5 px-3">
                      {t.chordTypeHeader}
                    </th>
                    <th scope="col" className="py-2.5 px-3">
                      {t.formulaHeader}
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right">
                      {t.mistakeCountHeader}
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right">
                      {t.percentageHeader}
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right">
                      {t.lastOccurredHeader}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {summary.items.map((item, index) => {
                    const info = getChordInfo(item.chordId);
                    return (
                      <tr
                        key={item.chordId}
                        className="hover:bg-stone-800/40 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-stone-500 text-[11px] w-4">
                              {index + 1}.
                            </span>
                            <span className="font-bold text-stone-100">{info.name}</span>
                            {info.symbol && (
                              <span className="text-[11px] font-mono text-stone-400">
                                ({info.symbol})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {info.formula ? (
                            <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {info.formula}
                            </span>
                          ) : (
                            <span className="text-stone-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-rose-300">
                          {item.mistakeCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-300">
                          {item.percentage}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-400">
                          {formatDate(item.lastMistakeDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Confirmation Modal for Clearing Mistakes */}
      {showConfirmClear && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-clear-title"
        >
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 id="confirm-clear-title" className="text-sm font-bold text-stone-100">
                  {t.confirmClearTitle}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="text-stone-400 hover:text-stone-200 p-1"
                aria-label={t.confirmCancel}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              {t.confirmClearMessage}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition cursor-pointer"
              >
                {t.confirmCancel}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow transition cursor-pointer"
              >
                {t.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
