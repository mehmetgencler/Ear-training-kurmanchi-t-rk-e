import { Instrument, ChordPlaybackMode, IntervalPlaybackMode } from '../types/music.js';
import { midiToFrequency } from '../music/definitions.js';

// Timing constants (in seconds)
export const AUDIO_TIMING = {
  SEQUENTIAL_CHORD_STEP: 0.42,
  SEQUENTIAL_CHORD_PAUSE: 0.28,
  SIMULTANEOUS_CHORD_DURATION: 2.6, // Sustain duration for rich harmonic listening
  SEQUENTIAL_NOTE_DURATION: 0.75, // Sequential chord tones sustain smoothly
  MELODIC_INTERVAL_STEP: 1.0, // Time between interval notes
  MELODIC_FIRST_NOTE_DURATION: 1.6, // First note in melodic interval sustains longer
  HARMONIC_INTERVAL_DURATION: 1.6,
} as const;

export interface SampleDefinition {
  name: string; // e.g. "C4"
  midi: number; // e.g. 60
}

/**
 * Curated recorded acoustic grand piano samples covering C1 to C8 (and pitch-shifting to C9).
 * Stored locally in /audio/piano/ with CDN fallback.
 */
export const ACOUSTIC_PIANO_SAMPLES: readonly SampleDefinition[] = [
  { name: 'C1', midi: 24 },
  { name: 'Ds1', midi: 27 },
  { name: 'Fs1', midi: 30 },
  { name: 'A1', midi: 33 },
  { name: 'C2', midi: 36 },
  { name: 'Ds2', midi: 39 },
  { name: 'Fs2', midi: 42 },
  { name: 'A2', midi: 45 },
  { name: 'C3', midi: 48 },
  { name: 'Ds3', midi: 51 },
  { name: 'Fs3', midi: 54 },
  { name: 'A3', midi: 57 },
  { name: 'C4', midi: 60 },
  { name: 'Ds4', midi: 63 },
  { name: 'Fs4', midi: 66 },
  { name: 'A4', midi: 69 },
  { name: 'C5', midi: 72 },
  { name: 'Ds5', midi: 75 },
  { name: 'Fs5', midi: 78 },
  { name: 'A5', midi: 81 },
  { name: 'C6', midi: 84 },
  { name: 'Ds6', midi: 87 },
  { name: 'Fs6', midi: 90 },
  { name: 'A6', midi: 93 },
  { name: 'C7', midi: 96 },
  { name: 'Ds7', midi: 99 },
  { name: 'Fs7', midi: 102 },
  { name: 'A7', midi: 105 },
  { name: 'C8', midi: 108 },
] as const;

/**
 * Finds the closest recorded sample and the necessary pitch-shift playback rate.
 */
export function findClosestPianoSample(targetMidi: number): { sample: SampleDefinition; playbackRate: number } {
  let closest = ACOUSTIC_PIANO_SAMPLES[0];
  let minDiff = Math.abs(targetMidi - closest.midi);

  for (let i = 1; i < ACOUSTIC_PIANO_SAMPLES.length; i++) {
    const diff = Math.abs(targetMidi - ACOUSTIC_PIANO_SAMPLES[i].midi);
    if (diff < minDiff) {
      minDiff = diff;
      closest = ACOUSTIC_PIANO_SAMPLES[i];
    }
  }

  const semitoneOffset = targetMidi - closest.midi;
  const playbackRate = Math.pow(2, semitoneOffset / 12);
  return { sample: closest, playbackRate };
}

export interface AudioDiagnostics {
  contextState: string;
  isUnlocked: boolean;
  sampleCount: number;
  failedSamples: string[];
  lastError: string | null;
  isIOS: boolean;
}

interface ActiveVoice {
  sources: AudioScheduledSourceNode[];
  gainNode: GainNode;
  stopTimer?: ReturnType<typeof setTimeout>;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isUnlocked = false;
  private currentSessionId = 0;
  private activeVoices: ActiveVoice[] = [];
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private sampleCache = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>();
  private failedSampleUrls: string[] = [];
  private lastErrorMessage: string | null = null;
  private lifecycleInitialized = false;

  constructor() {
    this.initLifecycle();
  }

  /**
   * Helper to detect iOS (iPhone / iPad / iPod) including iPadOS desktop Safari mode
   */
  public isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isStandardIOS = /iPad|iPhone|iPod/.test(ua);
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isStandardIOS || isIPadOS;
  }

  /**
   * Universal decodeAudioData supporting Promise and Callback (crucial for older Safari and WebKit)
   */
  private decodeAudio(ctx: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      // slice buffer to keep original intact if retried
      const copy = buffer.slice(0);
      try {
        const p = ctx.decodeAudioData(
          copy,
          (decoded) => resolve(decoded),
          (err) => reject(err)
        );
        if (p && typeof p.then === 'function') {
          p.then(resolve).catch(reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Initialize event listeners for tab visibility, app-switch, and user interaction unlocks
   */
  public initLifecycle(): void {
    if (this.lifecycleInitialized || typeof window === 'undefined') return;
    this.lifecycleInitialized = true;

    // Attach unlock handlers on first user gesture
    const onFirstGesture = () => {
      this.unlockAudio().catch(() => {});
    };

    window.addEventListener('touchstart', onFirstGesture, { passive: true, capture: true });
    window.addEventListener('touchend', onFirstGesture, { passive: true, capture: true });
    window.addEventListener('pointerdown', onFirstGesture, { passive: true, capture: true });
    window.addEventListener('click', onFirstGesture, { passive: true, capture: true });
    window.addEventListener('keydown', onFirstGesture, { passive: true, capture: true });

    // Handle tab visibility and app switching (iOS WebKit puts AudioContext into 'interrupted')
    const handleVisibilityRecovery = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && this.ctx) {
        const state = this.ctx.state as string;
        if (state === 'suspended' || state === 'interrupted') {
          this.ctx.resume().catch(() => {});
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityRecovery);
    }
    window.addEventListener('pageshow', handleVisibilityRecovery);
    window.addEventListener('focus', handleVisibilityRecovery);

    // Warm up core acoustic piano samples immediately in the background
    setTimeout(() => {
      this.preloadCorePianoSamples();
    }, 50);
  }

  /**
   * Lazily creates or returns the singleton AudioContext and master gain graph
   */
  public getOrCreateContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass =
        (typeof window !== 'undefined' && (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) ||
        null;

      if (!AudioCtxClass) {
        throw new Error('Web Audio API is not supported in this browser environment');
      }

      this.ctx = new AudioCtxClass();

      // Clean master gain routing straight to destination
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.masterGain = masterGain;
    }

    return this.ctx;
  }

  /**
   * Ensure the AudioContext exists and attempt resume
   */
  public async ensureContext(): Promise<AudioContext> {
    const ctx = this.getOrCreateContext();
    const state = ctx.state as string;

    if (state === 'suspended' || state === 'interrupted') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn(`AudioContext.resume() from state '${state}' deferred:`, err);
      }
    }

    return ctx;
  }

  /**
   * Hardware audio unlock for iOS Safari, Chrome on iOS, and Android browsers.
   * 1. Resumes AudioContext synchronously
   * 2. Plays a 1-sample silent Web Audio buffer directly to destination
   * 3. Sets isUnlocked = true
   */
  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    try {
      const ctx = this.getOrCreateContext();

      // Synchronous resume call directly inside the user gesture stack
      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        const p = ctx.resume();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }

      // 1-sample silent buffer directly through Web Audio
      try {
        const silentBuffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch {
        // Safe ignore
      }

      // Wait for state check
      if (ctx.state !== 'running') {
        try {
          await ctx.resume();
        } catch {
          // Ignore
        }
      }

      this.isUnlocked = ctx.state === 'running';
      if (this.isUnlocked) {
        this.lastErrorMessage = null;
        this.preloadCorePianoSamples();
      }
      return this.isUnlocked;
    } catch (err) {
      this.lastErrorMessage = err instanceof Error ? err.message : String(err);
      return false;
    }
  }

  /**
   * Check if audio context is currently initialized and running
   */
  public isReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /**
   * Diagnostic snapshot for error monitoring and UI troubleshooting
   */
  public getDiagnostics(): AudioDiagnostics {
    return {
      contextState: this.ctx ? (this.ctx.state as string) : 'uninitialized',
      isUnlocked: this.isUnlocked,
      sampleCount: this.sampleCache.size,
      failedSamples: [...this.failedSampleUrls],
      lastError: this.lastErrorMessage,
      isIOS: this.isIOS(),
    };
  }

  /**
   * Preload core octave samples (C3 to C5) so they are immediately available
   */
  public preloadCorePianoSamples(): void {
    const coreSamples = ['C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5'];
    for (const name of coreSamples) {
      this.loadPianoSample(name).catch(() => {});
    }
  }

  /**
   * Loads and decodes an individual acoustic piano sample buffer.
   * Tries local path first, then absolute URL, then CDN.
   */
  public async loadPianoSample(sampleName: string): Promise<AudioBuffer | null> {
    if (typeof window === 'undefined') return null;

    const cached = this.sampleCache.get(sampleName);
    if (cached) return cached;

    const existingPromise = this.loadingPromises.get(sampleName);
    if (existingPromise) return existingPromise;

    const loadPromise = (async (): Promise<AudioBuffer | null> => {
      try {
        const ctx = this.getOrCreateContext();
        let arrayBuffer: ArrayBuffer | null = null;

        const basePath =
          typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
            ? import.meta.env.BASE_URL.replace(/\/$/, '')
            : '';
        const localUrl = `${basePath}/audio/piano/${sampleName}.mp3`;

        // 1. Try local URL with timeout
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const response = await fetch(localUrl, { signal: controller.signal });
          clearTimeout(timer);
          if (response.ok) {
            arrayBuffer = await response.arrayBuffer();
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch {
          // 2. Fallback to direct absolute /audio/piano/
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2500);
            const response = await fetch(`/audio/piano/${sampleName}.mp3`, { signal: controller.signal });
            clearTimeout(timer);
            if (response.ok) {
              arrayBuffer = await response.arrayBuffer();
            } else {
              throw new Error(`HTTP ${response.status}`);
            }
          } catch {
            // 3. Fallback to Tone.js Salamander CDN
            const cdnUrl = `https://tonejs.github.io/audio/salamander/${sampleName}.mp3`;
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 3500);
              const cdnResp = await fetch(cdnUrl, { signal: controller.signal });
              clearTimeout(timer);
              if (cdnResp.ok) {
                arrayBuffer = await cdnResp.arrayBuffer();
              } else {
                this.failedSampleUrls.push(cdnUrl);
              }
            } catch {
              this.failedSampleUrls.push(cdnUrl);
            }
          }
        }

        if (!arrayBuffer) {
          this.failedSampleUrls.push(localUrl);
          return null;
        }

        const audioBuffer = await this.decodeAudio(ctx, arrayBuffer);
        this.sampleCache.set(sampleName, audioBuffer);
        return audioBuffer;
      } catch (err) {
        console.warn(`Could not load acoustic piano sample ${sampleName}:`, err);
        this.lastErrorMessage = `Sample decode/load failed for ${sampleName}: ${err}`;
        return null;
      } finally {
        this.loadingPromises.delete(sampleName);
      }
    })();

    this.loadingPromises.set(sampleName, loadPromise);
    return loadPromise;
  }

  /**
   * Pre-fetches required piano samples with a quick timeout (120ms max wait)
   * so slow networks never block audio playback.
   */
  public async ensureSamplesForNotes(noteMidis: number[], maxWaitMs = 120): Promise<void> {
    const sampleNames = new Set(
      noteMidis.map((midi) => findClosestPianoSample(midi).sample.name)
    );
    const loadPromises = Array.from(sampleNames).map((name) => this.loadPianoSample(name));

    await Promise.race([
      Promise.allSettled(loadPromises),
      new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
    ]);
  }

  /**
   * Immediately stops all currently playing notes and ramps down gain safely in 20ms
   */
  public stopAllPlayback(): void {
    this.currentSessionId++;

    for (const timeout of this.pendingTimeouts) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts = [];

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    for (const voice of this.activeVoices) {
      if (voice.stopTimer) {
        clearTimeout(voice.stopTimer);
      }
      try {
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.02);

        setTimeout(() => {
          for (const src of voice.sources) {
            try {
              src.stop();
              src.disconnect();
            } catch {
              // Ignore
            }
          }
          try {
            voice.gainNode.disconnect();
          } catch {
            // Ignore
          }
        }, 30);
      } catch {
        // Safe fallback
      }
    }
    this.activeVoices = [];
  }

  /**
   * Schedule voice playback using recorded Acoustic Piano samples or synthesized Electric Piano.
   */
  private scheduleVoice(
    midi: number,
    startTime: number,
    duration: number,
    instrument: Instrument,
    volumeScale: number
  ): ActiveVoice {
    const ctx = this.getOrCreateContext();
    if (!this.masterGain) {
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.masterGain = masterGain;
    }

    const voiceGain = ctx.createGain();
    const sources: AudioScheduledSourceNode[] = [];
    const isAcoustic = instrument === 'acoustic-piano' || instrument === 'piano';

    // Ensure strictly valid start time
    const safeStartTime = Math.max(ctx.currentTime, startTime);

    if (isAcoustic) {
      const { sample, playbackRate } = findClosestPianoSample(midi);
      const audioBuffer = this.sampleCache.get(sample.name);

      if (audioBuffer) {
        const bufferSource = ctx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.playbackRate.setValueAtTime(playbackRate, safeStartTime);

        const peakVolume = Math.min(0.9, 0.48 * volumeScale);
        voiceGain.gain.setValueAtTime(0.0001, safeStartTime);
        voiceGain.gain.linearRampToValueAtTime(peakVolume, safeStartTime + 0.005);

        const releaseStart = Math.max(safeStartTime + 0.005, safeStartTime + duration - 0.2);
        voiceGain.gain.linearRampToValueAtTime(peakVolume * 0.72, releaseStart);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, releaseStart + 0.25);

        bufferSource.connect(voiceGain);
        sources.push(bufferSource);

        bufferSource.start(safeStartTime);
        bufferSource.stop(releaseStart + 0.3);
      } else {
        // Fallback: warm triangle synth approximation so user NEVER experiences silence
        const freq = midiToFrequency(midi);
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, safeStartTime);
        const peakVolume = Math.min(0.75, 0.42 * volumeScale);
        voiceGain.gain.setValueAtTime(0.0001, safeStartTime);
        voiceGain.gain.linearRampToValueAtTime(peakVolume, safeStartTime + 0.005);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, safeStartTime + duration);
        osc.connect(voiceGain);
        sources.push(osc);
        osc.start(safeStartTime);
        osc.stop(safeStartTime + duration + 0.05);
      }
    } else {
      // Electric Piano: Synthesized tine chime with chorus shimmer
      const freq = midiToFrequency(midi);
      const peakVolume = Math.min(0.85, 0.44 * volumeScale);

      const oscFundamental = ctx.createOscillator();
      oscFundamental.type = 'sine';
      oscFundamental.frequency.setValueAtTime(freq, safeStartTime);

      const oscChorus = ctx.createOscillator();
      oscChorus.type = 'triangle';
      oscChorus.frequency.setValueAtTime(freq * 1.002, safeStartTime);
      const chorusGain = ctx.createGain();
      chorusGain.gain.setValueAtTime(0.18, safeStartTime);
      oscChorus.connect(chorusGain);

      const oscTine = ctx.createOscillator();
      oscTine.type = 'sine';
      oscTine.frequency.setValueAtTime(freq * 3, safeStartTime);
      const tineGain = ctx.createGain();
      tineGain.gain.setValueAtTime(0.28, safeStartTime);
      tineGain.gain.exponentialRampToValueAtTime(0.001, safeStartTime + 0.25);
      oscTine.connect(tineGain);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(20000, Math.max(1600, freq * 3.5)), safeStartTime);

      oscFundamental.connect(filter);
      chorusGain.connect(filter);
      tineGain.connect(filter);
      filter.connect(voiceGain);

      sources.push(oscFundamental, oscChorus, oscTine);

      // Strictly monotonic envelope
      voiceGain.gain.setValueAtTime(0.0001, safeStartTime);
      voiceGain.gain.linearRampToValueAtTime(peakVolume, safeStartTime + 0.008);
      const decayTime = Math.min(safeStartTime + 0.35, safeStartTime + duration * 0.5);
      const sustainLevel = Math.max(0.0001, peakVolume * 0.45);
      voiceGain.gain.exponentialRampToValueAtTime(sustainLevel, Math.max(safeStartTime + 0.01, decayTime));
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, Math.max(decayTime + 0.01, safeStartTime + duration));

      oscFundamental.start(safeStartTime);
      oscChorus.start(safeStartTime);
      oscTine.start(safeStartTime);
      oscFundamental.stop(safeStartTime + duration + 0.05);
      oscChorus.stop(safeStartTime + duration + 0.05);
      oscTine.stop(safeStartTime + duration + 0.05);
    }

    voiceGain.connect(this.masterGain);

    const activeVoice: ActiveVoice = {
      sources,
      gainNode: voiceGain,
    };

    const delayToStart = Math.max(0, safeStartTime - ctx.currentTime);
    const cleanupDelayMs = (delayToStart + duration + 0.3) * 1000;
    activeVoice.stopTimer = setTimeout(() => {
      const idx = this.activeVoices.indexOf(activeVoice);
      if (idx !== -1) {
        this.activeVoices.splice(idx, 1);
      }
      try {
        voiceGain.disconnect();
      } catch {
        // Safe disconnect
      }
    }, cleanupDelayMs);

    this.activeVoices.push(activeVoice);
    return activeVoice;
  }

  /**
   * Play chord notes according to selected mode:
   * - 'simultaneous': all notes together
   * - 'sequential_then_simultaneous': ascending notes sequentially, followed immediately by simultaneous chord
   */
  public async playChord(
    noteMidis: number[],
    mode: ChordPlaybackMode,
    instrument: Instrument,
    sustainDuration: number = AUDIO_TIMING.SIMULTANEOUS_CHORD_DURATION
  ): Promise<void> {
    try {
      const ctx = this.getOrCreateContext();

      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        try {
          await ctx.resume();
        } catch (err) {
          console.warn('Could not resume context in playChord:', err);
        }
      }

      if (instrument === 'acoustic-piano' || instrument === 'piano') {
        const missing = noteMidis.filter((m) => !this.sampleCache.has(findClosestPianoSample(m).sample.name));
        if (missing.length > 0) {
          await this.ensureSamplesForNotes(noteMidis, 120);
        }
      }

      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        try {
          await ctx.resume();
        } catch {
          // Ignore
        }
      }

      this.stopAllPlayback();

      const now = ctx.currentTime + 0.03;
      const polyphonyScale = 1 / Math.sqrt(noteMidis.length);
      const duration = Math.max(1.0, sustainDuration);

      if (mode === 'simultaneous') {
        for (const midi of noteMidis) {
          this.scheduleVoice(
            midi,
            now,
            duration,
            instrument,
            polyphonyScale
          );
        }
      } else {
        // Sequential, then simultaneous
        let currentOffset = 0;
        noteMidis.forEach((midi) => {
          this.scheduleVoice(
            midi,
            now + currentOffset,
            AUDIO_TIMING.SEQUENTIAL_NOTE_DURATION,
            instrument,
            0.85
          );
          currentOffset += AUDIO_TIMING.SEQUENTIAL_CHORD_STEP;
        });

        const simultaneousStartTime = now + currentOffset + AUDIO_TIMING.SEQUENTIAL_CHORD_PAUSE;

        for (const midi of noteMidis) {
          this.scheduleVoice(
            midi,
            simultaneousStartTime,
            duration,
            instrument,
            polyphonyScale
          );
        }
      }
    } catch (err) {
      this.lastErrorMessage = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  /**
   * Play interval notes according to selected mode:
   * - 'harmonic': both notes played simultaneously
   * - 'melodic': sequential playback (first note played at now, second note played at now + step)
   */
  public async playInterval(
    noteMidis: [number, number],
    mode: IntervalPlaybackMode,
    instrument: Instrument,
    noteSpacing: number = AUDIO_TIMING.MELODIC_INTERVAL_STEP
  ): Promise<void> {
    try {
      const ctx = this.getOrCreateContext();

      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        try {
          await ctx.resume();
        } catch (err) {
          console.warn('Could not resume context in playInterval:', err);
        }
      }

      if (instrument === 'acoustic-piano' || instrument === 'piano') {
        const missing = noteMidis.filter((m) => !this.sampleCache.has(findClosestPianoSample(m).sample.name));
        if (missing.length > 0) {
          await this.ensureSamplesForNotes(noteMidis, 120);
        }
      }

      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        try {
          await ctx.resume();
        } catch {
          // Ignore
        }
      }

      this.stopAllPlayback();

      const now = ctx.currentTime + 0.03;
      const [firstMidi, secondMidi] = noteMidis;
      const polyphonyScale = 1 / Math.sqrt(2);

      if (mode === 'harmonic') {
        this.scheduleVoice(
          firstMidi,
          now,
          AUDIO_TIMING.HARMONIC_INTERVAL_DURATION,
          instrument,
          polyphonyScale
        );
        this.scheduleVoice(
          secondMidi,
          now,
          AUDIO_TIMING.HARMONIC_INTERVAL_DURATION,
          instrument,
          polyphonyScale
        );
      } else {
        const step = Math.max(0.3, noteSpacing);
        const note1Duration = Math.max(AUDIO_TIMING.MELODIC_FIRST_NOTE_DURATION, step + 0.4);
        this.scheduleVoice(
          firstMidi,
          now,
          note1Duration,
          instrument,
          0.85
        );
        this.scheduleVoice(
          secondMidi,
          now + step,
          AUDIO_TIMING.HARMONIC_INTERVAL_DURATION,
          instrument,
          0.85
        );
      }
    } catch (err) {
      this.lastErrorMessage = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }
}

// Export singleton audio engine
export const audioEngine = new AudioEngine();
if (typeof window !== 'undefined') {
  (window as unknown as { __audioEngine: AudioEngine }).__audioEngine = audioEngine;
}
