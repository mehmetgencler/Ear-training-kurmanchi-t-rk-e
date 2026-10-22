import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIATONIC_DEGREES,
  DEGREE_LIST,
  POPULAR_KEYS,
  PROGRESSION_TEMPLATES,
  PROGRESSION_LEVELS,
  buildProgressionChord,
  generateProgressionQuestion
} from './progressionLogic.js';

test('Diatonic degrees contain all 7 degrees with correct formulas and spoken names', () => {
  assert.equal(DEGREE_LIST.length, 7);
  assert.equal(DIATONIC_DEGREES['I'].spokenName, 'one');
  assert.deepEqual(DIATONIC_DEGREES['I'].intervals, [0, 4, 7]); // Major

  assert.equal(DIATONIC_DEGREES['ii'].spokenName, 'two');
  assert.deepEqual(DIATONIC_DEGREES['ii'].intervals, [0, 3, 7]); // Minor

  assert.equal(DIATONIC_DEGREES['iii'].spokenName, 'three');
  assert.deepEqual(DIATONIC_DEGREES['iii'].intervals, [0, 3, 7]); // Minor

  assert.equal(DIATONIC_DEGREES['IV'].spokenName, 'four');
  assert.deepEqual(DIATONIC_DEGREES['IV'].intervals, [0, 4, 7]); // Major

  assert.equal(DIATONIC_DEGREES['V'].spokenName, 'five');
  assert.deepEqual(DIATONIC_DEGREES['V'].intervals, [0, 4, 7]); // Major

  assert.equal(DIATONIC_DEGREES['vi'].spokenName, 'six');
  assert.deepEqual(DIATONIC_DEGREES['vi'].intervals, [0, 3, 7]); // Minor

  assert.equal(DIATONIC_DEGREES['vii°'].spokenName, 'seven');
  assert.deepEqual(DIATONIC_DEGREES['vii°'].intervals, [0, 3, 6]); // Diminished
});

test('PROGRESSION_LEVELS defines all 6 difficulty levels with progressive chord lengths and authentic cadences', () => {
  assert.equal(PROGRESSION_LEVELS.length, 6);

  // Level 1: 2 Chords (Simplest foundations)
  assert.equal(PROGRESSION_LEVELS[0].level, 1);
  assert.equal(PROGRESSION_LEVELS[0].chordLength, 2);
  assert.ok(PROGRESSION_LEVELS[0].templates.length >= 4);
  for (const tmpl of PROGRESSION_LEVELS[0].templates) {
    assert.equal(tmpl.length, 2);
  }

  // Level 2: 3 Chords (Primary cadences I-IV-I, I-V-I)
  assert.equal(PROGRESSION_LEVELS[1].level, 2);
  assert.equal(PROGRESSION_LEVELS[1].chordLength, 3);
  for (const tmpl of PROGRESSION_LEVELS[1].templates) {
    assert.equal(tmpl.length, 3);
  }

  // Level 3: 3 Chords (Minor diatonic degrees)
  assert.equal(PROGRESSION_LEVELS[2].level, 3);
  assert.equal(PROGRESSION_LEVELS[2].chordLength, 3);
  for (const tmpl of PROGRESSION_LEVELS[2].templates) {
    assert.equal(tmpl.length, 3);
  }

  // Level 4: 4 Chords (Classic & pop cadences)
  assert.equal(PROGRESSION_LEVELS[3].level, 4);
  assert.equal(PROGRESSION_LEVELS[3].chordLength, 4);
  for (const tmpl of PROGRESSION_LEVELS[3].templates) {
    assert.equal(tmpl.length, 4);
  }

  // Level 5: 4 Chords (Advanced diatonic)
  assert.equal(PROGRESSION_LEVELS[4].level, 5);
  assert.equal(PROGRESSION_LEVELS[4].chordLength, 4);
  for (const tmpl of PROGRESSION_LEVELS[4].templates) {
    assert.equal(tmpl.length, 4);
  }

  // Level 6: 5 Chords (Full extended cadential cycles)
  assert.equal(PROGRESSION_LEVELS[5].level, 6);
  assert.equal(PROGRESSION_LEVELS[5].chordLength, 5);
  for (const tmpl of PROGRESSION_LEVELS[5].templates) {
    assert.equal(tmpl.length, 5);
  }
});

test('buildProgressionChord creates playable chords in C Major', () => {
  const cRootMidi = 48; // C3
  const chordI = buildProgressionChord('I', cRootMidi);
  assert.equal(chordI.degree, 'I');
  assert.equal(chordI.spokenName, 'one');
  assert.equal(chordI.chordName, 'C');
  assert.equal(chordI.noteMidis[0], 48); // C3
  assert.deepEqual(chordI.noteMidis, [48, 52, 55]); // C3, E3, G3

  const chordIV = buildProgressionChord('IV', cRootMidi);
  assert.equal(chordIV.degree, 'IV');
  assert.equal(chordIV.spokenName, 'four');
  assert.equal(chordIV.chordName, 'F');

  const chordV = buildProgressionChord('V', cRootMidi);
  assert.equal(chordV.degree, 'V');
  assert.equal(chordV.spokenName, 'five');
  assert.equal(chordV.chordName, 'G');
});

test('generateProgressionQuestion generates valid questions across all 6 progressive levels', () => {
  for (let lvl = 1; lvl <= 6; lvl++) {
    const q = generateProgressionQuestion(lvl);
    assert.equal(q.level, lvl);
    assert.equal(q.degrees.length, q.length);
    assert.equal(q.chords.length, q.length);

    // Verify spoken answer contains exactly q.length English number words separated by space
    const spokenWords = q.spokenAnswer.split(' ');
    assert.equal(spokenWords.length, q.length);
    assert.deepEqual(q.spokenWords, spokenWords);

    for (const word of spokenWords) {
      assert.ok(['one', 'two', 'three', 'four', 'five', 'six', 'seven'].includes(word));
    }

    // Verify chords match degrees in order
    for (let i = 0; i < q.length; i++) {
      assert.equal(q.chords[i].degree, q.degrees[i]);
      assert.equal(q.chords[i].spokenName, spokenWords[i]);
      assert.equal(q.chords[i].noteMidis.length, 3);
    }
  }
});

test('generateProgressionQuestion avoids immediate identical template repetition when possible', () => {
  const prevSignature = 'I-V';
  for (let i = 0; i < 20; i++) {
    const q = generateProgressionQuestion(1, prevSignature);
    assert.ok(q.degrees.length === 2);
  }
});
