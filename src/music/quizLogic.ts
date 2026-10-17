import {
  CHORD_BY_ID,
  INTERVAL_BY_ID,
  getPitchRange,
  midiToNoteName
} from './definitions.js';
import { ChordQuestion, IntervalQuestion, MelodicDirection, QuizAnswerFeedback } from '../types/music.js';

/**
 * Random integer between min and max (inclusive)
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Select a random item from array, avoiding recent repetition using an adaptive sliding-window history buffer.
 * If candidates has N items, avoids up to the last N - 1 items (capped at 4) to prevent shallow repeating loops.
 */
export function pickRandomItemAvoidRepeat(
  candidates: string[],
  previous?: string | string[]
): string {
  if (!candidates || candidates.length === 0) {
    throw new Error('Cannot pick from empty candidates list');
  }
  if (candidates.length === 1) {
    return candidates[0];
  }

  const history: string[] = Array.isArray(previous)
    ? previous
    : previous !== undefined
    ? [previous]
    : [];

  // Exclude up to candidates.length - 1 items (capped at 4) so we never starve candidate items
  const maxHistoryToExclude = Math.max(1, Math.min(candidates.length - 1, 4));
  const recentHistory = history.slice(-maxHistoryToExclude);

  // Filter candidates that are not in recent history, starting from fullest history window
  let pool: string[] = [];
  for (let count = recentHistory.length; count >= 1; count--) {
    const windowSlice = recentHistory.slice(-count);
    const filtered = candidates.filter(id => !windowSlice.includes(id));
    if (filtered.length > 0) {
      pool = filtered;
      break;
    }
  }

  if (pool.length === 0) {
    pool = candidates;
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Picks a diverse root MIDI note within [minRootMidi, maxRootMidi] avoiding:
 * 1. Immediate repetition of exact recent root notes (same register and pitch).
 * 2. Immediate repetition of recent pitch classes (semitones mod 12: C, C#, D, etc.).
 * Guarantees that the tonal landscape moves dynamically across the chromatic scale
 * and across different octaves within the selected range, avoiding shallow clumping.
 */
export function pickDiverseRootMidi(
  minRootMidi: number,
  maxRootMidi: number,
  recentRoots: number[] = []
): number {
  if (minRootMidi >= maxRootMidi) {
    return minRootMidi;
  }

  const allCandidates: number[] = [];
  for (let m = minRootMidi; m <= maxRootMidi; m++) {
    allCandidates.push(m);
  }

  if (allCandidates.length <= 1) {
    return allCandidates[0];
  }

  // 1. Try to exclude exact recent root MIDIs (sliding window of up to 4)
  const recentMidis = recentRoots.slice(-4);
  let pool = allCandidates.filter(m => !recentMidis.includes(m));
  if (pool.length === 0) {
    pool = allCandidates;
  }

  // 2. Try to exclude recent pitch classes (e.g. last 2 roots mod 12)
  // to ensure users don't hear C4 followed immediately by C3 or C5
  const recentPitchClasses = recentRoots.slice(-2).map(r => ((r % 12) + 12) % 12);
  const pcFiltered = pool.filter(m => !recentPitchClasses.includes(((m % 12) + 12) % 12));
  if (pcFiltered.length > 0) {
    pool = pcFiltered;
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Picks a balanced direction for Mode B interval playback:
 * - When ascending or descending is explicitly chosen, respects the choice.
 * - When 'both' is chosen, prevents long streaks of identical directions (max 2-3 in a row)
 *   while maintaining healthy, unpredictable variation.
 */
export function pickBalancedDirection(
  preference: MelodicDirection,
  recentDirections: ('ascending' | 'descending')[] = []
): 'ascending' | 'descending' {
  if (preference === 'ascending') return 'ascending';
  if (preference === 'descending') return 'descending';

  const recent = recentDirections.slice(-3);
  // Break streak if 3 identical in a row
  if (recent.length >= 3 && recent.every(d => d === 'ascending')) {
    return 'descending';
  }
  if (recent.length >= 3 && recent.every(d => d === 'descending')) {
    return 'ascending';
  }
  // Bias away if 2 identical in a row
  if (recent.length >= 2 && recent[recent.length - 1] === recent[recent.length - 2]) {
    const streakDirection = recent[recent.length - 1];
    const alternate = streakDirection === 'ascending' ? 'descending' : 'ascending';
    return Math.random() < 0.75 ? alternate : streakDirection;
  }

  return Math.random() < 0.5 ? 'ascending' : 'descending';
}

/**
 * Generates a chord question from the active chord types.
 * Guaranteed that the sound notes and correct answer come from the exact same chord definition,
 * and all chord notes stay within the selected pitch range [minMidi, maxMidi].
 * Utilizes multi-item history and chromatic pitch distribution to avoid shallow question loops.
 */
export function generateChordQuestion(
  activeChordIds: string[],
  previousChordId?: string | string[],
  forcedRootMidi?: number,
  pitchRangeOctaves: number = 2,
  recentRoots: number[] = []
): ChordQuestion {
  if (!activeChordIds || activeChordIds.length === 0) {
    throw new Error('At least one chord type must be active to generate a question');
  }

  const chosenId = pickRandomItemAvoidRepeat(activeChordIds, previousChordId);
  const chord = CHORD_BY_ID.get(chosenId);
  if (!chord) {
    throw new Error(`Chord definition not found for id: ${chosenId}`);
  }

  const range = getPitchRange(pitchRangeOctaves);
  const maxInterval = Math.max(...chord.intervals);
  const minRootMidi = range.minMidi;
  const maxRootMidi = range.maxMidi - maxInterval;

  const rootMidi = forcedRootMidi ?? pickDiverseRootMidi(minRootMidi, maxRootMidi, recentRoots);
  const rootName = midiToNoteName(rootMidi);
  const noteMidis = chord.intervals.map(offset => rootMidi + offset);
  const noteNames = noteMidis.map(midiToNoteName);

  return {
    chordId: chord.id,
    chord,
    rootMidi,
    rootName,
    noteMidis,
    noteNames
  };
}

/**
 * Generates an interval question from the active interval types.
 * Guaranteed that the sound notes and correct answer come from the exact same interval definition,
 * and both lower and upper notes stay within the selected pitch range [minMidi, maxMidi].
 * Supports ascending, descending, or balanced both directions (Mode B).
 */
export function generateIntervalQuestion(
  activeIntervalIds: string[],
  previousIntervalId?: string | string[],
  forcedRootMidi?: number,
  pitchRangeOctaves: number = 2,
  directionPreference: MelodicDirection = 'both',
  recentRoots: number[] = [],
  recentDirections: ('ascending' | 'descending')[] = []
): IntervalQuestion {
  if (!activeIntervalIds || activeIntervalIds.length === 0) {
    throw new Error('At least one interval must be active to generate a question');
  }

  const chosenId = pickRandomItemAvoidRepeat(activeIntervalIds, previousIntervalId);
  const interval = INTERVAL_BY_ID.get(chosenId);
  if (!interval) {
    throw new Error(`Interval definition not found for id: ${chosenId}`);
  }

  const range = getPitchRange(pitchRangeOctaves);
  const minRootMidi = range.minMidi;
  const maxRootMidi = range.maxMidi - interval.semitones;

  const rootMidi = forcedRootMidi ?? pickDiverseRootMidi(minRootMidi, maxRootMidi, recentRoots);
  const upperMidi = rootMidi + interval.semitones;
  const rootName = midiToNoteName(rootMidi);
  const upperName = midiToNoteName(upperMidi);

  const direction = pickBalancedDirection(directionPreference, recentDirections);

  const playMidis: [number, number] = direction === 'descending'
    ? [upperMidi, rootMidi]
    : [rootMidi, upperMidi];

  return {
    intervalId: interval.id,
    interval,
    rootMidi,
    rootName,
    upperMidi,
    upperName,
    direction,
    noteMidis: [rootMidi, upperMidi],
    playMidis,
    noteNames: [rootName, upperName]
  };
}

/**
 * Validates the user's answer against the target question
 */
export function validateAnswer(selectedId: string, correctId: string): QuizAnswerFeedback {
  return {
    answered: true,
    selectedId,
    isCorrect: selectedId === correctId,
    correctId
  };
}
