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
 * Select a random item from array, avoiding immediate repetition of previousId if possible
 */
export function pickRandomItemAvoidRepeat(candidates: string[], previousId?: string): string {
  if (candidates.length === 0) {
    throw new Error('Cannot pick from empty candidates list');
  }
  if (candidates.length === 1) {
    return candidates[0];
  }
  const filtered = candidates.filter(id => id !== previousId);
  const pool = filtered.length > 0 ? filtered : candidates;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Generates a chord question from the active chord types.
 * Guaranteed that the sound notes and correct answer come from the exact same chord definition,
 * and all chord notes stay within the selected pitch range [minMidi, maxMidi].
 */
export function generateChordQuestion(
  activeChordIds: string[],
  previousChordId?: string,
  forcedRootMidi?: number,
  pitchRangeOctaves: number = 2
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

  const rootMidi = forcedRootMidi ?? getRandomInt(minRootMidi, maxRootMidi);
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
 * Supports ascending, descending, or both directions (Mode B).
 */
export function generateIntervalQuestion(
  activeIntervalIds: string[],
  previousIntervalId?: string,
  forcedRootMidi?: number,
  pitchRangeOctaves: number = 2,
  directionPreference: MelodicDirection = 'both'
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

  const rootMidi = forcedRootMidi ?? getRandomInt(minRootMidi, maxRootMidi);
  const upperMidi = rootMidi + interval.semitones;
  const rootName = midiToNoteName(rootMidi);
  const upperName = midiToNoteName(upperMidi);

  let direction: 'ascending' | 'descending';
  if (directionPreference === 'ascending') {
    direction = 'ascending';
  } else if (directionPreference === 'descending') {
    direction = 'descending';
  } else {
    direction = Math.random() < 0.5 ? 'ascending' : 'descending';
  }

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
