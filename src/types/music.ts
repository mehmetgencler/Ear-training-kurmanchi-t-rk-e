export type Instrument = 'acoustic-piano' | 'electric-piano' | 'piano';

export type ChordPlaybackMode = 'simultaneous' | 'sequential_then_simultaneous';

export type IntervalPlaybackMode = 'harmonic' | 'melodic' | 'melodic_ascending';

export type MelodicDirection = 'both' | 'ascending' | 'descending';

export type SectionType = 'chords' | 'intervals';

export type Language = 'ku' | 'tr';

export interface ChordDefinition {
  id: string;
  name: string;
  shortName: string;
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

