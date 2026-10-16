import { ChordDefinition, IntervalDefinition, PitchRangeDefinition } from '../types/music.js';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Centrally defined chord types with exact semitone offsets from root.
 * Root-position voicings only.
 */
export const CHORD_DEFINITIONS: readonly ChordDefinition[] = [
  // Three-note chords
  {
    id: 'major',
    name: 'Major',
    shortName: 'Maj',
    intervals: [0, 4, 7],
    category: 'three-note',
    symbol: 'M',
    description: 'Root, Major 3rd, Perfect 5th (0, 4, 7)'
  },
  {
    id: 'minor',
    name: 'Minor',
    shortName: 'Min',
    intervals: [0, 3, 7],
    category: 'three-note',
    symbol: 'm',
    description: 'Root, Minor 3rd, Perfect 5th (0, 3, 7)'
  },
  {
    id: 'diminished',
    name: 'Diminished',
    shortName: 'Dim',
    intervals: [0, 3, 6],
    category: 'three-note',
    symbol: 'dim / °',
    description: 'Root, Minor 3rd, Diminished 5th (0, 3, 6)'
  },
  {
    id: 'augmented',
    name: 'Augmented',
    shortName: 'Aug',
    intervals: [0, 4, 8],
    category: 'three-note',
    symbol: 'aug / +',
    description: 'Root, Major 3rd, Augmented 5th (0, 4, 8)'
  },

  // Four-note chords
  {
    id: 'major_seventh',
    name: 'Major seventh',
    shortName: 'maj7',
    intervals: [0, 4, 7, 11],
    category: 'four-note',
    symbol: 'maj7 / M7',
    description: 'Root, Major 3rd, Perfect 5th, Major 7th (0, 4, 7, 11)'
  },
  {
    id: 'dominant_seventh',
    name: 'Dominant seventh',
    shortName: '7',
    intervals: [0, 4, 7, 10],
    category: 'four-note',
    symbol: '7',
    description: 'Root, Major 3rd, Perfect 5th, Minor 7th (0, 4, 7, 10)'
  },
  {
    id: 'minor_seventh',
    name: 'Minor seventh',
    shortName: 'm7',
    intervals: [0, 3, 7, 10],
    category: 'four-note',
    symbol: 'm7',
    description: 'Root, Minor 3rd, Perfect 5th, Minor 7th (0, 3, 7, 10)'
  },
  {
    id: 'half_diminished_seventh',
    name: 'Half-diminished seventh',
    shortName: 'm7b5',
    intervals: [0, 3, 6, 10],
    category: 'four-note',
    symbol: 'm7b5 / ø7',
    description: 'Root, Minor 3rd, Diminished 5th, Minor 7th (0, 3, 6, 10)'
  }
] as const;

/**
 * Centrally defined intervals with exact semitone distances.
 * Ascending intervals only.
 */
export const INTERVAL_DEFINITIONS: readonly IntervalDefinition[] = [
  {
    id: 'minor_second',
    name: 'Minor second',
    shortName: 'm2',
    semitones: 1
  },
  {
    id: 'major_second',
    name: 'Major second',
    shortName: 'M2',
    semitones: 2
  },
  {
    id: 'minor_third',
    name: 'Minor third',
    shortName: 'm3',
    semitones: 3
  },
  {
    id: 'major_third',
    name: 'Major third',
    shortName: 'M3',
    semitones: 4
  },
  {
    id: 'perfect_fourth',
    name: 'Perfect fourth',
    shortName: 'P4',
    semitones: 5
  },
  {
    id: 'tritone',
    name: 'Tritone',
    shortName: 'TT',
    semitones: 6
  },
  {
    id: 'perfect_fifth',
    name: 'Perfect fifth',
    shortName: 'P5',
    semitones: 7
  },
  {
    id: 'minor_sixth',
    name: 'Minor sixth',
    shortName: 'm6',
    semitones: 8
  },
  {
    id: 'major_sixth',
    name: 'Major sixth',
    shortName: 'M6',
    semitones: 9
  },
  {
    id: 'minor_seventh',
    name: 'Minor seventh',
    shortName: 'm7',
    semitones: 10
  },
  {
    id: 'major_seventh',
    name: 'Major seventh',
    shortName: 'M7',
    semitones: 11
  },
  {
    id: 'octave',
    name: 'Octave',
    shortName: 'P8',
    semitones: 12
  }
] as const;

// Lookups by ID
export const CHORD_BY_ID = new Map<string, ChordDefinition>(
  CHORD_DEFINITIONS.map(c => [c.id, c])
);

export const INTERVAL_BY_ID = new Map<string, IntervalDefinition>(
  INTERVAL_DEFINITIONS.map(i => [i.id, i])
);

/**
 * Convert MIDI note number (e.g. 60 = Middle C) to frequency in Hz (A4 = 440Hz standard)
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Format MIDI note number to note name with octave (e.g. 60 -> C4)
 */
export function midiToNoteName(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

// Recommended root ranges (legacy defaults for 2 octaves):
export const CHORD_ROOT_MIN_MIDI = 48; // C3
export const CHORD_ROOT_MAX_MIDI = 64; // E4

export const INTERVAL_ROOT_MIN_MIDI = 48; // C3
export const INTERVAL_ROOT_MAX_MIDI = 65; // F4

/**
 * Question Pitch Ranges for 2 to 8 octaves.
 *
 * Expansion rule:
 * - Default setting is 2 octaves: C3–C5 (MIDI 48 to 72), symmetric around Middle C (C4 = 60).
 * - For 3 to 6 octaves, the range alternates expanding downward into the bass (C2, C1)
 *   and upward into the treble (C6, C7).
 * - The bass floor is capped at C1 (MIDI 24, ~32.7 Hz), the lowest C on an acoustic piano
 *   and the lower boundary for audible pitch training across common speakers and headphones.
 * - For 7 and 8 octaves, because the C1 bass floor is preserved, expansion extends upward
 *   into the treble register (C8, C9).
 * - As a result, even ranges 2, 4, and 6 are centered on C4 (MIDI 60), while odd ranges (3, 5, 7)
 *   and 8 octaves have midpoints determined by the C1 audible bass floor constraint.
 */
export const PITCH_RANGES: Record<number, PitchRangeDefinition> = {
  2: { octaves: 2, minMidi: 48, maxMidi: 72, label: 'C3–C5' },
  3: { octaves: 3, minMidi: 36, maxMidi: 72, label: 'C2–C5' },
  4: { octaves: 4, minMidi: 36, maxMidi: 84, label: 'C2–C6' },
  5: { octaves: 5, minMidi: 24, maxMidi: 84, label: 'C1–C6' },
  6: { octaves: 6, minMidi: 24, maxMidi: 96, label: 'C1–C7' },
  7: { octaves: 7, minMidi: 24, maxMidi: 108, label: 'C1–C8' },
  8: { octaves: 8, minMidi: 24, maxMidi: 120, label: 'C1–C9' },
};

export function getPitchRange(octaves: number): PitchRangeDefinition {
  const clamped = Math.max(2, Math.min(8, Math.round(octaves)));
  return PITCH_RANGES[clamped] ?? PITCH_RANGES[2];
}

