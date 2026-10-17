import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMistakesSummary,
  clearChordMistakes,
  recordChordMistake,
  loadChordMistakes,
  getTotalMistakesCount,
} from './mistakesStorage.js';
import { ChordMistakeRecord } from '../types/music.js';

test('calculateMistakesSummary handles empty records gracefully', () => {
  const summary = calculateMistakesSummary([]);
  assert.equal(summary.totalMistakes, 0);
  assert.equal(summary.uniqueChordsMissed, 0);
  assert.equal(summary.mostMissedChordId, null);
  assert.equal(summary.mostRecentMistakeDate, null);
  assert.deepEqual(summary.items, []);
});

test('calculateMistakesSummary computes total, percentages, and most missed accurately', () => {
  const records: ChordMistakeRecord[] = [
    { chordId: 'minor_seventh', mistakeCount: 6, lastMistakeDate: '2026-10-17T09:00:00.000Z' },
    { chordId: 'dominant_seventh', mistakeCount: 3, lastMistakeDate: '2026-10-17T09:30:00.000Z' },
    { chordId: 'diminished_triad', mistakeCount: 1, lastMistakeDate: '2026-10-17T08:15:00.000Z' },
  ];

  const summary = calculateMistakesSummary(records);
  assert.equal(summary.totalMistakes, 10);
  assert.equal(summary.uniqueChordsMissed, 3);
  assert.equal(summary.mostMissedChordId, 'minor_seventh');
  assert.equal(summary.mostRecentMistakeDate, '2026-10-17T09:30:00.000Z');

  // Verify percentages: 6/10 = 60%, 3/10 = 30%, 1/10 = 10%
  assert.equal(summary.items[0].percentage, 60);
  assert.equal(summary.items[1].percentage, 30);
  assert.equal(summary.items[2].percentage, 10);
});

test('recordChordMistake increments counts and updates latest date correctly', () => {
  clearChordMistakes();
  assert.equal(getTotalMistakesCount(), 0);

  const t1 = '2026-10-17T10:00:00.000Z';
  const t2 = '2026-10-17T10:05:00.000Z';

  recordChordMistake('major_triad', t1);
  let list = loadChordMistakes();
  assert.equal(list.length, 1);
  assert.equal(list[0].chordId, 'major_triad');
  assert.equal(list[0].mistakeCount, 1);
  assert.equal(list[0].lastMistakeDate, t1);

  recordChordMistake('major_triad', t2);
  list = loadChordMistakes();
  assert.equal(list.length, 1);
  assert.equal(list[0].mistakeCount, 2);
  assert.equal(list[0].lastMistakeDate, t2);

  recordChordMistake('half_diminished_seventh', t2);
  list = loadChordMistakes();
  assert.equal(list.length, 2);
  assert.equal(getTotalMistakesCount(), 3);

  clearChordMistakes();
  assert.equal(getTotalMistakesCount(), 0);
  assert.equal(loadChordMistakes().length, 0);
});
