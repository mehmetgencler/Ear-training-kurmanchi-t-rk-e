import { DiatonicDegree, ProgressionChord, ProgressionQuestion } from '../types/music.js';
import { midiToNoteName } from './definitions.js';

export interface DegreeDefinition {
  degree: DiatonicDegree;
  semitoneOffset: number;
  intervals: number[]; // relative to degree root
  spokenName: string;
  qualitySuffix: string;
}

export const DIATONIC_DEGREES: Record<DiatonicDegree, DegreeDefinition> = {
  'I': {
    degree: 'I',
    semitoneOffset: 0,
    intervals: [0, 4, 7], // Major
    spokenName: 'one',
    qualitySuffix: '',
  },
  'ii': {
    degree: 'ii',
    semitoneOffset: 2,
    intervals: [0, 3, 7], // Minor
    spokenName: 'two',
    qualitySuffix: 'm',
  },
  'iii': {
    degree: 'iii',
    semitoneOffset: 4,
    intervals: [0, 3, 7], // Minor
    spokenName: 'three',
    qualitySuffix: 'm',
  },
  'IV': {
    degree: 'IV',
    semitoneOffset: 5,
    intervals: [0, 4, 7], // Major
    spokenName: 'four',
    qualitySuffix: '',
  },
  'V': {
    degree: 'V',
    semitoneOffset: 7,
    intervals: [0, 4, 7], // Major
    spokenName: 'five',
    qualitySuffix: '',
  },
  'vi': {
    degree: 'vi',
    semitoneOffset: 9,
    intervals: [0, 3, 7], // Minor
    spokenName: 'six',
    qualitySuffix: 'm',
  },
  'vii°': {
    degree: 'vii°',
    semitoneOffset: 11,
    intervals: [0, 3, 6], // Diminished
    spokenName: 'seven',
    qualitySuffix: 'dim',
  },
};

export const DEGREE_LIST: DiatonicDegree[] = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

export interface KeyDefinition {
  name: string; // e.g. "C Major"
  rootName: string; // "C"
  rootMidi: number; // e.g. 48 (C3)
}

export const POPULAR_KEYS: KeyDefinition[] = [
  { name: 'C Major', rootName: 'C', rootMidi: 48 }, // C3
  { name: 'G Major', rootName: 'G', rootMidi: 55 }, // G3
  { name: 'F Major', rootName: 'F', rootMidi: 53 }, // F3
  { name: 'D Major', rootName: 'D', rootMidi: 50 }, // D3
  { name: 'A Major', rootName: 'A', rootMidi: 57 }, // A3
];

export interface ProgressionLevelDefinition {
  level: number; // 1 to 6
  chordLength: 2 | 3 | 4 | 5;
  badge: string;
  nameKey: string;
  descKey: string;
  templates: DiatonicDegree[][];
}

/**
 * 6-level structured progression curriculum from simplest 2-chord cadences
 * to advanced 5-chord cadential phrases.
 */
export const PROGRESSION_LEVELS: ProgressionLevelDefinition[] = [
  {
    level: 1,
    chordLength: 2,
    badge: 'Level 1 · 2 Chords',
    nameKey: 'progLevel1Name',
    descKey: 'progLevel1Desc',
    templates: [
      ['I', 'V'],
      ['I', 'IV'],
      ['V', 'I'],
      ['IV', 'I'],
    ],
  },
  {
    level: 2,
    chordLength: 3,
    badge: 'Level 2 · 3 Chords',
    nameKey: 'progLevel2Name',
    descKey: 'progLevel2Desc',
    templates: [
      ['I', 'IV', 'I'],
      ['I', 'V', 'I'],
      ['I', 'IV', 'V'],
      ['I', 'V', 'IV'],
      ['IV', 'V', 'I'],
    ],
  },
  {
    level: 3,
    chordLength: 3,
    badge: 'Level 3 · 3 Chords',
    nameKey: 'progLevel3Name',
    descKey: 'progLevel3Desc',
    templates: [
      ['I', 'ii', 'V'],
      ['ii', 'V', 'I'],
      ['I', 'vi', 'IV'],
      ['I', 'vi', 'V'],
      ['I', 'vi', 'I'],
      ['I', 'iii', 'IV'],
    ],
  },
  {
    level: 4,
    chordLength: 4,
    badge: 'Level 4 · 4 Chords',
    nameKey: 'progLevel4Name',
    descKey: 'progLevel4Desc',
    templates: [
      ['I', 'IV', 'V', 'I'],
      ['I', 'V', 'vi', 'IV'],
      ['I', 'vi', 'IV', 'V'],
      ['I', 'IV', 'I', 'V'],
      ['I', 'V', 'IV', 'V'],
    ],
  },
  {
    level: 5,
    chordLength: 4,
    badge: 'Level 5 · 4 Chords',
    nameKey: 'progLevel5Name',
    descKey: 'progLevel5Desc',
    templates: [
      ['I', 'vi', 'ii', 'V'],
      ['ii', 'V', 'I', 'vi'],
      ['vi', 'IV', 'I', 'V'],
      ['I', 'iii', 'IV', 'V'],
      ['I', 'IV', 'ii', 'V'],
      ['vi', 'ii', 'V', 'I'],
    ],
  },
  {
    level: 6,
    chordLength: 5,
    badge: 'Level 6 · 5 Chords',
    nameKey: 'progLevel6Name',
    descKey: 'progLevel6Desc',
    templates: [
      ['I', 'vi', 'ii', 'V', 'I'],
      ['I', 'IV', 'ii', 'V', 'I'],
      ['I', 'iii', 'IV', 'V', 'I'],
      ['I', 'V', 'vi', 'IV', 'I'],
      ['I', 'IV', 'I', 'V', 'I'],
      ['ii', 'V', 'I', 'vi', 'V'],
      ['I', 'vi', 'IV', 'V', 'I'],
    ],
  },
];

export const PROGRESSION_TEMPLATES: Record<2 | 3 | 4 | 5, DiatonicDegree[][]> = {
  2: PROGRESSION_LEVELS[0].templates,
  3: [...PROGRESSION_LEVELS[1].templates, ...PROGRESSION_LEVELS[2].templates],
  4: [...PROGRESSION_LEVELS[3].templates, ...PROGRESSION_LEVELS[4].templates],
  5: PROGRESSION_LEVELS[5].templates,
};

const NOTE_ROOT_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Calculates notes and names for a diatonic chord in a given major key.
 */
export function buildProgressionChord(degree: DiatonicDegree, keyRootMidi: number): ProgressionChord {
  const def = DIATONIC_DEGREES[degree];
  let chordRootMidi = keyRootMidi + def.semitoneOffset;

  // Keep chord roots in a comfortable ear training register: [48, 64] (C3 to E4)
  while (chordRootMidi > 64) {
    chordRootMidi -= 12;
  }
  while (chordRootMidi < 45) {
    chordRootMidi += 12;
  }

  const noteMidis = def.intervals.map(interval => chordRootMidi + interval);
  const noteNames = noteMidis.map(midiToNoteName);

  const rootPitchClass = ((chordRootMidi % 12) + 12) % 12;
  const rootLetter = NOTE_ROOT_NAMES[rootPitchClass];
  const chordName = `${rootLetter}${def.qualitySuffix}`;

  return {
    degree,
    spokenName: def.spokenName,
    rootName: midiToNoteName(chordRootMidi),
    chordName,
    noteMidis,
    noteNames,
  };
}

/**
 * Generates a progression question for a specific level (1-6) or chord count.
 * Avoids immediate template repetition to ensure fresh, diverse ear practice.
 */
export function generateProgressionQuestion(
  levelOrTier: number = 1,
  previousTemplateSignature?: string,
  keyChoice?: KeyDefinition
): ProgressionQuestion {
  // Determine target level (1 to 6)
  let levelDef: ProgressionLevelDefinition;
  if (levelOrTier >= 1 && levelOrTier <= 6) {
    levelDef = PROGRESSION_LEVELS[levelOrTier - 1];
  } else if (levelOrTier === 2) {
    levelDef = PROGRESSION_LEVELS[0];
  } else if (levelOrTier === 3) {
    levelDef = PROGRESSION_LEVELS[1];
  } else if (levelOrTier === 4) {
    levelDef = PROGRESSION_LEVELS[3];
  } else {
    levelDef = PROGRESSION_LEVELS[5];
  }

  const templates = levelDef.templates;
  if (!templates || templates.length === 0) {
    throw new Error(`No templates found for level ${levelDef.level}`);
  }

  // Filter templates avoiding immediate identical signature
  const candidates = templates.filter(tmpl => tmpl.join('-') !== previousTemplateSignature);
  const pool = candidates.length > 0 ? candidates : templates;
  const chosenDegrees = pool[Math.floor(Math.random() * pool.length)];

  const selectedKey = keyChoice ?? POPULAR_KEYS[Math.floor(Math.random() * POPULAR_KEYS.length)];

  const chords = chosenDegrees.map(deg => buildProgressionChord(deg, selectedKey.rootMidi));
  const spokenWords = chords.map(c => c.spokenName);
  const spokenAnswer = spokenWords.join(' ');

  const id = `prog_lvl${levelDef.level}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return {
    id,
    level: levelDef.level,
    length: chosenDegrees.length,
    keyName: selectedKey.name,
    keyRootMidi: selectedKey.rootMidi,
    degrees: [...chosenDegrees],
    spokenAnswer,
    spokenWords,
    chords,
    tier: chosenDegrees.length,
  };
}
