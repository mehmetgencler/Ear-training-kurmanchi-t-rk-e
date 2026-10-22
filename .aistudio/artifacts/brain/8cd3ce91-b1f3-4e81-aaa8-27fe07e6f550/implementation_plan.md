# Chord Progression Ear Training & Dim7 Chord Integration

A comprehensive blueprint for introducing an independent **Chord Progression Test** section with adjustable length tiers, two-pass audio playback, automated female voice speech reveal, and integrating the **4-voice Diminished 7th (`dim7`)** chord into the chord stack.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed through interactive clarification and define the core behavior of the new feature:
> - **Flow & Interaction**: Auto-reveal loop with optional interactive guess buttons. Users can practice hands-free while actively testing their recognition before the spoken answer.
> - **Voice & Pronunciation**: Browser Web Speech API configured with an English female voice uttering clear scale degree numbers (e.g., *"one four one"*, *"one six four five"*).
> - **Progression Difficulty**: Structured into adjustable length tiers: **3 Chords** (foundational cadences), **4 Chords** (classic pop/classical cadences), and **5 Chords** (extended harmonic journeys).
> - **Dim7 Chord Addition**: A 4-voice diminished seventh chord (`[0, 3, 6, 9]`, formula `1 m3 b5 bb7`) added seamlessly to the 4-note chord training stack, mistake analytics, and localization dictionaries.

---

## 1. Overview & Core Concept

### What It Does
- **Chord Progression Test Section**: An independent ear-training module that generates functional diatonic chord progressions in popular musical keys (e.g. C Major, G Major, F Major, D Major).
- **Two-Pass Listening & Voice Reveal**:
  1. App plays the progression rhythmically (smooth voice-leading or root-position piano chords with gentle decay).
  2. Waits for a reflective pause (~2.2s).
  3. Plays the progression a second time for verification.
  4. Waits a brief moment (~1.8s).
  5. A natural female voice speaks the answer aloud (e.g., *"one four one"*), while the visual Roman numeral cards reveal simultaneously (`I - IV - I`).
- **Interactive Option**: While the audio plays, users can optionally tap chord number buttons (`I`, `ii`, `iii`, `IV`, `V`, `vi`, `vii°`) to submit their guess before the voice announces it, earning instant visual feedback and tracking progression mastery.
- **Dim7 Chord Integration**: Expands the 4-note chord inventory from 4 chords to 5 chords (`maj7`, `7`, `m7`, `m7b5`, and `dim7`), giving musicians a complete toolkit for seventh chords.

---

## 2. User Experience & Visual Design

### Two-Zone Layout (Education & Simulation Domain)
Following the educational simulation guidelines, the Progression section is split into two coordinated zones:

```
┌────────────────────────────────────────────────────────────────────────┐
│  PERWERDEYA GUHÎ  ·  Akor & Navber & Pêşveçûn                           │
│  [Perwerdeya Akoran]  [Testa Pêşveçûnê (New)]  [Navberan]  [Şaşiyên Min] │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Zone 1: Stage & Progression Workspace                                  │
│                                                                        │
│  [ Stage: Playing Pass 1 / Pass 2 / Spoken Answer / Completed ]        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │   Chord 1         Chord 2         Chord 3        [Chord 4 / 5]   │  │
│  │   ┌─────┐         ┌─────┐         ┌─────┐                        │  │
│  │   │  I  │   ──►   │ IV  │   ──►   │  I  │                        │  │
│  │   │  C  │         │  F  │         │  C  │                        │  │
│  │   └─────┘         └─────┘         └─────┘                        │  │
│  │   "One"           "Four"          "One"                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [ Optional Guess Slots & Degree Picker: I  ii  iii  IV  V  vi  vii° ] │
├────────────────────────────────────────────────────────────────────────┤
│ Zone 2: Control & Configuration Deck                                   │
│  - Level Tier: [ 3 Chords ]  [ 4 Chords ]  [ 5 Chords ]                │
│  - Playback Controls: [ Play / Pause ] [ Replay Now ] [ Next Question] │
│  - Pace Slider: Chord duration (0.8s – 2.0s) & Voice volume            │
│  - Auto-Advance Toggle: Hands-free continuous loop vs manual next      │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Styling & Accessibility
- **Theme Consistency**: Preserves the sophisticated deep-stone aesthetic (`bg-stone-950`, `border-stone-800`, `text-stone-100`, `accent-amber-500`).
- **Roman Numeral Badges**: Clean, unboxed typography cards with distinct harmonic colors (Tonic in amber/emerald, Subdominant in sky blue, Dominant in purple/rose).
- **Motion & Pulsing States**: Active chord illuminates as it sounds, providing visual synchronization without distracting flash.
- **Single-Line Controls**: All buttons and segmented controls follow strict single-line text constraints (`whitespace-nowrap shrink-0`).

---

## 3. Key Product Decisions & Trade-Offs

### 1. Progression Library & Generation Strategy
- **Decision**: Curate realistic, musically sound diatonic progressions categorized by length tiers (3, 4, and 5 chords) combined with dynamic key transposition (C, G, D, F, Bb Major).
  - *Tier 1 (3 Chords)*: `I - IV - I`, `I - V - I`, `I - IV - V`, `I - V - IV`, `ii - V - I`, `I - vi - I`.
  - *Tier 2 (4 Chords)*: `I - IV - V - I`, `I - V - vi - IV` (Pop cadence), `I - vi - IV - V` (Doo-wop), `ii - V - I - I`, `I - IV - ii - V`, `I - vi - ii - V`.
  - *Tier 3 (5 Chords)*: `I - vi - ii - V - I`, `I - IV - I - V - I`, `I - V - vi - iii - IV`, `ii - V - iii - vi - ii`.
- **Why**: Purely random chord sequences sound musically nonsensical and harm functional harmonic training. Curated diatonic patterns teach users real musical syntax used in classical, pop, jazz, and folk music.

### 2. Speech Synthesis Architecture
- **Decision**: Native browser `window.speechSynthesis` with intelligent female voice filtering and graceful fallback.
  - Detects preferred English female voices: `"Google US English (Female)"`, `"Samantha"`, `"Victoria"`, `"Karen"`, `"Zira"`, or voices with `lang: 'en-*'` and pitch modulation.
  - Speaks spaced words (e.g. `utterance.text = "one . four . one"`) with `rate: 0.9` for clear educational enunciation.
- **Why**: Zero external API dependencies, zero network latency, zero costs, and 100% offline capability.

### 3. Voice Leading & Acoustic Realism in AudioEngine
- **Decision**: Extend `AudioEngine` to support sequential chord progressions (`playChordProgression`) with smooth sustain and natural voice leading, avoiding jarring jumps across octaves.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                            App.tsx                                  │
│   activeSection: 'chords' | 'progressions' | 'intervals' | 'mistakes'│
└──────────────┬───────────────────────────────┬──────────────────────┘
               │                               │
┌──────────────▼─────────────┐   ┌─────────────▼──────────────────────┐
│     ChordTraining.tsx      │   │   ChordProgressionTraining.tsx     │
│  - 8 Chords + NEW dim7     │   │  - 3, 4, 5 Chord Length Tiers      │
│  - Chord Mistake Tracking  │   │  - Two-Pass Audio Loop             │
└──────────────┬─────────────┘   │  - Web Speech Female Voice Engine  │
               │                 │  - Optional Guess Buttons          │
               │                 └─────────────┬──────────────────────┘
               ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 src/audio/audioEngine.ts                            │
│  - playChord(), playInterval()                                      │
│  - NEW: playProgressionSequence(chords, chordDuration, spacing)     │
│  - NEW: speechService.ts (female voice synthesis helper)            │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Structures & Types
```typescript
export interface ProgressionChord {
  degree: 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°';
  spokenName: string; // "one", "two", "three", "four", "five", "six", "seven"
  quality: 'major' | 'minor' | 'diminished';
  rootMidi: number;
  noteMidis: number[];
  noteNames: string[];
}

export interface ProgressionQuestion {
  id: string;
  keyName: string; // e.g. "C Major"
  keyRootMidi: number;
  romanNumerals: string[]; // e.g. ["I", "IV", "I"]
  spokenAnswer: string; // "one four one"
  chords: ProgressionChord[];
  tier: 3 | 4 | 5;
}
```

---

## 5. Step-by-Step Implementation Strategy

1. **Music Definitions**:
   - Add `diminished_seventh` to `CHORD_DEFINITIONS` in `src/music/definitions.ts`.
   - Add diatonic progression generator and templates in `src/music/progressionLogic.ts`.
2. **Audio & Speech Engine**:
   - Add `playProgressionSequence` in `src/audio/audioEngine.ts`.
   - Implement `speakAnswer(text)` in `src/audio/speechEngine.ts` targeting female English voices.
3. **Localization**:
   - Update `src/i18n/translations.ts` with Kurdish and Turkish translations for progression tests and dim7.
4. **Component Implementation**:
   - Build `src/components/ChordProgressionTraining.tsx` with two-zone layout, progress indicator, level tier tabs, guess buttons, and replay.
   - Update `App.tsx` navigation bar with new "Testa Pêşveçûnê" / "Akor İlerlemesi" tab.
5. **Unit Testing & Verification**:
   - Write comprehensive tests in `src/music/progressionLogic.test.ts`.
   - Validate build with `npm run test` and `compile_applet`.
   - Run browser verification with Chromium via `playwright-cli`.
