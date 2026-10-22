import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHORD_DEFINITIONS,
  INTERVAL_DEFINITIONS,
  CHORD_BY_ID,
  INTERVAL_BY_ID,
  PITCH_RANGES,
  midiToFrequency,
  midiToNoteName
} from './definitions.js';
import {
  generateChordQuestion,
  generateIntervalQuestion,
  validateAnswer,
  pickRandomItemAvoidRepeat,
  pickDiverseRootMidi,
  pickBalancedDirection
} from './quizLogic.js';
import {
  ACOUSTIC_PIANO_SAMPLES,
  findClosestPianoSample,
  AUDIO_TIMING
} from '../audio/audioEngine.js';

test('Chord definitions match the prompt specifications exactly', () => {
  // Check count
  assert.equal(CHORD_DEFINITIONS.length, 9);

  // Three-note chords
  assert.deepEqual(CHORD_BY_ID.get('major')?.intervals, [0, 4, 7]);
  assert.equal(CHORD_BY_ID.get('major')?.formula, '1 3 5');
  assert.deepEqual(CHORD_BY_ID.get('minor')?.intervals, [0, 3, 7]);
  assert.equal(CHORD_BY_ID.get('minor')?.formula, '1 m3 5');
  assert.deepEqual(CHORD_BY_ID.get('diminished')?.intervals, [0, 3, 6]);
  assert.equal(CHORD_BY_ID.get('diminished')?.formula, '1 m3 b5');
  assert.deepEqual(CHORD_BY_ID.get('augmented')?.intervals, [0, 4, 8]);
  assert.equal(CHORD_BY_ID.get('augmented')?.formula, '1 3 #5');

  // Four-note chords
  assert.deepEqual(CHORD_BY_ID.get('major_seventh')?.intervals, [0, 4, 7, 11]);
  assert.equal(CHORD_BY_ID.get('major_seventh')?.formula, '1 3 5 M7');
  assert.deepEqual(CHORD_BY_ID.get('dominant_seventh')?.intervals, [0, 4, 7, 10]);
  assert.equal(CHORD_BY_ID.get('dominant_seventh')?.formula, '1 3 5 m7');
  assert.deepEqual(CHORD_BY_ID.get('minor_seventh')?.intervals, [0, 3, 7, 10]);
  assert.equal(CHORD_BY_ID.get('minor_seventh')?.formula, '1 m3 5 m7');
  assert.deepEqual(CHORD_BY_ID.get('half_diminished_seventh')?.intervals, [0, 3, 6, 10]);
  assert.equal(CHORD_BY_ID.get('half_diminished_seventh')?.formula, '1 m3 b5 m7');
  assert.deepEqual(CHORD_BY_ID.get('diminished_seventh')?.intervals, [0, 3, 6, 9]);
  assert.equal(CHORD_BY_ID.get('diminished_seventh')?.formula, '1 m3 b5 bb7');
});

test('Interval definitions match the prompt specifications exactly', () => {
  assert.equal(INTERVAL_DEFINITIONS.length, 12);

  assert.equal(INTERVAL_BY_ID.get('minor_second')?.semitones, 1);
  assert.equal(INTERVAL_BY_ID.get('major_second')?.semitones, 2);
  assert.equal(INTERVAL_BY_ID.get('minor_third')?.semitones, 3);
  assert.equal(INTERVAL_BY_ID.get('major_third')?.semitones, 4);
  assert.equal(INTERVAL_BY_ID.get('perfect_fourth')?.semitones, 5);
  assert.equal(INTERVAL_BY_ID.get('tritone')?.semitones, 6);
  assert.equal(INTERVAL_BY_ID.get('perfect_fifth')?.semitones, 7);
  assert.equal(INTERVAL_BY_ID.get('minor_sixth')?.semitones, 8);
  assert.equal(INTERVAL_BY_ID.get('major_sixth')?.semitones, 9);
  assert.equal(INTERVAL_BY_ID.get('minor_seventh')?.semitones, 10);
  assert.equal(INTERVAL_BY_ID.get('major_seventh')?.semitones, 11);
  assert.equal(INTERVAL_BY_ID.get('octave')?.semitones, 12);
});

test('MIDI conversion utilities produce correct notes and frequencies', () => {
  // A4 is MIDI 69 -> 440 Hz
  const a4Freq = midiToFrequency(69);
  assert.ok(Math.abs(a4Freq - 440) < 0.001);

  // Middle C is MIDI 60 -> C4 (~261.63 Hz)
  const c4Freq = midiToFrequency(60);
  assert.ok(Math.abs(c4Freq - 261.625) < 0.01);
  assert.equal(midiToNoteName(60), 'C4');
  assert.equal(midiToNoteName(69), 'A4');
  assert.equal(midiToNoteName(48), 'C3');
});

test('generateChordQuestion creates audio notes that strictly match chord definition', () => {
  const activeChords = ['major', 'minor_seventh'];
  const question = generateChordQuestion(activeChords, undefined, 60);

  assert.ok(['major', 'minor_seventh'].includes(question.chordId));
  assert.equal(question.rootMidi, 60);
  assert.equal(question.rootName, 'C4');

  if (question.chordId === 'major') {
    // 60, 64, 67 (C4, E4, G4)
    assert.deepEqual(question.noteMidis, [60, 64, 67]);
    assert.deepEqual(question.noteNames, ['C4', 'E4', 'G4']);
  } else {
    // 60, 63, 67, 70 (C4, D#4, G4, A#4)
    assert.deepEqual(question.noteMidis, [60, 63, 67, 70]);
  }
});

test('generateIntervalQuestion creates ascending and descending intervals that strictly match interval definition', () => {
  const activeIntervals = ['perfect_fifth', 'octave'];

  // Test explicit ascending direction
  const ascQuestion = generateIntervalQuestion(activeIntervals, undefined, 48, 2, 'ascending');
  assert.ok(['perfect_fifth', 'octave'].includes(ascQuestion.intervalId));
  assert.equal(ascQuestion.rootMidi, 48);
  assert.equal(ascQuestion.rootName, 'C3');
  assert.equal(ascQuestion.direction, 'ascending');
  if (ascQuestion.intervalId === 'perfect_fifth') {
    assert.equal(ascQuestion.upperMidi, 48 + 7);
    assert.deepEqual(ascQuestion.noteMidis, [48, 55]);
    assert.deepEqual(ascQuestion.playMidis, [48, 55]);
  } else {
    assert.equal(ascQuestion.upperMidi, 48 + 12);
    assert.deepEqual(ascQuestion.noteMidis, [48, 60]);
    assert.deepEqual(ascQuestion.playMidis, [48, 60]);
  }

  // Test explicit descending direction
  const descQuestion = generateIntervalQuestion(activeIntervals, undefined, 48, 2, 'descending');
  assert.equal(descQuestion.direction, 'descending');
  assert.equal(descQuestion.rootMidi, 48);
  if (descQuestion.intervalId === 'perfect_fifth') {
    assert.equal(descQuestion.upperMidi, 55);
    assert.deepEqual(descQuestion.noteMidis, [48, 55]);
    assert.deepEqual(descQuestion.playMidis, [55, 48]); // upper note first, then lower note
  } else {
    assert.equal(descQuestion.upperMidi, 60);
    assert.deepEqual(descQuestion.noteMidis, [48, 60]);
    assert.deepEqual(descQuestion.playMidis, [60, 48]); // upper note first, then lower note
  }

  // Test 'both' direction mode: generates both ascending and descending over multiple trials
  const directionsObserved = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const q = generateIntervalQuestion(activeIntervals, undefined, undefined, 2, 'both');
    directionsObserved.add(q.direction);
    if (q.direction === 'descending') {
      assert.deepEqual(q.playMidis, [q.upperMidi, q.rootMidi]);
    } else {
      assert.deepEqual(q.playMidis, [q.rootMidi, q.upperMidi]);
    }
  }
  assert.ok(directionsObserved.has('ascending'), 'Mode B "both" must generate ascending intervals');
  assert.ok(directionsObserved.has('descending'), 'Mode B "both" must generate descending intervals');
});

test('pickRandomItemAvoidRepeat avoids immediate repeat if pool has > 1 item', () => {
  const candidates = ['a', 'b', 'c'];
  for (let i = 0; i < 20; i++) {
    const picked = pickRandomItemAvoidRepeat(candidates, 'a');
    assert.notEqual(picked, 'a');
  }

  // If only 1 item in pool, it returns that item
  const single = pickRandomItemAvoidRepeat(['only'], 'only');
  assert.equal(single, 'only');
});

test('validateAnswer checks answers correctly', () => {
  const correctResult = validateAnswer('major', 'major');
  assert.equal(correctResult.isCorrect, true);
  assert.equal(correctResult.selectedId, 'major');
  assert.equal(correctResult.correctId, 'major');

  const wrongResult = validateAnswer('minor', 'major');
  assert.equal(wrongResult.isCorrect, false);
  assert.equal(wrongResult.selectedId, 'minor');
  assert.equal(wrongResult.correctId, 'major');
});

test('generateChordQuestion and generateIntervalQuestion throw when selection is empty', () => {
  assert.throws(() => generateChordQuestion([]), /At least one chord type must be active/);
  assert.throws(() => generateIntervalQuestion([]), /At least one interval must be active/);
});

test('All chord intervals are strictly ascending and start at root 0', () => {
  for (const chord of CHORD_DEFINITIONS) {
    assert.equal(chord.intervals[0], 0, `${chord.id} must start at root 0`);
    for (let i = 1; i < chord.intervals.length; i++) {
      assert.ok(
        chord.intervals[i] > chord.intervals[i - 1],
        `${chord.id} intervals must be strictly ascending: ${chord.intervals}`
      );
    }
  }
});

test('All intervals are strictly ascending semitone distances from 1 to 12', () => {
  for (const interval of INTERVAL_DEFINITIONS) {
    assert.ok(interval.semitones >= 1 && interval.semitones <= 12);
  }
});

test('PITCH_RANGES covers 2 to 8 octaves with exact bounds, spans, and midpoints', () => {
  const expectedRanges: Record<number, { minMidi: number; maxMidi: number; label: string; midpoint: number }> = {
    2: { minMidi: 48, maxMidi: 72, label: 'C3–C5', midpoint: 60 },
    3: { minMidi: 36, maxMidi: 72, label: 'C2–C5', midpoint: 54 },
    4: { minMidi: 36, maxMidi: 84, label: 'C2–C6', midpoint: 60 },
    5: { minMidi: 24, maxMidi: 84, label: 'C1–C6', midpoint: 54 },
    6: { minMidi: 24, maxMidi: 96, label: 'C1–C7', midpoint: 60 },
    7: { minMidi: 24, maxMidi: 108, label: 'C1–C8', midpoint: 66 },
    8: { minMidi: 24, maxMidi: 120, label: 'C1–C9', midpoint: 72 },
  };

  for (let octaves = 2; octaves <= 8; octaves++) {
    const range = PITCH_RANGES[octaves];
    const expected = expectedRanges[octaves];

    assert.ok(range, `Pitch range must exist for ${octaves} octaves`);
    assert.equal(range.octaves, octaves);
    assert.equal(range.minMidi, expected.minMidi, `Setting ${octaves} octaves minMidi`);
    assert.equal(range.maxMidi, expected.maxMidi, `Setting ${octaves} octaves maxMidi`);
    assert.equal(range.label, expected.label, `Setting ${octaves} octaves label`);
    assert.equal(range.maxMidi - range.minMidi, octaves * 12, `Setting ${octaves} octaves span must equal octaves * 12`);
    assert.equal((range.minMidi + range.maxMidi) / 2, expected.midpoint, `Setting ${octaves} octaves midpoint`);
  }
});

test('generateChordQuestion strictly keeps all chord notes within selected pitch range for all octaves 2 to 8', () => {
  const allChordIds = CHORD_DEFINITIONS.map(c => c.id);

  for (let octaves = 2; octaves <= 8; octaves++) {
    const range = PITCH_RANGES[octaves];

    for (let trial = 0; trial < 100; trial++) {
      const question = generateChordQuestion(allChordIds, undefined, undefined, octaves);

      // Root note must be root-position
      assert.equal(question.noteMidis[0], question.rootMidi);

      // All notes must stay within [minMidi, maxMidi]
      for (const noteMidi of question.noteMidis) {
        assert.ok(
          noteMidi >= range.minMidi && noteMidi <= range.maxMidi,
          `Generated note ${noteMidi} outside range [${range.minMidi}, ${range.maxMidi}] for ${octaves} octaves in chord ${question.chordId}`
        );
      }
    }
  }
});

test('generateIntervalQuestion strictly keeps both notes within selected pitch range for all octaves 2 to 8', () => {
  const allIntervalIds = INTERVAL_DEFINITIONS.map(i => i.id);

  for (let octaves = 2; octaves <= 8; octaves++) {
    const range = PITCH_RANGES[octaves];

    for (let trial = 0; trial < 100; trial++) {
      const question = generateIntervalQuestion(allIntervalIds, undefined, undefined, octaves);

      const [lower, upper] = question.noteMidis;

      // Intervals must be ascending
      assert.ok(upper > lower, `Interval must be ascending: ${lower} to ${upper}`);

      // Both notes within range
      assert.ok(
        lower >= range.minMidi && lower <= range.maxMidi,
        `Lower note ${lower} outside range [${range.minMidi}, ${range.maxMidi}] for ${octaves} octaves`
      );
      assert.ok(
        upper >= range.minMidi && upper <= range.maxMidi,
        `Upper note ${upper} outside range [${range.minMidi}, ${range.maxMidi}] for ${octaves} octaves`
      );
    }
  }
});

test('Higher octave settings expand the range of generated roots', () => {
  const allChordIds = ['major'];
  const roots2Octaves = new Set<number>();
  const roots8Octaves = new Set<number>();

  for (let i = 0; i < 200; i++) {
    roots2Octaves.add(generateChordQuestion(allChordIds, undefined, undefined, 2).rootMidi);
    roots8Octaves.add(generateChordQuestion(allChordIds, undefined, undefined, 8).rootMidi);
  }

  // 8-octave range must generate significantly more diverse root pitches than 2-octave range
  assert.ok(
    roots8Octaves.size > roots2Octaves.size,
    `8 octaves should produce more diverse roots (${roots8Octaves.size}) than 2 octaves (${roots2Octaves.size})`
  );
  // 8-octave range should generate roots below C3 (< 48) and above C5 (> 72)
  const hasBassRoots = Array.from(roots8Octaves).some(r => r < 48);
  const hasTrebleRoots = Array.from(roots8Octaves).some(r => r > 72);
  assert.ok(hasBassRoots, '8-octave range should generate deep bass roots < 48');
  assert.ok(hasTrebleRoots, '8-octave range should generate high treble roots > 72');
});

test('ACOUSTIC_PIANO_SAMPLES covers C1 to C8 with accurate pitch mapping up to C9', () => {
  assert.equal(ACOUSTIC_PIANO_SAMPLES.length, 29);
  assert.equal(ACOUSTIC_PIANO_SAMPLES[0].name, 'C1');
  assert.equal(ACOUSTIC_PIANO_SAMPLES[0].midi, 24);
  assert.equal(ACOUSTIC_PIANO_SAMPLES[ACOUSTIC_PIANO_SAMPLES.length - 1].name, 'C8');
  assert.equal(ACOUSTIC_PIANO_SAMPLES[ACOUSTIC_PIANO_SAMPLES.length - 1].midi, 108);

  // Test every MIDI note in the 8-octave question range (MIDI 24 to 120 / C1 to C9)
  for (let midi = 24; midi <= 120; midi++) {
    const { sample, playbackRate } = findClosestPianoSample(midi);
    assert.ok(sample, `Sample must exist for MIDI ${midi}`);
    assert.ok(playbackRate > 0, `Playback rate must be positive for MIDI ${midi}`);

    // Pitch shift should be exact: target frequency / sample frequency
    const expectedRate = Math.pow(2, (midi - sample.midi) / 12);
    assert.ok(
      Math.abs(playbackRate - expectedRate) < 0.0001,
      `Playback rate mismatch for MIDI ${midi}`
    );

    // Up to C8 (108), the distance to the nearest sample is at most 2 semitones
    if (midi <= 108) {
      assert.ok(
        Math.abs(midi - sample.midi) <= 2,
        `MIDI ${midi} should be within 2 semitones of nearest recorded sample (${sample.name} / ${sample.midi})`
      );
    }
  }

  // Exact pitch matches
  assert.equal(findClosestPianoSample(60).playbackRate, 1.0); // Middle C (C4)
  assert.equal(findClosestPianoSample(60).sample.name, 'C4');
  assert.equal(findClosestPianoSample(24).playbackRate, 1.0); // C1
  assert.equal(findClosestPianoSample(24).sample.name, 'C1');
  assert.equal(findClosestPianoSample(108).playbackRate, 1.0); // C8
  assert.equal(findClosestPianoSample(108).sample.name, 'C8');
  assert.equal(findClosestPianoSample(120).playbackRate, 2.0); // C9 = C8 * 2
  assert.equal(findClosestPianoSample(120).sample.name, 'C8');
});

test('Interval section audio timing provides increased space and longer first note sustain', () => {
  // Default melodic interval step should be at least 1.0s to allow clear pitch distinction
  assert.ok(
    AUDIO_TIMING.MELODIC_INTERVAL_STEP >= 1.0,
    `MELODIC_INTERVAL_STEP (${AUDIO_TIMING.MELODIC_INTERVAL_STEP}s) must be >= 1.0s for clear ear training perception`
  );
  // First note in interval test sustains longer (>= 1.5s) so user has adequate tonal reference
  assert.ok(
    AUDIO_TIMING.MELODIC_FIRST_NOTE_DURATION >= 1.5,
    `MELODIC_FIRST_NOTE_DURATION (${AUDIO_TIMING.MELODIC_FIRST_NOTE_DURATION}s) must be >= 1.5s for sustained ear reference`
  );
  assert.ok(
    AUDIO_TIMING.HARMONIC_INTERVAL_DURATION >= 1.2,
    `HARMONIC_INTERVAL_DURATION (${AUDIO_TIMING.HARMONIC_INTERVAL_DURATION}s) must be >= 1.2s`
  );
});

test('Chord section audio timing provides sustained duration for clear harmonic perception', () => {
  // Simultaneous chord duration should sustain longer (>= 2.2s) for harmonic recognition
  assert.ok(
    AUDIO_TIMING.SIMULTANEOUS_CHORD_DURATION >= 2.2,
    `SIMULTANEOUS_CHORD_DURATION (${AUDIO_TIMING.SIMULTANEOUS_CHORD_DURATION}s) must be >= 2.2s for rich chord sustain`
  );
  // Sequential chord note duration should ring out smoothly (>= 0.6s)
  assert.ok(
    AUDIO_TIMING.SEQUENTIAL_NOTE_DURATION >= 0.6,
    `SEQUENTIAL_NOTE_DURATION (${AUDIO_TIMING.SEQUENTIAL_NOTE_DURATION}s) must be >= 0.6s`
  );
});

test('GUI language localization supports Kurdish (Kurmancî) as default and Turkish as secondary', async () => {
  const { TRANSLATIONS, CHORD_LOCALIZATION, INTERVAL_LOCALIZATION, getLocalizedChord, getLocalizedInterval } = await import('../i18n/translations.js');

  // Verify Kurdish (Kurmancî) dictionary exists and contains key musical strings
  assert.ok(TRANSLATIONS.ku, 'Kurdish (Kurmancî) translations must exist');
  assert.equal(TRANSLATIONS.ku.appTitle, 'Perwerdeya Guhî');
  assert.equal(TRANSLATIONS.ku.chordTrainingTab, 'Perwerdeya Akoran');
  assert.equal(TRANSLATIONS.ku.intervalTrainingTab, 'Perwerdeya Navberan');
  assert.ok(TRANSLATIONS.ku.madeBy.includes('M.Gençler'), 'Kurdish madeBy must reference M.Gençler');
  assert.ok(TRANSLATIONS.ku.acousticPiano.includes('Piyano'));

  // Verify Turkish dictionary exists and contains key musical strings
  assert.ok(TRANSLATIONS.tr, 'Turkish translations must exist');
  assert.equal(TRANSLATIONS.tr.appTitle, 'Kulak Eğitimi');
  assert.equal(TRANSLATIONS.tr.chordTrainingTab, 'Akor Eğitimi');
  assert.equal(TRANSLATIONS.tr.intervalTrainingTab, 'Aralık Eğitimi');
  assert.ok(TRANSLATIONS.tr.madeBy.includes('M.Gençler'), 'Turkish madeBy must reference M.Gençler');
  assert.ok(TRANSLATIONS.tr.acousticPiano.includes('Akustik Piyano'));

  // Verify every single chord definition (all 8) is localized in both languages
  for (const chord of CHORD_DEFINITIONS) {
    const kuChord = getLocalizedChord(chord.id, 'ku', chord.name, chord.shortName, chord.description);
    const trChord = getLocalizedChord(chord.id, 'tr', chord.name, chord.shortName, chord.description);

    assert.ok(kuChord.name.length > 0, `Kurdish name for chord ${chord.id} should not be empty`);
    assert.ok(trChord.name.length > 0, `Turkish name for chord ${chord.id} should not be empty`);
    assert.ok(CHORD_LOCALIZATION.ku[chord.id], `CHORD_LOCALIZATION.ku must have ${chord.id}`);
    assert.ok(CHORD_LOCALIZATION.tr[chord.id], `CHORD_LOCALIZATION.tr must have ${chord.id}`);
  }

  // Verify every single interval definition (all 12) is localized in both languages
  for (const interval of INTERVAL_DEFINITIONS) {
    const kuInterval = getLocalizedInterval(interval.id, 'ku', interval.name, interval.shortName);
    const trInterval = getLocalizedInterval(interval.id, 'tr', interval.name, interval.shortName);

    assert.ok(kuInterval.name.length > 0, `Kurdish name for interval ${interval.id} should not be empty`);
    assert.ok(trInterval.name.length > 0, `Turkish name for interval ${interval.id} should not be empty`);
    assert.ok(INTERVAL_LOCALIZATION.ku[interval.id], `INTERVAL_LOCALIZATION.ku must have ${interval.id}`);
    assert.ok(INTERVAL_LOCALIZATION.tr[interval.id], `INTERVAL_LOCALIZATION.tr must have ${interval.id}`);
  }
});

test('pickRandomItemAvoidRepeat with sliding-window history avoids recent items and prevents shallow cycling', () => {
  const candidates = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  // When history has 3 items, the picked item should not be in that history
  for (let trial = 0; trial < 30; trial++) {
    const history = ['A', 'B', 'C'];
    const picked = pickRandomItemAvoidRepeat(candidates, history);
    assert.ok(!history.includes(picked), `Picked item ${picked} should not be in recent history ${history}`);
  }

  // Two candidates: strictly alternates and never repeats consecutively
  let current = 'X';
  for (let i = 0; i < 20; i++) {
    const next = pickRandomItemAvoidRepeat(['X', 'Y'], current);
    assert.notEqual(next, current, `Candidate must alternate between X and Y without repeating`);
    current = next;
  }
});

test('pickDiverseRootMidi avoids repeating exact recent roots and pitch classes', () => {
  // Range: C3 (48) to C5 (72)
  const minMidi = 48;
  const maxMidi = 72;

  let recentRoots: number[] = [];
  for (let step = 0; step < 50; step++) {
    const root = pickDiverseRootMidi(minMidi, maxMidi, recentRoots);
    assert.ok(root >= minMidi && root <= maxMidi, `Root ${root} must be within bounds [${minMidi}, ${maxMidi}]`);

    // Never repeat the exact same root consecutively
    if (recentRoots.length > 0) {
      assert.notEqual(root, recentRoots[recentRoots.length - 1], `Root note ${root} must not repeat consecutively`);
    }

    recentRoots.push(root);
  }

  // Pitch class diversity: across 50 questions, most chromatic pitch classes should be explored
  const pitchClasses = new Set(recentRoots.map(r => r % 12));
  assert.ok(pitchClasses.size >= 10, `Across 50 trials, at least 10 different chromatic pitch classes should be explored (found ${pitchClasses.size})`);
});

test('pickBalancedDirection breaks streaks and ensures balanced distribution for Mode B intervals', () => {
  // If last 3 were ascending, next MUST be descending to break the streak
  const forceDesc = pickBalancedDirection('both', ['ascending', 'ascending', 'ascending']);
  assert.equal(forceDesc, 'descending', 'Must break streak of 3 ascending');

  // If last 3 were descending, next MUST be ascending to break the streak
  const forceAsc = pickBalancedDirection('both', ['descending', 'descending', 'descending']);
  assert.equal(forceAsc, 'ascending', 'Must break streak of 3 descending');

  // Over 100 trials with 'both', neither direction should excessively dominate (< 70% of total)
  const directions: ('ascending' | 'descending')[] = [];
  for (let i = 0; i < 100; i++) {
    const d = pickBalancedDirection('both', directions);
    directions.push(d);
  }
  const ascCount = directions.filter(d => d === 'ascending').length;
  const descCount = directions.filter(d => d === 'descending').length;
  assert.ok(ascCount >= 30 && ascCount <= 70, `Ascending count ${ascCount}/100 should be balanced between 30 and 70`);
  assert.ok(descCount >= 30 && descCount <= 70, `Descending count ${descCount}/100 should be balanced between 30 and 70`);
});

test('Simulated 100-question quiz loop shows flawless randomization with zero consecutive duplicate questions', () => {
  // Test chord quiz loop over 100 rounds
  const allChordIds = CHORD_DEFINITIONS.map(c => c.id);
  const chordHistory: string[] = [];
  const chordRootHistory: number[] = [];
  const chordQuestionSignatures: string[] = [];
  const chordCounts = new Map<string, number>();

  for (let i = 0; i < 100; i++) {
    const q = generateChordQuestion(allChordIds, chordHistory, undefined, 2, chordRootHistory);
    const signature = `${q.chordId}_${q.rootMidi}`;

    // Verify no two consecutive questions are identical in chord type
    if (chordHistory.length > 0) {
      assert.notEqual(q.chordId, chordHistory[chordHistory.length - 1], `Chord ${q.chordId} repeated consecutively at step ${i}`);
    }
    // Verify question signature (chord + root) does not repeat consecutively
    if (chordQuestionSignatures.length > 0) {
      assert.notEqual(signature, chordQuestionSignatures[chordQuestionSignatures.length - 1], `Question signature ${signature} repeated consecutively`);
    }

    chordHistory.push(q.chordId);
    chordRootHistory.push(q.rootMidi);
    chordQuestionSignatures.push(signature);
    chordCounts.set(q.chordId, (chordCounts.get(q.chordId) || 0) + 1);
  }

  // All 9 chords must have been generated (no shallow starvation)
  assert.equal(chordCounts.size, 9, 'All 9 chord types must be represented in 100 questions');
  for (const [id, count] of chordCounts) {
    assert.ok(count >= 5, `Chord ${id} should appear at least 5 times in 100 questions (appeared ${count} times)`);
  }

  // Test interval quiz loop over 100 rounds
  const allIntervalIds = INTERVAL_DEFINITIONS.map(i => i.id);
  const intervalHistory: string[] = [];
  const intervalRootHistory: number[] = [];
  const intervalDirHistory: ('ascending' | 'descending')[] = [];
  const intervalQuestionSignatures: string[] = [];
  const intervalCounts = new Map<string, number>();

  for (let i = 0; i < 100; i++) {
    const q = generateIntervalQuestion(
      allIntervalIds,
      intervalHistory,
      undefined,
      2,
      'both',
      intervalRootHistory,
      intervalDirHistory
    );
    const signature = `${q.intervalId}_${q.rootMidi}_${q.direction}`;

    // Verify no two consecutive intervals are identical in interval type
    if (intervalHistory.length > 0) {
      assert.notEqual(q.intervalId, intervalHistory[intervalHistory.length - 1], `Interval ${q.intervalId} repeated consecutively at step ${i}`);
    }
    // Verify question signature does not repeat consecutively
    if (intervalQuestionSignatures.length > 0) {
      assert.notEqual(signature, intervalQuestionSignatures[intervalQuestionSignatures.length - 1], `Interval signature ${signature} repeated consecutively`);
    }

    intervalHistory.push(q.intervalId);
    intervalRootHistory.push(q.rootMidi);
    intervalDirHistory.push(q.direction);
    intervalQuestionSignatures.push(signature);
    intervalCounts.set(q.intervalId, (intervalCounts.get(q.intervalId) || 0) + 1);
  }

  // All 12 intervals must be represented (no shallow pool)
  assert.equal(intervalCounts.size, 12, 'All 12 intervals must be represented in 100 questions');
  for (const [id, count] of intervalCounts) {
    assert.ok(count >= 3, `Interval ${id} should appear at least 3 times in 100 questions (appeared ${count} times)`);
  }
});

test('2-chord randomization avoids lockstep alternating patterns and caps streaks at 2', () => {
  const activeChords = ['major', 'minor'];
  const history: string[] = [];

  for (let i = 0; i < 60; i++) {
    const q = generateChordQuestion(activeChords, history, undefined, 2);
    history.push(q.chordId);
  }

  // Both chords must be generated with healthy balance (at least 18 out of 60)
  const majorCount = history.filter(c => c === 'major').length;
  const minorCount = history.filter(c => c === 'minor').length;
  assert.ok(majorCount >= 18, `Major count should be >= 18 (was ${majorCount})`);
  assert.ok(minorCount >= 18, `Minor count should be >= 18 (was ${minorCount})`);

  // Streaks must never exceed 2 identical chords in a row
  for (let i = 2; i < history.length; i++) {
    assert.ok(
      !(history[i] === history[i - 1] && history[i - 1] === history[i - 2]),
      `Streak of 3 identical chords detected at index ${i}: ${history.slice(i - 2, i + 1)}`
    );
  }

  // Must NOT strictly alternate forever (must have at least one streak of 2 to prove true randomness)
  let foundConsecutivePair = false;
  for (let i = 1; i < history.length; i++) {
    if (history[i] === history[i - 1]) {
      foundConsecutivePair = true;
      break;
    }
  }
  assert.ok(foundConsecutivePair, 'Randomization must be non-deterministic, not a strict alternating ping-pong');
});

test('4-chord randomization avoids repeating cycles and maintains balanced exploration', () => {
  const activeChords = ['major', 'minor', 'diminished', 'augmented'];
  const history: string[] = [];

  for (let i = 0; i < 48; i++) {
    const q = generateChordQuestion(activeChords, history, undefined, 2);
    // Never immediate consecutive duplicate
    if (history.length > 0) {
      assert.notEqual(q.chordId, history[history.length - 1], 'Immediate duplicate chord in 4-chord pool');
    }
    history.push(q.chordId);
  }

  // All 4 chords must appear
  for (const c of activeChords) {
    const count = history.filter(x => x === c).length;
    assert.ok(count >= 5, `Chord ${c} should appear at least 5 times in 48 trials (appeared ${count})`);
  }

  // Check that the sequence is NOT a rigid repeating 4-cycle (e.g. A, B, C, D, A, B, C, D)
  let rigidCycleCount = 0;
  for (let i = 7; i < history.length; i++) {
    if (
      history[i] === history[i - 4] &&
      history[i - 1] === history[i - 5] &&
      history[i - 2] === history[i - 6] &&
      history[i - 3] === history[i - 7]
    ) {
      rigidCycleCount++;
    }
  }
  assert.ok(rigidCycleCount < 3, `Rigid repeating 4-cycle detected too frequently (${rigidCycleCount} times)`);
});

