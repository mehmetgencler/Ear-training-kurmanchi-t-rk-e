export type Instrument = 'acoustic-piano' | 'electric-piano' | 'piano';

export type ChordPlaybackMode = 'simultaneous' | 'sequential_then_simultaneous';

export type IntervalPlaybackMode = 'harmonic' | 'melodic' | 'melodic_ascending';

export type MelodicDirection = 'both' | 'ascending' | 'descending';

export type SectionType = 'chords' | 'progressions' | 'intervals' | 'mistakes';

export type Language = 'ku' | 'tr';

export interface ChordMistakeRecord {
  chordId: string;
  mistakeCount: number;
  lastMistakeDate: string; // ISO 8601 string
}

export interface MistakeSummaryItem extends ChordMistakeRecord {
  percentage: number;
}

export interface MistakesSummary {
  totalMistakes: number;
  uniqueChordsMissed: number;
  mostMissedChordId: string | null;
  mostRecentMistakeDate: string | null;
  items: MistakeSummaryItem[];
}

export interface ChordDefinition {
  id: string;
  name: string;
  shortName: string;
  formula: string; // Musical scale degree formula (e.g. "1 3 5", "1 m3 5 m7", "1 3 5 M7")
  intervals: number[]; // semitones relative to root
  category: 'three-note' | 'four-note';
  symbol: string;
  description: string;
}

export interface IntervalDefinition {
  id: string;
  name: string;
  shortName: string;
  semitones: number;
}

export interface ChordQuestion {
  chordId: string;
  chord: ChordDefinition;
  rootMidi: number;
  rootName: string;
  noteMidis: number[];
  noteNames: string[];
}

export interface IntervalQuestion {
  intervalId: string;
  interval: IntervalDefinition;
  rootMidi: number;
  rootName: string;
  upperMidi: number;
  upperName: string;
  direction: 'ascending' | 'descending';
  noteMidis: [number, number]; // [lower, upper]
  playMidis: [number, number]; // in order of playback
  noteNames: [string, string];
}

export interface QuizAnswerFeedback {
  answered: boolean;
  selectedId: string | null;
  isCorrect: boolean;
  correctId: string;
}

export interface PitchRangeDefinition {
  octaves: number;
  minMidi: number;
  maxMidi: number;
  label: string;
}

export type DiatonicDegree = 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°';

export interface ProgressionChord {
  degree: DiatonicDegree;
  spokenName: string; // "one", "two", "three", "four", "five", "six", "seven"
  rootName: string; // e.g. "C4", "F4", "G4"
  chordName: string; // e.g. "C", "F", "G", "Am", "Dm"
  noteMidis: number[];
  noteNames: string[];
}

export interface ProgressionQuestion {
  id: string;
  level: number; // 1 to 6
  length: number; // 2, 3, 4, 5 chords
  keyName: string; // e.g. "C Major"
  keyRootMidi: number;
  degrees: DiatonicDegree[];
  spokenAnswer: string; // e.g. "one four one"
  spokenWords: string[]; // ['one', 'four', 'one']
  chords: ProgressionChord[];
  tier: number; // For backward compatibility (2 | 3 | 4 | 5)
}


