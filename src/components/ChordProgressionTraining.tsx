import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Instrument, Language, DiatonicDegree, ProgressionQuestion } from '../types/music.js';
import {
  generateProgressionQuestion,
  DEGREE_LIST,
  PROGRESSION_LEVELS,
  ProgressionLevelDefinition
} from '../music/progressionLogic.js';
import { audioEngine } from '../audio/audioEngine.js';
import { speechEngine } from '../audio/speechEngine.js';
import { TRANSLATIONS } from '../i18n/translations.js';
import {
  Play,
  RotateCcw,
  ArrowRight,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  HelpCircle,
  TrendingUp,
  Sliders,
  Award
} from 'lucide-react';

interface ChordProgressionTrainingProps {
  instrument: Instrument;
  language: Language;
}

type PlaybackStage = 'idle' | 'pass1' | 'pause1' | 'pass2' | 'pause2' | 'speaking' | 'revealed';

export const ChordProgressionTraining: React.FC<ChordProgressionTrainingProps> = ({
  instrument,
  language,
}) => {
  const t = TRANSLATIONS[language];

  // Progression test modes: 'progressive' (auto difficulty step-by-step) | 'fixed' (user selectable level)
  const [testMode, setTestMode] = useState<'progressive' | 'fixed'>('progressive');

  // Selected level: 1 to 6 (Level 1 starts simplest with 2 chords)
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [masteryCount, setMasteryCount] = useState<number>(0);
  const [justMastered, setJustMastered] = useState<boolean>(false);

  const [currentQuestion, setCurrentQuestion] = useState<ProgressionQuestion | null>(null);
  const [playbackStage, setPlaybackStage] = useState<PlaybackStage>('idle');
  const [activeChordIndex, setActiveChordIndex] = useState<number | null>(null);
  const [chordPace, setChordPace] = useState<number>(1.3);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [userGuesses, setUserGuesses] = useState<(DiatonicDegree | null)[]>([]);
  const [audioErrorNotice, setAudioErrorNotice] = useState<string | null>(null);

  // Keep ref to avoid stale closure in async loops
  const runLoopIdRef = useRef<number>(0);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers and speech on unmount
  useEffect(() => {
    // Preload genuine female voice audio on mount
    speechEngine.preloadVoiceBuffers().catch(() => {});

    return () => {
      runLoopIdRef.current++;
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      audioEngine.stopAllPlayback();
      speechEngine.stopSpeech();
    };
  }, []);

  // Sleep utility with cancellation token
  const sleep = (ms: number, loopId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (runLoopIdRef.current === loopId) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, ms);
      if (runLoopIdRef.current !== loopId) {
        clearTimeout(timer);
        resolve(false);
      }
    });
  };

  /**
   * Complete playback sequence: Pass 1 -> Pause -> Pass 2 -> Pause -> Female Voice Spoken Reveal
   */
  const executeProgressionSequence = useCallback(
    async (question: ProgressionQuestion) => {
      const currentLoopId = ++runLoopIdRef.current;
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

      try {
        setAudioErrorNotice(null);
        await audioEngine.unlockAudio();

        // Pass 1: First listening pass
        setPlaybackStage('pass1');
        await audioEngine.playProgression(
          question.chords.map((c) => c.noteMidis),
          instrument,
          chordPace,
          (idx) => {
            if (runLoopIdRef.current === currentLoopId) {
              setActiveChordIndex(idx);
            }
          }
        );

        if (runLoopIdRef.current !== currentLoopId) return;
        setActiveChordIndex(null);

        // Pause between pass 1 and pass 2 (~1.8 seconds)
        setPlaybackStage('pause1');
        const proceedAfterPause1 = await sleep(1800, currentLoopId);
        if (!proceedAfterPause1 || runLoopIdRef.current !== currentLoopId) return;

        // Pass 2: Confirmation listening pass
        setPlaybackStage('pass2');
        await audioEngine.playProgression(
          question.chords.map((c) => c.noteMidis),
          instrument,
          chordPace,
          (idx) => {
            if (runLoopIdRef.current === currentLoopId) {
              setActiveChordIndex(idx);
            }
          }
        );

        if (runLoopIdRef.current !== currentLoopId) return;
        setActiveChordIndex(null);

        // Pause before speech reveal (~1.4 seconds)
        setPlaybackStage('pause2');
        const proceedAfterPause2 = await sleep(1400, currentLoopId);
        if (!proceedAfterPause2 || runLoopIdRef.current !== currentLoopId) return;

        // Spoken answer reveal by female voice
        setPlaybackStage('speaking');
        if (voiceEnabled) {
          const spokenWords = question.spokenWords || question.chords.map((c) => c.spokenName);
          await speechEngine.speakProgressionAnswer(spokenWords);
        }

        if (runLoopIdRef.current !== currentLoopId) return;
        setPlaybackStage('revealed');

        // Increment mastery counter if in progressive mode
        if (testMode === 'progressive') {
          setMasteryCount((prev) => prev + 1);
        }

        // Optional auto-advance after spoken answer
        if (autoAdvance) {
          autoAdvanceTimerRef.current = setTimeout(() => {
            if (runLoopIdRef.current === currentLoopId) {
              handleNextProgression();
            }
          }, 3600);
        }
      } catch (err) {
        console.error('Progression playback error:', err);
        setAudioErrorNotice(t.audioTroubleshootNotice);
        setPlaybackStage('idle');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instrument, chordPace, voiceEnabled, autoAdvance, testMode, t.audioTroubleshootNotice]
  );

  // Start new progression for a given level
  const startNewProgression = useCallback(
    (targetLevel: number = currentLevel) => {
      runLoopIdRef.current++;
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      speechEngine.stopSpeech();
      audioEngine.stopAllPlayback();

      const newQ = generateProgressionQuestion(
        targetLevel,
        currentQuestion?.degrees.join('-')
      );
      setCurrentQuestion(newQ);
      setUserGuesses(new Array(newQ.length).fill(null));
      setActiveChordIndex(null);
      executeProgressionSequence(newQ);
    },
    [currentLevel, currentQuestion, executeProgressionSequence]
  );

  const handleNextProgression = () => {
    // In progressive mode, if 2 questions are completed at this level, promote to next level
    if (testMode === 'progressive' && masteryCount >= 2 && currentLevel < 6) {
      const nextLvl = currentLevel + 1;
      setCurrentLevel(nextLvl);
      setMasteryCount(0);
      setJustMastered(true);
      setTimeout(() => setJustMastered(false), 4500);
      startNewProgression(nextLvl);
    } else {
      startNewProgression(currentLevel);
    }
  };

  const handleLevelSelect = (lvl: number) => {
    setCurrentLevel(lvl);
    setMasteryCount(0);
    setJustMastered(false);
    startNewProgression(lvl);
  };

  const handleReplay = () => {
    if (currentQuestion) {
      executeProgressionSequence(currentQuestion);
    }
  };

  const handleGuessDegree = (degree: DiatonicDegree) => {
    if (!currentQuestion) return;
    const firstEmptyIndex = userGuesses.findIndex((g) => g === null);
    if (firstEmptyIndex !== -1) {
      const newGuesses = [...userGuesses];
      newGuesses[firstEmptyIndex] = degree;
      setUserGuesses(newGuesses);
    }
  };

  const handleClearGuesses = () => {
    if (currentQuestion) {
      setUserGuesses(new Array(currentQuestion.length).fill(null));
    }
  };

  // Test female voice button handler
  const handleTestVoice = async () => {
    if (isTestingVoice) return;
    setIsTestingVoice(true);
    try {
      await audioEngine.unlockAudio();
      await speechEngine.testVoice();
    } finally {
      setIsTestingVoice(false);
    }
  };

  const activeLevelDef = PROGRESSION_LEVELS[currentLevel - 1] || PROGRESSION_LEVELS[0];

  const getLevelName = (lvlDef: ProgressionLevelDefinition) => {
    const key = lvlDef.nameKey as keyof typeof t;
    return typeof t[key] === 'string' ? (t[key] as string) : lvlDef.badge;
  };

  const getLevelDesc = (lvlDef: ProgressionLevelDefinition) => {
    const key = lvlDef.descKey as keyof typeof t;
    return typeof t[key] === 'string' ? (t[key] as string) : '';
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">{t.progressionTitle}</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t.levelBadge(currentLevel, activeLevelDef.chordLength)}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{t.progressionSubtitle}</p>
          </div>

          {/* Test Voice Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={isTestingVoice}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                isTestingVoice
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                  : 'bg-stone-950 border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-white'
              }`}
              title="Test hearing the female English voice"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isTestingVoice ? 'text-amber-400' : 'text-stone-400'}`} />
              <span>{isTestingVoice ? t.testingVoice : t.testVoiceButton}</span>
            </button>
          </div>
        </div>

        {/* Mode Selector: Progressive Mastery (Starts simple and gets harder) vs Free Fixed Level */}
        <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-stone-200">{t.progressionModeLabel}:</span>
            </div>
            <div className="inline-flex p-1 bg-stone-900 border border-stone-800 rounded-lg">
              <button
                type="button"
                onClick={() => setTestMode('progressive')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  testMode === 'progressive'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {t.progressiveMasteryMode}
              </button>
              <button
                type="button"
                onClick={() => setTestMode('fixed')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  testMode === 'fixed'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {t.fixedLevelMode}
              </button>
            </div>
          </div>

          {/* 6-Level Curriculum Grid */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span className="font-semibold text-stone-300">{t.progressionTiersLabel} (6 Ast / 6 Seviye):</span>
              {testMode === 'progressive' && (
                <span className="text-amber-400 font-mono">
                  {currentLevel < 6 ? `Pirs: ${masteryCount}/2 -> Asta ${currentLevel + 1}` : 'Asta Dawî'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5" role="group" aria-label="Difficulty Levels">
              {PROGRESSION_LEVELS.map((lvlDef) => {
                const isCurrent = currentLevel === lvlDef.level;
                return (
                  <button
                    key={lvlDef.level}
                    type="button"
                    onClick={() => handleLevelSelect(lvlDef.level)}
                    className={`p-2 rounded-lg border text-left transition relative ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-200">
                        {t.levelPrefix} {lvlDef.level}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-stone-950 text-amber-400">
                        {lvlDef.chordLength} Akor
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 truncate mt-1">
                      {getLevelName(lvlDef).split(':')[1] || getLevelName(lvlDef)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Level Description Banner */}
            <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
              <div className="text-xs">
                <span className="font-bold text-amber-400">{getLevelName(activeLevelDef)}</span>
                <span className="text-stone-400 ml-2 hidden sm:inline">·</span>
                <span className="text-stone-400 block sm:inline sm:ml-2 text-[11px]">
                  {getLevelDesc(activeLevelDef)}
                </span>
              </div>
              {currentLevel < 6 && (
                <button
                  type="button"
                  onClick={() => handleLevelSelect(currentLevel + 1)}
                  className="shrink-0 text-[11px] px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded font-medium transition inline-flex items-center gap-1"
                >
                  <span>{t.nextLevelButton}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Level Mastered Celebration Alert */}
            {justMastered && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.levelMasteredAlert}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Interactive Training Area */}
      {playbackStage === 'idle' ? (
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-stone-100">
              {t.progressionTitle}
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              {t.progressionSubtitle}
            </p>
            <div className="pt-2 text-xs text-stone-400 flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>{t.voiceNotice}</span>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => startNewProgression(currentLevel)}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-stone-950" />
              <span>{t.startProgressionQuiz}</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 space-y-5">
          {/* Status Header: Playback Stage Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  playbackStage === 'revealed'
                    ? 'bg-emerald-400'
                    : playbackStage === 'speaking'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span className="text-xs sm:text-sm font-semibold text-stone-200">
                {playbackStage === 'pass1' && t.pass1Playing}
                {playbackStage === 'pause1' && t.pauseBetweenPasses}
                {playbackStage === 'pass2' && t.pass2Playing}
                {playbackStage === 'pause2' && t.waitingForSpeech}
                {playbackStage === 'speaking' && (
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                    <span>Dengê Jinê Dibêje... / Speaking...</span>
                  </span>
                )}
                {playbackStage === 'revealed' && (
                  <span className="text-emerald-400 font-semibold">{t.speechAnnounced}</span>
                )}
              </span>
              {currentQuestion && (
                <span className="text-xs text-stone-500">
                  · {t.keyLabel} <strong className="text-stone-300 font-mono">{currentQuestion.keyName}</strong>
                </span>
              )}
            </div>

            {/* Playback Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-1.5 rounded-lg border text-xs transition ${
                  voiceEnabled
                    ? 'bg-stone-800 border-stone-700 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-500'
                }`}
                title={voiceEnabled ? 'Voice enabled' : 'Voice muted'}
                aria-label="Toggle voice"
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="sr-only">Voice</span>
              </button>

              <button
                type="button"
                onClick={handleReplay}
                disabled={playbackStage === 'pass1' || playbackStage === 'pass2' || playbackStage === 'speaking'}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 text-xs font-medium rounded-lg border border-stone-700 transition disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.replayProgression}</span>
              </button>

              <button
                type="button"
                onClick={handleNextProgression}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>{t.nextProgression}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Audio Troubleshoot Notice */}
          {audioErrorNotice && (
            <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-200">
              {audioErrorNotice}
            </div>
          )}

          {/* Progression Cards Display */}
          {currentQuestion && (
            <div
              className={`grid gap-2.5 sm:gap-3.5 ${
                currentQuestion.length === 2
                  ? 'grid-cols-2 max-w-sm mx-auto'
                  : currentQuestion.length === 3
                  ? 'grid-cols-3 max-w-md mx-auto'
                  : currentQuestion.length === 4
                  ? 'grid-cols-2 sm:grid-cols-4 max-w-xl mx-auto'
                  : 'grid-cols-2 sm:grid-cols-5'
              }`}
            >
              {currentQuestion.chords.map((chord, idx) => {
                const isCurrentlySounding = activeChordIndex === idx;
                const isRevealed = playbackStage === 'speaking' || playbackStage === 'revealed';
                const userGuess = userGuesses[idx];
                const isGuessCorrect = userGuess === chord.degree;

                return (
                  <div
                    key={`${currentQuestion.id}_chord_${idx}`}
                    className={`rounded-2xl border p-4 text-center transition-all duration-200 relative flex flex-col justify-between min-h-[140px] sm:min-h-[155px] ${
                      isCurrentlySounding
                        ? 'bg-amber-500/25 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.03]'
                        : isRevealed
                        ? 'bg-stone-950 border-stone-800'
                        : 'bg-stone-950/70 border-stone-800/80'
                    }`}
                  >
                    {/* Index Label */}
                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                      <span>#{idx + 1}</span>
                      {userGuess && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isRevealed
                              ? isGuessCorrect
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {userGuess}
                        </span>
                      )}
                    </div>

                    {/* Middle: Degree reveal or mysterious placeholder */}
                    <div className="py-2">
                      {isRevealed ? (
                        <div className="space-y-1 animate-fadeIn">
                          <div className="text-2xl sm:text-3xl font-black font-serif text-amber-300">
                            {chord.degree}
                          </div>
                          <div className="text-xs font-bold text-stone-200">
                            {chord.chordName}
                          </div>
                          <div className="text-[11px] font-mono text-amber-400/90">
                            &quot;{chord.spokenName}&quot;
                          </div>
                        </div>
                      ) : (
                        <div className="text-2xl sm:text-3xl font-bold text-stone-600 font-mono">
                          {userGuess ? userGuess : '?'}
                        </div>
                      )}
                    </div>

                    {/* Bottom notes hint */}
                    <div className="text-[10px] font-mono text-stone-500">
                      {isRevealed ? chord.noteNames.join(' ') : '···'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Spoken Answer Announcement Banner */}
          {currentQuestion && (playbackStage === 'speaking' || playbackStage === 'revealed') && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center animate-fadeIn">
              <span className="text-xs text-stone-400 mr-2">{t.spokenAnswerLabel}</span>
              <span className="text-xs sm:text-sm font-mono font-black text-amber-300 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                {currentQuestion.spokenAnswer}
              </span>
            </div>
          )}

          {/* Interactive Guess Buttons (Optional degree participation before reveal) */}
          <div className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>{t.guessDegreesLabel}</span>
              {userGuesses.some((g) => g !== null) && (
                <button
                  type="button"
                  onClick={handleClearGuesses}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  {t.clearGuess}
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {DEGREE_LIST.map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => handleGuessDegree(deg)}
                  className="w-10 sm:w-12 h-9 sm:h-10 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 font-serif font-bold text-xs sm:text-sm text-stone-200 transition active:scale-95"
                >
                  {deg}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pace & Rhythm Control */}
      <section className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-stone-200">{t.progressionPaceLabel}</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {chordPace.toFixed(1)}s
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {t.progressionPaceSubtitle}
            </p>
          </div>

          <div className="flex gap-1.5">
            {[1.0, 1.3, 1.7].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setChordPace(preset)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition ${
                  Math.abs(chordPace - preset) < 0.05
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {preset.toFixed(1)}s
              </button>
            ))}
          </div>
        </div>

        {/* Auto-Advance Toggle */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-800 text-xs">
          <div>
            <span className="font-semibold text-stone-300">{t.autoAdvanceLabel}</span>
            <p className="text-[11px] text-stone-500">{t.autoAdvanceSubtitle}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoAdvance}
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              autoAdvance ? 'bg-amber-500' : 'bg-stone-800'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoAdvance ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
};
