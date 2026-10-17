# Independent Chord Mistakes Module & Analytics Tab

A dedicated, client-side mistake tracking and error analytics module that automatically records incorrectly answered chords in browser storage (`localStorage`), organizes them by chord type with error frequencies and timestamps, and visualizes them in an independent third tab with summary charts in both Kurdish (Kurmancî) and Turkish.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed with the user during Phase 1:
> - **Tracking Scope**: **Chord training only** — mistakes from the chord identification quiz will be captured and tracked.
> - **Mistakes View Mode**: **Summary charts with total counts** — providing an analytical breakdown of mistake distribution and frequency per chord type.
> - **Data Organization**: **Aggregated by chord type with mistake count and latest date** — showing how many times each specific chord type has been missed and the exact timestamp/date of the most recent error.
> - **Data Storage**: Client-side **browser storage (`localStorage`)** with zero backend telemetry or server dependence, ensuring 100% privacy and offline operation.

- **Storage Key**: `music_ear_trainer_chord_mistakes_v1`
- **Tab Placement**: Added as a 3rd tab in the primary top bar alongside Chord Training and Interval Training (`Şaşiyên Min` in Kurmancî, `Hatalarım` in Türkçe).
- **Reset Capability**: Provides a clear/reset action with confirmation to let the user wipe mistake history when starting a fresh study phase.

---

### 1. Overview & Core Concept

- **What It Does**: Whenever a user submits an incorrect chord answer in Chord Ear Training, the target chord they failed to identify is recorded in browser `localStorage`. In the new "My Mistakes" (`Şaşiyên Min` / `Hatalarım`) tab, the user can review an aggregated report showing:
  1. High-level performance cards (Total Mistakes, Most Missed Chord, Latest Error Date).
  2. Relative frequency bar visualizer comparing mistake rates across chord types.
  3. Ranked list of mistake items displaying the localized chord name, scale formula (e.g., `1 m3 5 m7`), mistake count, percentage of total errors, and formatted timestamp of the last occurrence.
  4. Reset option to clear the mistake log at any time.
- **Target Audience / Persona**: Music students, composers, and ear-training learners who want to identify their specific perceptual blind spots (e.g., consistently confusing Diminished 7th with Half-Diminished 7th, or Minor 7th with Dominant 7th) and track improvement over time.
- **Key Value**: Closes the learning loop by providing immediate self-awareness of recurring errors without requiring external accounts, servers, or complicated spreadsheets.

---

### 2. User Experience & Visual Design

#### Key User Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CHORD TRAINING SESSION                          │
│                                                                        │
│  User hears chord -> Submits guess                                     │
│  ├── If Correct: Green feedback, streaks increment                    │
│  └── If Wrong: Target chord is silently passed to Mistakes Storage     │
│      ├── Increments mistake count for this chord ID                    │
│      ├── Updates ISO timestamp of latest mistake                       │
│      └── Updates top bar mistake counter badge                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ (User switches tab)
┌────────────────────────────────────────────────────────────────────────┐
│                        MISTAKES ANALYTICS TAB                          │
│                                                                        │
│  Top Summary Grid:                                                     │
│  ├── Total Recorded Mistakes (e.g. 14 şaşî / 14 hata)                  │
│  ├── Most Missed Chord (e.g. Minor 7th · 5 caran)                      │
│  └── Most Recent Mistake Date (e.g. 17.10.2026 09:12)                  │
│                                                                        │
│  Frequency Distribution Chart:                                         │
│  └── Proportional comparative bars for each missed chord type          │
│                                                                        │
│  Ranked Mistake Table / Cards:                                         │
│  └── Localized Name · Scale Formula · Count · % Share · Last Date      │
│                                                                        │
│  Bottom Actions:                                                       │
│  └── Reset/Clear All Records (with safety confirmation)                │
└────────────────────────────────────────────────────────────────────────┘
```

#### Visual Identity & Theme
- **Aesthetic Direction**: Utilitarian, studio-grade dark interface consistent with the amber-accented stone design system (`stone-950` canvas, `stone-900` cards, `amber-500` primary interactive accents, `rose-500/rose-400` disciplined error accents).
- **60-30-10 Color Discipline**:
  - `60%`: Neutral dark canvas (`bg-stone-950` with subtle `stone-900` ambient background).
  - `30%`: Structural panels (`bg-stone-900`, `border-stone-800` hairline boundaries, `text-stone-300` and `text-stone-400` typography).
  - `10%`: Focused accents (`rose-400` error badge glyphs, `amber-500` active tab state, `emerald-500` nominal/empty state indicator).
- **Typography & Tabular Precision**:
  - Display titles: Clean, medium-weight headings with balanced wraps.
  - Metrics & Counts: Strict `font-mono tabular-nums` for all error counts, percentages, and timestamps to eliminate layout shift.
  - Scale degree formulas: Monospace badges (`1 m3 5 m7`, `1 3 5 M7`) matching the exact format implemented in the previous update.
- **Empty State**:
  - When no mistakes have been recorded (or after clearing), displays an encouraging empty state:
    - Kurmancî: *"Hîna ti şaşî nehatine tomarkirin. Dema ku hûn di ezmûna akoran de bersivek şaş bidin, ew ê li vir bêne tomarkirin."*
    - Türkçe: *"Henüz hiç hata kaydedilmedi. Akor kulak eğitiminde yanlış bir cevap verdiğinizde, detayları burada kaydedilecektir."*

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Pure Client-Side Browser Storage (`localStorage`)
- **Chosen Approach**: Use a dedicated, typed storage wrapper module (`src/storage/mistakesStorage.ts`) storing data under key `music_ear_trainer_chord_mistakes_v1`.
- **Why**: Zero network overhead, completely offline, zero authentication friction, and maximum user privacy.
- **Alternatives Considered**: IndexedDB (unnecessary complexity for an aggregated dictionary of at most 8 chord types), Firebase/Server database (user explicitly requested data to remain in the user's browser).

#### Decision 2: Aggregated Summary Schema with Date Stamp
- **Chosen Approach**: Store records as an ID-indexed map:
  ```ts
  Record<string, { chordId: string; mistakeCount: number; lastMistakeDate: string }>
  ```
- **Why**: Constant-time $O(1)$ lookups and updates on every mistake, minimal memory footprint, and maps directly to the user's requirement ("Aggregate by chord type with mistake count and latest date").
- **Alternatives Considered**: An unbounded array of event logs. While an event log allows time-series analysis, the user explicitly selected "Summary charts with total counts only" and "Aggregate by chord type".

#### Decision 3: Independent Module Architecture
- **Chosen Approach**: Decouple storage and statistics calculation into pure, side-effect-free helper functions (`getMistakesSummary`, `recordChordMistake`, `clearAllMistakes`) with automated unit tests (`mistakesStorage.test.ts`), and render via a standalone component (`ChordMistakesView.tsx`).
- **Why**: Keeps `ChordTraining.tsx` focused on playback/quiz mechanics without bloating it with analytics code, and allows `App.tsx` to mount `ChordMistakesView` cleanly.

---

### 4. Technical Architecture & Data Strategy

#### Component Hierarchy & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                                App.tsx                                 │
│  - language: 'ku' | 'tr'                                               │
│  - activeSection: 'chords' | 'intervals' | 'mistakes'                  │
│  - mistakesState: ChordMistakeRecord[] (updated via callback)          │
└───────┬───────────────────────────────┬────────────────────────┬───────┘
        │                               │                        │
        ▼                               ▼                        ▼
┌──────────────────┐          ┌──────────────────┐     ┌─────────────────┐
│  ChordTraining   │          │ IntervalTraining │     │ChordMistakesView│
│  - onMistake(id) │          │  (Standard view) │     │ - Summary Cards │
│  - Audio Playback│          └──────────────────┘     │ - Bar Chart     │
│  - Quiz Loop     │                                   │ - Ranked List   │
└───────┬──────────┘                                   │ - Reset Action  │
        │                                              └────────┬────────┘
        ▼                                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   src/storage/mistakesStorage.ts                       │
│  - loadChordMistakes(): ChordMistakeRecord[]                           │
│  - recordChordMistake(chordId: string): ChordMistakeRecord[]           │
│  - clearChordMistakes(): void                                          │
│  - calculateMistakesSummary(records): MistakesSummary                  │
│  - Reads/Writes: localStorage['music_ear_trainer_chord_mistakes_v1']   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Entities

```typescript
export interface ChordMistakeRecord {
  chordId: string;
  mistakeCount: number;
  lastMistakeDate: string; // ISO 8601 string (e.g. "2026-10-17T09:12:30.000Z")
}

export interface MistakesSummary {
  totalMistakes: number;
  uniqueChordsMissed: number;
  mostMissedChordId: string | null;
  mostRecentMistakeDate: string | null;
  items: Array<ChordMistakeRecord & {
    percentage: number;
  }>;
}
```

#### Internationalization Additions (`src/i18n/translations.ts`)
- Tab label: `mistakesTab`: `'Şaşiyên Min'` (Kurdish) / `'Hatalarım'` (Turkish).
- Header & subtitles: `mistakesTitle`, `mistakesSubtitle`.
- Metrics: `totalMistakesLabel`, `mostMissedChordLabel`, `lastMistakeDateLabel`.
- Chart & columns: `mistakeDistributionTitle`, `chordTypeHeader`, `mistakeCountHeader`, `percentageHeader`, `lastOccurredHeader`.
- Actions: `clearMistakesButton`, `confirmClearTitle`, `confirmClearMessage`, `confirmYes`, `confirmCancel`.
- Empty state: `noMistakesTitle`, `noMistakesDescription`.

---

### 5. Verification & Acceptance Criteria

1. **Storage Integrity**:
   - Calling `recordChordMistake('minor_seventh')` creates or increments the record in `localStorage` and stamps the current ISO date.
   - Calling `clearChordMistakes()` cleans the storage key safely without crashing if empty or corrupted.
   - Comprehensive unit tests written and verified via `npm run test`.
2. **Quiz Integration**:
   - In `ChordTraining.tsx`, when a user selects a wrong chord during an active quiz, `recordChordMistake(targetChordId)` is called immediately.
   - The top tab shows the updated mistake badge count without requiring a page reload.
3. **Dedicated Mistakes Tab UI**:
   - Switching to the new tab displays summary cards, proportional distribution bar chart, and ranked list with localized names, scale degrees, and dates.
   - Reset action opens confirmation dialog and cleanly clears the list and chart.
   - Switching language between Kurmancî and Türkçe instantly translates all mistake metrics and labels.
4. **Build & Type Checking**:
   - Passes `npm run test`, `npm run lint` (`tsc --noEmit`), and `npm run build`.
