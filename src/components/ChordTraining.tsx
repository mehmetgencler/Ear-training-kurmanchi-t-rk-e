import React, { useState, useEffect, useCallback } from 'react';
import {
  Instrument,
  ChordPlaybackMode,
  ChordQuestion,
  QuizAnswerFeedback,
  Language,
} from '../types/music.js';
import { CHORD_DEFINITIONS } from '../music/definitions.js';
import { generateChordQuestion, validateAnswer } from '../music/quizLogic.js';
import { audioEngine, AUDIO_TIMING } from '../audio/audioEngine.js';
import { TRANSLATIONS, getLocalizedChord } from '../i18n/translations.js';
import { recordChordMistake } from '../storage/mistakesStorage.js';
import { Volume2, Play, ArrowRight, RotateCcw, CheckCircle2, XCircle, Settings2, Clock } from 'lucide-react';

interface ChordTrainingProps {
  instrument: Instrument;
  activeChordIds: string[];
  setActiveChordIds: React.Dispatch<React.SetStateAction<string[]>>;
  pitchRangeOctaves: number;
  language: Language;
  onMistakeRecorded?: (chordId: string) => void;
}

export const ChordTraining: React.FC<ChordTrainingProps> = ({
  instrument,
  activeChordIds,
  setActiveChordIds,
  pitchRangeOctaves,
  language,
  onMistakeRecorded,
}) => {
  const t = TRANSLATIONS[language];
  const [playbackMode, setPlaybackMode] = useState<ChordPlaybackMode>('simultaneous');
  // Chord sustain duration in seconds (default 2.6s, adjustable from 1.6s to 4.0s)
  const [chordSustain, setChordSustain] = useState<number>(AUDIO_TIMING.SIMULTANEOUS_CHORD_DURATION);
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<ChordQuestion | null>(null);
  const [feedback, setFeedback] = useState<QuizAnswerFeedback | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioErrorNotice, setAudioErrorNotice] = useState<string | null>(null);
  // Multi-item history buffer to prevent repetition and ensure deep question pool exploration
  const [recentHistory, setRecentHistory] = useState<{
    chordIds: string[];
    rootMidis: number[];
  }>({ chordIds: [], rootMidis: [] });

  // Toggle active/inactive state of a chord type
  const toggleChordActive = (chordId: string) => {
    setActiveChordIds((prev) => {
      if (prev.includes(chordId)) {
        return prev.filter((id) => id !== chordId);
      } else {
        return [...prev, chordId];
      }
    });
  };

  const selectAllChords = () => {
    setActiveChordIds(CHORD_DEFINITIONS.map((c) => c.id));
  };

  const clearAllChords = () => {
    setActiveChordIds([]);
  };

  // Play audio safely
  const playCurrentQuestion = useCallback(
    async (
      question: ChordQuestion,
      modeToUse: ChordPlaybackMode,
      sustain: number = chordSustain
    ) => {
      try {
        setIsPlaying(true);
        setAudioErrorNotice(null);
        await audioEngine.unlockAudio();
        await audioEngine.playChord(question.noteMidis, modeToUse, instrument, sustain);
      } catch (err) {
        console.error('Audio playback failed:', err);
        setAudioErrorNotice(t.audioTroubleshootNotice);
      } finally {
        setIsPlaying(false);
      }
    },
    [instrument, chordSustain, t.audioTroubleshootNotice]
  );

  // Direct manual enable button handler
  const handleEnableAudio = async () => {
    try {
      await audioEngine.unlockAudio();
      setAudioErrorNotice(null);
      if (currentQuestion) {
        await playCurrentQuestion(currentQuestion, playbackMode, chordSustain);
      }
    } catch (err) {
      console.warn('Manual audio unlock retry failed:', err);
    }
  };

  // Start new quiz
  const handleStartQuiz = () => {
    if (activeChordIds.length === 0) return;
    // Hardware unlock immediately in user touch/click stack
    audioEngine.unlockAudio().catch(() => {});
    const newQuestion = generateChordQuestion(
      activeChordIds,
      recentHistory.chordIds,
      undefined,
      pitchRangeOctaves,
      recentHistory.rootMidis
    );
    setCurrentQuestion(newQuestion);
    setFeedback(null);
    setIsQuizActive(true);
    setRecentHistory({
      chordIds: [newQuestion.chordId],
      rootMidis: [newQuestion.rootMidi],
    });
    playCurrentQuestion(newQuestion, playbackMode, chordSustain);
  };

  // Next question
  const handleNextQuestion = () => {
    if (activeChordIds.length === 0) return;
    audioEngine.unlockAudio().catch(() => {});
    const nextQ = generateChordQuestion(
      activeChordIds,
      recentHistory.chordIds,
      undefined,
      pitchRangeOctaves,
      recentHistory.rootMidis
    );
    setCurrentQuestion(nextQ);
    setFeedback(null);
    setRecentHistory((prev) => ({
      chordIds: [...prev.chordIds, nextQ.chordId].slice(-6),
      rootMidis: [...prev.rootMidis, nextQ.rootMidi].slice(-6),
    }));
    playCurrentQuestion(nextQ, playbackMode, chordSustain);
  };

  // Replay question audio
  const handleReplay = () => {
    if (currentQuestion) {
      audioEngine.unlockAudio().catch(() => {});
      playCurrentQuestion(currentQuestion, playbackMode, chordSustain);
    }
  };

  // User submits an answer
  const handleSelectAnswer = async (chordId: string) => {
    if (!currentQuestion || (feedback && feedback.answered)) return;
    await audioEngine.unlockAudio();
    const result = validateAnswer(chordId, currentQuestion.chordId);
    setFeedback(result);

    // If answer is incorrect, record the target chord as a mistake
    if (!result.isCorrect) {
      recordChordMistake(currentQuestion.chordId);
      if (onMistakeRecorded) {
        onMistakeRecorded(currentQuestion.chordId);
      }
    }
  };

  // If playback mode changes during quiz, allow instant testing with current question
  const handleModeChange = async (newMode: ChordPlaybackMode) => {
    setPlaybackMode(newMode);
    if (isQuizActive && currentQuestion) {
      await audioEngine.unlockAudio();
      playCurrentQuestion(currentQuestion, newMode, chordSustain);
    }
  };

  // Stop sound if component unmounts
  useEffect(() => {
    return () => {
      audioEngine.stopAllPlayback();
    };
  }, []);

  const threeNoteChords = CHORD_DEFINITIONS.filter((c) => c.category === 'three-note');
  const fourNoteChords = CHORD_DEFINITIONS.filter((c) => c.category === 'four-note');

  return (
    <div className="space-y-6">
      {/* Playback Mode Control */}
      <section className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-stone-100">{t.chordPlaybackModeTitle}</h2>
            <p className="text-xs text-stone-400">{t.chordPlaybackModeSubtitle}</p>
          </div>
          <div className="inline-flex p-1 bg-stone-950 border border-stone-800 rounded-lg w-full sm:w-auto" role="radiogroup" aria-label={t.chordPlaybackModeTitle}>
            <button
              type="button"
              role="radio"
              aria-checked={playbackMode === 'simultaneous'}
              onClick={() => handleModeChange('simultaneous')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                playbackMode === 'simultaneous'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              {t.chordModeSimultaneous}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={playbackMode === 'sequential_then_simultaneous'}
              onClick={() => handleModeChange('sequential_then_simultaneous')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                playbackMode === 'sequential_then_simultaneous'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              {t.chordModeSequential}
            </button>
          </div>
        </div>

        {/* Chord Sustain Duration Adjustment */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-stone-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-stone-200">{t.chordSustainLabel}</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {chordSustain.toFixed(1)}s
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {t.chordSustainSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <input
              type="range"
              min="1.6"
              max="4.0"
              step="0.1"
              value={chordSustain}
              onChange={(e) => {
                const newSustain = parseFloat(e.target.value);
                setChordSustain(newSustain);
                if (isQuizActive && currentQuestion) {
                  playCurrentQuestion(currentQuestion, playbackMode, newSustain);
                }
              }}
              className="w-full sm:w-36 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              aria-label={t.chordSustainLabel}
            />
            <div className="flex gap-1 shrink-0">
              {[2.0, 2.6, 3.2].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setChordSustain(preset);
                    if (isQuizActive && currentQuestion) {
                      playCurrentQuestion(currentQuestion, playbackMode, preset);
                    }
                  }}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                    Math.abs(chordSustain - preset) < 0.05
                      ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                  aria-label={`${preset}s`}
                >
                  {preset.toFixed(1)}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Workspace or Setup */}
      {isQuizActive && currentQuestion ? (
        <section className="bg-stone-900 border border-amber-500/30 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
          {/* Quiz Top Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-semibold tracking-wide text-stone-200 uppercase">
                {t.chordQuizInProgress}
              </span>
              <span className="text-xs text-stone-500 hidden sm:inline">
                {t.activeTypesCount(activeChordIds.length)}
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
            <div className="p-3.5 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{audioErrorNotice}</span>
              </div>
              <button
                type="button"
                onClick={handleEnableAudio}
                className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                {t.enableAudioButton}
              </button>
            </div>
          )}

          {/* Prompt Header */}
          <div className="text-center py-2">
            <h3 className="text-lg sm:text-xl font-bold text-stone-100">
              {t.whichChordDidYouHear}
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              {t.selectChordSubtitle}
            </p>
          </div>

          {/* Answer Choices Grid: ALL 8 chord types remain visible as answer choices */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3" role="group" aria-label={t.whichChordDidYouHear}>
            {CHORD_DEFINITIONS.map((chord) => {
              const loc = getLocalizedChord(chord.id, language, chord.name, chord.shortName, chord.description);
              const isAnswered = feedback !== null && feedback.answered;
              const isSelected = feedback?.selectedId === chord.id;
              const isTarget = currentQuestion.chordId === chord.id;

              let buttonStyle = 'bg-stone-950 border-stone-800 text-stone-200 hover:bg-stone-800/80 hover:border-stone-700';

              if (isAnswered) {
                if (isTarget) {
                  // Correct answer is highlighted green
                  buttonStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-md';
                } else if (isSelected && !feedback.isCorrect) {
                  // User's wrong selection is highlighted red
                  buttonStyle = 'bg-red-950/70 border-red-500 text-red-200 ring-2 ring-red-500/50 shadow-md';
                } else {
                  // Other unselected chords slightly dimmed
                  buttonStyle = 'bg-stone-950/50 border-stone-800/60 text-stone-500 opacity-60';
                }
              }

              return (
                <button
                  key={chord.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectAnswer(chord.id)}
                  className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border text-center transition-all ${buttonStyle} focus:outline-none focus:ring-2 focus:ring-amber-500/40`}
                >
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    {loc.name}
                  </span>
                  <span className="text-[11px] text-stone-400 mt-0.5">
                    ({loc.shortName} · <span className="font-mono text-amber-400/90 font-medium">{chord.formula}</span>)
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
                        {getLocalizedChord(currentQuestion.chord.id, language, currentQuestion.chord.name, currentQuestion.chord.shortName, currentQuestion.chord.description).name}
                      </strong> ({getLocalizedChord(currentQuestion.chord.id, language, currentQuestion.chord.name, currentQuestion.chord.shortName, currentQuestion.chord.description).shortName})
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    {t.notesPlayed} <span className="font-mono text-stone-200">{currentQuestion.noteNames.join(' - ')}</span> ({t.rootLabel} {currentQuestion.rootName})
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    <span className="text-stone-300 font-medium">{t.formulaLabel}</span>{' '}
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      {currentQuestion.chord.formula}
                    </span>{' '}
                    <span className="text-stone-400 ml-1">
                      ({getLocalizedChord(currentQuestion.chord.id, language, currentQuestion.chord.name, currentQuestion.chord.shortName, currentQuestion.chord.description).description})
                    </span>
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

      {/* Chord Selection Controls */}
      <section className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-100">
              {t.activeChordSelectionTitle}
            </h2>
            <p className="text-xs text-stone-400">
              {t.activeChordSelectionSubtitle(activeChordIds.length, CHORD_DEFINITIONS.length)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllChords}
              className="text-xs text-stone-400 hover:text-stone-200 underline underline-offset-4 px-2 py-1"
            >
              {t.selectAll}
            </button>
            <span className="text-stone-700">|</span>
            <button
              type="button"
              onClick={clearAllChords}
              className="text-xs text-stone-400 hover:text-stone-200 underline underline-offset-4 px-2 py-1"
            >
              {t.clearAll}
            </button>
          </div>
        </div>

        {/* 3-Note Chords */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
            {t.threeNoteChordsHeading}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {threeNoteChords.map((chord) => {
              const loc = getLocalizedChord(chord.id, language, chord.name, chord.shortName, chord.description);
              const isActive = activeChordIds.includes(chord.id);
              return (
                <button
                  key={chord.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleChordActive(chord.id)}
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
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">
                      {loc.shortName}
                    </span>
                    <span className="text-stone-600">·</span>
                    <span className="text-[11px] font-mono font-bold text-amber-400/95 tracking-wide">
                      {chord.formula}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Note Chords */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
            {t.fourNoteChordsHeading}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {fourNoteChords.map((chord) => {
              const loc = getLocalizedChord(chord.id, language, chord.name, chord.shortName, chord.description);
              const isActive = activeChordIds.includes(chord.id);
              return (
                <button
                  key={chord.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleChordActive(chord.id)}
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
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">
                      {loc.shortName}
                    </span>
                    <span className="text-stone-600">·</span>
                    <span className="text-[11px] font-mono font-bold text-amber-400/95 tracking-wide">
                      {chord.formula}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Notice if active */}
        {audioErrorNotice && (
          <div className="p-3.5 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{audioErrorNotice}</span>
            </div>
            <button
              type="button"
              onClick={handleEnableAudio}
              className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition cursor-pointer"
            >
              {t.enableAudioButton}
            </button>
          </div>
        )}

        {/* Start Quiz Action */}
        <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-400 text-center sm:text-left">
            {activeChordIds.length === 0 ? (
              <span className="text-amber-400 font-medium">
                {t.pleaseSelectChordAlert}
              </span>
            ) : (
              <span>
                {t.readyWithChords(activeChordIds.length)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={activeChordIds.length === 0}
            onClick={handleStartQuiz}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold text-sm rounded-xl transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isQuizActive ? t.restartChordQuiz : t.startChordQuiz}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
