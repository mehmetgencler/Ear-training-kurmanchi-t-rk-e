import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  audioEngine,
  ACOUSTIC_PIANO_SAMPLES,
  findClosestPianoSample,
  AUDIO_TIMING,
} from './audioEngine.js';

test('ACOUSTIC_PIANO_SAMPLES list includes all 29 standard samples from C1 to C8', () => {
  assert.equal(ACOUSTIC_PIANO_SAMPLES.length, 29);
  assert.equal(ACOUSTIC_PIANO_SAMPLES[0].name, 'C1');
  assert.equal(ACOUSTIC_PIANO_SAMPLES[0].midi, 24);
  assert.equal(ACOUSTIC_PIANO_SAMPLES[ACOUSTIC_PIANO_SAMPLES.length - 1].name, 'C8');
  assert.equal(ACOUSTIC_PIANO_SAMPLES[ACOUSTIC_PIANO_SAMPLES.length - 1].midi, 108);

  // Check sequential MIDI order
  for (let i = 1; i < ACOUSTIC_PIANO_SAMPLES.length; i++) {
    assert.ok(
      ACOUSTIC_PIANO_SAMPLES[i].midi > ACOUSTIC_PIANO_SAMPLES[i - 1].midi,
      `Samples must be sorted ascending: ${ACOUSTIC_PIANO_SAMPLES[i].name} vs ${ACOUSTIC_PIANO_SAMPLES[i - 1].name}`
    );
  }
});

test('findClosestPianoSample maps accurately across C1 to C9 with correct playback rates', () => {
  // Exact note match (Middle C, MIDI 60)
  const c4 = findClosestPianoSample(60);
  assert.equal(c4.sample.name, 'C4');
  assert.equal(c4.sample.midi, 60);
  assert.equal(c4.playbackRate, 1.0);

  // Half step above Middle C (C#4/Db4, MIDI 61)
  const cs4 = findClosestPianoSample(61);
  assert.equal(cs4.sample.name, 'C4');
  assert.ok(Math.abs(cs4.playbackRate - Math.pow(2, 1 / 12)) < 0.0001);

  // Exact match on Ds4 (MIDI 63)
  const ds4 = findClosestPianoSample(63);
  assert.equal(ds4.sample.name, 'Ds4');
  assert.equal(ds4.playbackRate, 1.0);

  // Lowest boundary (C1, MIDI 24)
  const c1 = findClosestPianoSample(24);
  assert.equal(c1.sample.name, 'C1');
  assert.equal(c1.playbackRate, 1.0);

  // High pitch-shifted range (C9, MIDI 120)
  const c9 = findClosestPianoSample(120);
  assert.equal(c9.sample.name, 'C8');
  assert.equal(c9.playbackRate, 2.0); // 1 octave above C8 = rate 2.0
});

test('AudioEngine diagnostics provides complete state tracking without exposing leaks', () => {
  const diag = audioEngine.getDiagnostics();
  assert.ok(diag, 'Diagnostics object should exist');
  assert.equal(typeof diag.contextState, 'string');
  assert.equal(typeof diag.isUnlocked, 'boolean');
  assert.equal(typeof diag.sampleCount, 'number');
  assert.ok(Array.isArray(diag.failedSamples));
  assert.equal(typeof diag.isIOS, 'boolean');
});

test('AUDIO_TIMING constants provide proper sustain and interval steps', () => {
  assert.ok(AUDIO_TIMING.SIMULTANEOUS_CHORD_DURATION >= 2.0);
  assert.ok(AUDIO_TIMING.SEQUENTIAL_CHORD_STEP > 0.3);
  assert.ok(AUDIO_TIMING.MELODIC_INTERVAL_STEP >= 0.8);
  assert.ok(AUDIO_TIMING.MELODIC_FIRST_NOTE_DURATION > AUDIO_TIMING.MELODIC_INTERVAL_STEP);
});
