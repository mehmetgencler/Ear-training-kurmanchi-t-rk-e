import React, { useState, useEffect, useCallback } from 'react';
import {
  Instrument,
  IntervalPlaybackMode,
  IntervalQuestion,
  MelodicDirection,
  QuizAnswerFeedback,
  Language,
} from '../types/music.js';
import { INTERVAL_DEFINITIONS } from '../music/definitions.js';
import { generateIntervalQuestion, validateAnswer } from '../music/quizLogic.js';
import { audioEngine } from '../audio/audioEngine.js';
import { TRANSLATIONS, getLocalizedInterval } from '../i18n/translations.js';
import { Volume2, Play, ArrowRight, RotateCcw, CheckCircle2, XCircle, Settings2, Clock } from 'lucide-react';

interface IntervalTrainingProps {
  instrument: Instrument;
  activeIntervalIds: string[];
  setActiveIntervalIds: React.Dispatch<React.SetStateAction<string[]>>;
  pitchRangeOctaves: number;
  language: Language;
}

export const IntervalTraining: React.FC<IntervalTrainingProps> = ({
  instrument,
  activeIntervalIds,
  setActiveIntervalIds,
  pitchRangeOctaves,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [playbackMode, setPlaybackMode] = useState<IntervalPlaybackMode>('melodic');
  const [melodicDirection, setMelodicDirection] = useState<MelodicDirection>('both');
  // Space / time between the two notes of an interval in seconds (default 1.0s, adjustable from 0.5s to 2.0s)
  const [noteSpacing, setNoteSpacing] = useState<number>(1.0);
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<IntervalQuestion | null>(null);
  const [feedback, setFeedback] = useState<QuizAnswerFeedback | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioErrorNotice, setAudioErrorNotice] = useState<string | null>(null);
  // Multi-item history buffer to prevent repetition and ensure deep question pool exploration
  const [recentHistory, setRecentHistory] = useState<{
    intervalIds: string[];
    rootMidis: number[];
    directions: ('ascending' | 'descending')[];
  }>({ intervalIds: [], rootMidis: [], directions: [] });

  const isMelodic = playbackMode === 'melodic' || playbackMode === 'melodic_ascending';

  // Toggle active/inactive
  const toggleIntervalActive = (intervalId: string) => {
    setActiveIntervalIds((prev) => {
      if (prev.includes(intervalId)) {
        return prev.filter((id) => id !== intervalId);
      } else {
        return [...prev, intervalId];
      }
    });
  };

  const selectAllIntervals = () => {
    setActiveIntervalIds(INTERVAL_DEFINITIONS.map((i) => i.id));
  };

  const clearAllIntervals = () => {
    setActiveIntervalIds([]);
  };

  // Play audio safely
  const playCurrentQuestion = useCallback(
    async (
      question: IntervalQuestion,
      modeToUse: IntervalPlaybackMode,
      spacing: number = noteSpacing
    ) => {
      try {
        setIsPlaying(true);
        setAudioErrorNotice(null);
        await audioEngine.playInterval(question.playMidis, modeToUse, instrument, spacing);
      } catch (err) {
        console.error('Audio playback failed:', err);
        setAudioErrorNotice(t.audioErrorNotice);
      } finally {
        setIsPlaying(false);
      }
    },
    [instrument, noteSpacing, t.audioErrorNotice]
  );

  // Start new quiz
  const handleStartQuiz = () => {
    if (activeIntervalIds.length === 0) return;
    const newQuestion = generateIntervalQuestion(
      activeIntervalIds,
      recentHistory.intervalIds,
      undefined,
      pitchRangeOctaves,
      melodicDirection,
      recentHistory.rootMidis,
      recentHistory.directions
    );
    setCurrentQuestion(newQuestion);
    setFeedback(null);
    setIsQuizActive(true);
    setRecentHistory({
      intervalIds: [newQuestion.intervalId],
      rootMidis: [newQuestion.rootMidi],
      directions: [newQuestion.direction],
    });
    playCurrentQuestion(newQuestion, playbackMode, noteSpacing);
  };

  // Next question
  const handleNextQuestion = () => {
    if (activeIntervalIds.length === 0) return;
    const nextQ = generateIntervalQuestion(
      activeIntervalIds,
      recentHistory.intervalIds,
      undefined,
      pitchRangeOctaves,
      melodicDirection,
      recentHistory.rootMidis,
      recentHistory.directions
    );
    setCurrentQuestion(nextQ);
    setFeedback(null);
    setRecentHistory((prev) => ({
      intervalIds: [...prev.intervalIds, nextQ.intervalId].slice(-8),
      rootMidis: [...prev.rootMidis, nextQ.rootMidi].slice(-8),
      directions: [...prev.directions, nextQ.direction].slice(-6),
    }));
    playCurrentQuestion(nextQ, playbackMode, noteSpacing);
  };

  // Replay question audio
  const handleReplay = () => {
    if (currentQuestion) {
      playCurrentQuestion(currentQuestion, playbackMode, noteSpacing);
    }
  };

  // User submits an answer
  const handleSelectAnswer = (intervalId: string) => {
    if (!currentQuestion || (feedback && feedback.answered)) return;
    const result = validateAnswer(intervalId, currentQuestion.intervalId);
    setFeedback(result);
  };

  // Mode change
  const handleModeChange = (newMode: IntervalPlaybackMode) => {
    setPlaybackMode(newMode);
    if (isQuizActive && currentQuestion) {
      playCurrentQuestion(currentQuestion, newMode, noteSpacing);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopAllPlayback();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Playback Mode Control */}
      <section className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-stone-100">{t.intervalPlaybackModeTitle}</h2>
            <p className="text-xs text-stone-400">{t.intervalPlaybackModeSubtitle}</p>
          </div>
          <div className="inline-flex p-1 bg-stone-950 border border-stone-800 rounded-lg w-full sm:w-auto" role="radiogroup" aria-label={t.intervalPlaybackModeTitle}>
            <button
              type="button"
              role="radio"
              aria-checked={playbackMode === 'harmonic'}
              onClick={() => handleModeChange('harmonic')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                playbackMode === 'harmonic'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              {t.intervalModeHarmonic}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isMelodic}
              onClick={() => handleModeChange('melodic')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                isMelodic
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              {t.intervalModeMelodic}
            </button>
          </div>
        </div>

        {isMelodic && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-stone-800">
              <div className="text-xs text-stone-400">
                <span className="font-medium text-stone-300">{t.melodicDirectionLabel}</span>
                <span className="ml-1 text-stone-500 hidden sm:inline">{t.melodicDirectionSubtitle}</span>
              </div>
              <div className="inline-flex p-1 bg-stone-950 border border-stone-800 rounded-lg w-full sm:w-auto" role="radiogroup" aria-label={t.melodicDirectionLabel}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={melodicDirection === 'both'}
                  onClick={() => setMelodicDirection('both')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 text-xs rounded-md transition-all ${
                    melodicDirection === 'both'
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                  }`}
                >
                  {t.melodicDirectionBoth}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={melodicDirection === 'ascending'}
                  onClick={() => setMelodicDirection('ascending')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 text-xs rounded-md transition-all ${
                    melodicDirection === 'ascending'
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                  }`}
                >
                  {t.melodicDirectionAscending}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={melodicDirection === 'descending'}
                  onClick={() => setMelodicDirection('descending')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 text-xs rounded-md transition-all ${
                    melodicDirection === 'descending'
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                  }`}
                >
                  {t.melodicDirectionDescending}
                </button>
              </div>
            </div>

            {/* Time / Space Between Notes Adjustment */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-stone-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-stone-200">{t.noteSpacingLabel}</span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {noteSpacing.toFixed(1)}s
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {t.noteSpacingSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={noteSpacing}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setNoteSpacing(val);
                    if (isQuizActive && currentQuestion) {
                      playCurrentQuestion(currentQuestion, playbackMode, val);
                    }
                  }}
                  aria-label={t.noteSpacingLabel}
                  className="flex-1 sm:w-32 accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
                <div className="inline-flex gap-1 shrink-0" role="group" aria-label="Presets">
                  {[0.7, 1.0, 1.4, 1.8].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setNoteSpacing(sec);
                        if (isQuizActive && currentQuestion) {
                          playCurrentQuestion(currentQuestion, playbackMode, sec);
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded-md transition font-medium ${
                        Math.abs(noteSpacing - sec) < 0.05
                          ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                          : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Quiz Active View */}
      {isQuizActive && currentQuestion ? (
        <section className="bg-stone-900 border border-amber-500/30 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
          {/* Top Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-semibold tracking-wide text-stone-200 uppercase">
                {t.intervalQuizInProgress}
              </span>
              <span className="text-xs text-stone-500 hidden sm:inline">
                {t.activeIntervalsCount(activeIntervalIds.length)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReplay}
                disabled={isPlaying}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 font-medium text-xs rounded-lg border border-stone-700 transition active:scale-95 disabled:opacity-50"
                aria-label={t.replaySound}
              >
                <Volume2 className="w-4 h-4" />
                <span>{t.replaySound}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioEngine.stopAllPlayback();
                  setIsQuizActive(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs rounded-lg border border-stone-800 transition"
                aria-label={t.settings}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{t.settings}</span>
              </button>
            </div>
          </div>

          {audioErrorNotice && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
              {audioErrorNotice}
            </div>
          )}

          {/* Prompt Header */}
          <div className="text-center py-2">
            <h3 className="text-lg sm:text-xl font-bold text-stone-100">
              {t.whichIntervalDidYouHear}
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              {t.selectIntervalSubtitle}
            </p>
          </div>

          {/* Answer Choices Grid: ALL 12 intervals remain visible as answer choices */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3" role="group" aria-label={t.whichIntervalDidYouHear}>
            {INTERVAL_DEFINITIONS.map((interval) => {
              const loc = getLocalizedInterval(interval.id, language, interval.name, interval.shortName);
              const isAnswered = feedback !== null && feedback.answered;
              const isSelected = feedback?.selectedId === interval.id;
              const isTarget = currentQuestion.intervalId === interval.id;

              let buttonStyle = 'bg-stone-950 border-stone-800 text-stone-200 hover:bg-stone-800/80 hover:border-stone-700';

              if (isAnswered) {
                if (isTarget) {
                  // Correct answer highlighted green
                  buttonStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-md';
                } else if (isSelected && !feedback.isCorrect) {
                  // User's wrong selection highlighted red
                  buttonStyle = 'bg-red-950/70 border-red-500 text-red-200 ring-2 ring-red-500/50 shadow-md';
                } else {
                  buttonStyle = 'bg-stone-950/50 border-stone-800/60 text-stone-500 opacity-60';
                }
              }

              return (
                <button
                  key={interval.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectAnswer(interval.id)}
                  className={`flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl border text-center transition-all ${buttonStyle} focus:outline-none focus:ring-2 focus:ring-amber-500/40`}
                >
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    {loc.name}
                  </span>
                  <span className="text-[11px] text-stone-400 mt-0.5">
                    ({loc.shortName} · {t.semitonesUnit(interval.semitones)})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback Card */}
          {feedback && feedback.answered && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                feedback.isCorrect
                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-100'
                  : 'bg-stone-950 border-amber-600/40 text-stone-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {feedback.isCorrect ? t.correct : t.incorrect}
                    </span>
                    <span className="text-xs text-stone-300">
                      {t.answerLabel} <strong className="text-amber-400">
                        {getLocalizedInterval(currentQuestion.interval.id, language, currentQuestion.interval.name, currentQuestion.interval.shortName).name}
                      </strong> ({getLocalizedInterval(currentQuestion.interval.id, language, currentQuestion.interval.name, currentQuestion.interval.shortName).shortName})
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    {t.notesPlayed}{' '}
                    <span className="font-mono text-stone-200 font-medium">
                      {currentQuestion.direction === 'descending' ? currentQuestion.upperName : currentQuestion.rootName}
                    </span>
                    {' → '}
                    <span className="font-mono text-stone-200 font-medium">
                      {currentQuestion.direction === 'descending' ? currentQuestion.rootName : currentQuestion.upperName}
                    </span>
                    {playbackMode === 'harmonic' ? (
                      <span className="text-stone-400 text-xs ml-1.5">{t.harmonicBadge}</span>
                    ) : (
                      <span className="text-amber-400/90 text-xs ml-1.5 font-medium">
                        {currentQuestion.direction === 'descending' ? t.descendingBadge : t.ascendingBadge}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {t.distanceLabel} {t.semitonesUnit(currentQuestion.interval.semitones)} ({currentQuestion.direction === 'descending' ? t.descendingBadge : t.ascendingBadge})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReplay}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg transition border border-stone-700 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.replayButton}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition shadow-md inline-flex items-center justify-center gap-1.5"
                >
                  <span>{t.nextQuestionButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {/* Interval Selection Controls */}
      <section className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-100">
              {t.activeIntervalSelectionTitle}
            </h2>
            <p className="text-xs text-stone-400">
              {t.activeIntervalSelectionSubtitle(activeIntervalIds.length, INTERVAL_DEFINITIONS.length)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllIntervals}
              className="text-xs text-stone-400 hover:text-stone-200 underline underline-offset-4 px-2 py-1"
            >
              {t.selectAll}
            </button>
            <span className="text-stone-700">|</span>
            <button
              type="button"
              onClick={clearAllIntervals}
              className="text-xs text-stone-400 hover:text-stone-200 underline underline-offset-4 px-2 py-1"
            >
              {t.clearAll}
            </button>
          </div>
        </div>

        {/* 12 Intervals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {INTERVAL_DEFINITIONS.map((interval) => {
            const loc = getLocalizedInterval(interval.id, language, interval.name, interval.shortName);
            const isActive = activeIntervalIds.includes(interval.id);
            return (
              <button
                key={interval.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggleIntervalActive(interval.id)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/60 text-stone-100 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{loc.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isActive
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {isActive ? t.statusActive : t.statusOff}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  {loc.shortName} · {t.semitonesUnit(interval.semitones)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Start Quiz Action */}
        <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-400 text-center sm:text-left">
            {activeIntervalIds.length === 0 ? (
              <span className="text-amber-400 font-medium">
                {t.pleaseSelectIntervalAlert}
              </span>
            ) : (
              <span>
                {t.readyWithIntervals(activeIntervalIds.length)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={activeIntervalIds.length === 0}
            onClick={handleStartQuiz}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold text-sm rounded-xl transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isQuizActive ? t.restartIntervalQuiz : t.startIntervalQuiz}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
