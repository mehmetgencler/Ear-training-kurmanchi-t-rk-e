import { Instrument, ChordPlaybackMode, IntervalPlaybackMode } from '../types/music.js';
import { midiToFrequency } from '../music/definitions.js';

// Timing constants (in seconds)
export const AUDIO_TIMING = {
  SEQUENTIAL_CHORD_STEP: 0.42,
  SEQUENTIAL_CHORD_PAUSE: 0.28,
  SIMULTANEOUS_CHORD_DURATION: 2.6, // Increased chord sustain duration from 1.6s to 2.6s for richer harmonic listening
  SEQUENTIAL_NOTE_DURATION: 0.75, // Sequential chord tones sustain smoothly
  MELODIC_INTERVAL_STEP: 1.0, // Increased default time between interval notes from 0.55s to 1.0s
  MELODIC_FIRST_NOTE_DURATION: 1.6, // First note in melodic interval sustains longer for clear pitch retention
  HARMONIC_INTERVAL_DURATION: 1.6,
} as const;

interface SampleDefinition {
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

interface ActiveVoice {
  sources: AudioScheduledSourceNode[];
  gainNode: GainNode;
  stopTimer?: ReturnType<typeof setTimeout>;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSessionId = 0;
  private activeVoices: ActiveVoice[] = [];
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private sampleCache = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>();

  /**
   * Initializes or resumes the AudioContext upon user gesture.
   */
  public async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master output node with safe headroom
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

      // Dynamics compressor to guarantee no clipping across polyphony
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
      compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);

      // Kick off background preloading of core octave piano samples
      this.preloadCorePianoSamples();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Check if audio context is currently initialized and running
   */
  public isReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /**
   * Preload core piano samples (C3 to C5 default range)
   */
  public async preloadCorePianoSamples(): Promise<void> {
    const coreNames = ['C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5'];
    await Promise.allSettled(coreNames.map((name) => this.loadPianoSample(name)));
  }

  /**
   * Fetch and decode a recorded acoustic piano sample
   */
  public async loadPianoSample(sampleName: string): Promise<AudioBuffer | null> {
    if (this.sampleCache.has(sampleName)) {
      return this.sampleCache.get(sampleName)!;
    }
    if (this.loadingPromises.has(sampleName)) {
      return this.loadingPromises.get(sampleName)!;
    }

    const loadPromise = (async () => {
      try {
        const ctx = await this.ensureContext();
        let response: Response;
        try {
          response = await fetch(`/audio/piano/${sampleName}.mp3`);
          if (!response.ok) {
            throw new Error(`Local fetch status ${response.status}`);
          }
        } catch {
          // CDN fallback
          response = await fetch(`https://tonejs.github.io/audio/salamander/${sampleName}.mp3`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.sampleCache.set(sampleName, audioBuffer);
        return audioBuffer;
      } catch (err) {
        console.warn(`Could not load acoustic piano sample ${sampleName}:`, err);
        return null;
      } finally {
        this.loadingPromises.delete(sampleName);
      }
    })();

    this.loadingPromises.set(sampleName, loadPromise);
    return loadPromise;
  }

  /**
   * Ensure piano samples required for a list of MIDI notes are loaded
   */
  public async ensureSamplesForNotes(noteMidis: number[]): Promise<void> {
    const sampleNames = new Set(
      noteMidis.map((midi) => findClosestPianoSample(midi).sample.name)
    );
    await Promise.allSettled(
      Array.from(sampleNames).map((name) => this.loadPianoSample(name))
    );
  }

  /**
   * Immediately stops all currently playing notes, clears scheduled events,
   * and ramps down gain safely in 20ms to prevent pops/clicks.
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
              // Ignore if already stopped
            }
          }
          try {
            voice.gainNode.disconnect();
          } catch {
            // Ignore if already disconnected
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
    if (!this.ctx || !this.masterGain) {
      throw new Error('AudioContext is not initialized');
    }

    const ctx = this.ctx;
    const voiceGain = ctx.createGain();
    const sources: AudioScheduledSourceNode[] = [];
    const isAcoustic = instrument === 'acoustic-piano' || instrument === 'piano';

    if (isAcoustic) {
      // Acoustic Piano: Realistic recorded sample playback
      const { sample, playbackRate } = findClosestPianoSample(midi);
      const audioBuffer = this.sampleCache.get(sample.name);

      if (audioBuffer) {
        const bufferSource = ctx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.playbackRate.setValueAtTime(playbackRate, startTime);

        const peakVolume = Math.min(0.85, 0.46 * volumeScale);
        voiceGain.gain.setValueAtTime(0.0001, startTime);
        voiceGain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.004);

        // Natural decay with smooth release
        const releaseStart = Math.max(startTime + 0.004, startTime + duration - 0.25);
        voiceGain.gain.linearRampToValueAtTime(peakVolume * 0.72, releaseStart);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.15);

        bufferSource.connect(voiceGain);
        sources.push(bufferSource);

        bufferSource.start(startTime);
        bufferSource.stop(startTime + duration + 0.2);
      } else {
        // Fallback: warm acoustic approximation if sample is not yet cached
        const freq = midiToFrequency(midi);
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        const peakVolume = Math.min(0.7, 0.38 * volumeScale);
        voiceGain.gain.setValueAtTime(0.0001, startTime);
        voiceGain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.005);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(voiceGain);
        sources.push(osc);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      }
    } else {
      // Electric Piano: Synthesized tine chime with chorus shimmer
      const freq = midiToFrequency(midi);
      const peakVolume = Math.min(0.8, 0.42 * volumeScale);

      const oscFundamental = ctx.createOscillator();
      oscFundamental.type = 'sine';
      oscFundamental.frequency.setValueAtTime(freq, startTime);

      // Detuned chorus layer for characteristic warm Rhodes/e-piano chorus
      const oscChorus = ctx.createOscillator();
      oscChorus.type = 'triangle';
      oscChorus.frequency.setValueAtTime(freq * 1.002, startTime);
      const chorusGain = ctx.createGain();
      chorusGain.gain.setValueAtTime(0.18, startTime);
      oscChorus.connect(chorusGain);

      // 3rd harmonic chime (bell tine transient)
      const oscTine = ctx.createOscillator();
      oscTine.type = 'sine';
      oscTine.frequency.setValueAtTime(freq * 3, startTime);
      const tineGain = ctx.createGain();
      tineGain.gain.setValueAtTime(0.28, startTime);
      tineGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);
      oscTine.connect(tineGain);

      // Electric piano high-cut filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(20000, Math.max(1600, freq * 3.5)), startTime);

      oscFundamental.connect(filter);
      chorusGain.connect(filter);
      tineGain.connect(filter);
      filter.connect(voiceGain);

      sources.push(oscFundamental, oscChorus, oscTine);

      // Electric piano envelope: singing chime sustain
      voiceGain.gain.setValueAtTime(0.0001, startTime);
      voiceGain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.009);
      const sustainLevel = Math.max(0.0001, peakVolume * 0.45);
      voiceGain.gain.exponentialRampToValueAtTime(sustainLevel, startTime + 0.35);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      oscFundamental.start(startTime);
      oscChorus.start(startTime);
      oscTine.start(startTime);
      oscFundamental.stop(startTime + duration + 0.05);
      oscChorus.stop(startTime + duration + 0.05);
      oscTine.stop(startTime + duration + 0.05);
    }

    voiceGain.connect(this.masterGain);

    const activeVoice: ActiveVoice = {
      sources,
      gainNode: voiceGain,
    };

    // Auto cleanup voice once finished, accounting for future scheduled start time
    const delayToStart = Math.max(0, startTime - ctx.currentTime);
    const cleanupDelayMs = (delayToStart + duration + 0.25) * 1000;
    activeVoice.stopTimer = setTimeout(() => {
      const idx = this.activeVoices.indexOf(activeVoice);
      if (idx !== -1) {
        this.activeVoices.splice(idx, 1);
      }
      try {
        voiceGain.disconnect();
      } catch {
        // Disconnect safe
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
    const ctx = await this.ensureContext();

    // If Acoustic Piano, ensure sample buffers for notes are pre-fetched
    if (instrument === 'acoustic-piano' || instrument === 'piano') {
      await this.ensureSamplesForNotes(noteMidis);
    }

    this.stopAllPlayback();

    const now = ctx.currentTime + 0.03; // small 30ms scheduling buffer
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

      // Simultaneous chord plays after sequential notes finish
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
  }

  /**
   * Play interval notes according to selected mode:
   * - 'harmonic': both notes played simultaneously
   * - 'melodic' / 'melodic_ascending': sequential playback (first note played at now, second note played at now + step),
   *   supporting both ascending and descending intervals.
   */
  public async playInterval(
    noteMidis: [number, number],
    mode: IntervalPlaybackMode,
    instrument: Instrument,
    noteSpacing: number = AUDIO_TIMING.MELODIC_INTERVAL_STEP
  ): Promise<void> {
    const ctx = await this.ensureContext();

    // If Acoustic Piano, ensure sample buffers for notes are pre-fetched
    if (instrument === 'acoustic-piano' || instrument === 'piano') {
      await this.ensureSamplesForNotes(noteMidis);
    }

    this.stopAllPlayback();

    const now = ctx.currentTime + 0.03;
    const [firstMidi, secondMidi] = noteMidis;
    const polyphonyScale = 1 / Math.SQRT2;

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
      // Melodic playback (Mode B): first note followed by second note
      // Can be ascending (lower -> upper) or descending (upper -> lower)
      const step = Math.max(0.3, noteSpacing);
      // First note sustains longer so the ear can firmly grasp and retain the pitch
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
  }
}

// Export singleton audio engine
export const audioEngine = new AudioEngine();
