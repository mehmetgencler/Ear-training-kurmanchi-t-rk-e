import { ChordMistakeRecord, MistakesSummary, MistakeSummaryItem } from '../types/music.js';

export const CHORD_MISTAKES_STORAGE_KEY = 'music_ear_trainer_chord_mistakes_v1';

// In-memory fallback in case localStorage is disabled or throws in sandboxed iframes
let inMemoryFallback: Record<string, ChordMistakeRecord> = {};

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads all recorded chord mistakes from browser storage, sorted by mistake count descending.
 */
export function loadChordMistakes(): ChordMistakeRecord[] {
  if (!isLocalStorageAvailable()) {
    return Object.values(inMemoryFallback).sort((a, b) => b.mistakeCount - a.mistakeCount);
  }

  try {
    const raw = window.localStorage.getItem(CHORD_MISTAKES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];

    const records: ChordMistakeRecord[] = [];
    for (const [chordId, val] of Object.entries(parsed)) {
      if (val && typeof val === 'object') {
        const item = val as Partial<ChordMistakeRecord>;
        if (typeof item.mistakeCount === 'number' && item.mistakeCount > 0) {
          records.push({
            chordId: typeof item.chordId === 'string' ? item.chordId : chordId,
            mistakeCount: item.mistakeCount,
            lastMistakeDate: typeof item.lastMistakeDate === 'string' ? item.lastMistakeDate : new Date().toISOString(),
          });
        }
      }
    }

    return records.sort((a, b) => b.mistakeCount - a.mistakeCount);
  } catch (err) {
    console.warn('Failed to parse chord mistakes from storage:', err);
    return [];
  }
}

/**
 * Records a mistake for the given chordId, updating count and the latest date.
 */
export function recordChordMistake(
  chordId: string,
  timestamp: string = new Date().toISOString()
): ChordMistakeRecord[] {
  const currentList = loadChordMistakes();
  const map: Record<string, ChordMistakeRecord> = {};

  for (const record of currentList) {
    map[record.chordId] = { ...record };
  }

  if (map[chordId]) {
    map[chordId].mistakeCount += 1;
    map[chordId].lastMistakeDate = timestamp;
  } else {
    map[chordId] = {
      chordId,
      mistakeCount: 1,
      lastMistakeDate: timestamp,
    };
  }

  if (!isLocalStorageAvailable()) {
    inMemoryFallback = map;
    return Object.values(map).sort((a, b) => b.mistakeCount - a.mistakeCount);
  }

  try {
    window.localStorage.setItem(CHORD_MISTAKES_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save chord mistakes to localStorage:', err);
    inMemoryFallback = map;
  }

  return Object.values(map).sort((a, b) => b.mistakeCount - a.mistakeCount);
}

/**
 * Clears all recorded chord mistakes.
 */
export function clearChordMistakes(): void {
  inMemoryFallback = {};
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(CHORD_MISTAKES_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to remove chord mistakes from localStorage:', err);
    }
  }
}

/**
 * Calculates summary statistics and relative percentages for visualization.
 */
export function calculateMistakesSummary(records: ChordMistakeRecord[]): MistakesSummary {
  const totalMistakes = records.reduce((sum, r) => sum + r.mistakeCount, 0);
  const uniqueChordsMissed = records.length;

  let mostMissedChordId: string | null = null;
  let maxCount = 0;
  let mostRecentDate: string | null = null;

  for (const r of records) {
    if (r.mistakeCount > maxCount) {
      maxCount = r.mistakeCount;
      mostMissedChordId = r.chordId;
    }
    if (!mostRecentDate || new Date(r.lastMistakeDate).getTime() > new Date(mostRecentDate).getTime()) {
      mostRecentDate = r.lastMistakeDate;
    }
  }

  const items: MistakeSummaryItem[] = records.map((r) => ({
    ...r,
    percentage: totalMistakes > 0 ? Math.round((r.mistakeCount / totalMistakes) * 100) : 0,
  }));

  return {
    totalMistakes,
    uniqueChordsMissed,
    mostMissedChordId,
    mostRecentMistakeDate: mostRecentDate,
    items,
  };
}

/**
 * Returns total mistake count across all chord types.
 */
export function getTotalMistakesCount(): number {
  const list = loadChordMistakes();
  return list.reduce((sum, r) => sum + r.mistakeCount, 0);
}
