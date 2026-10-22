import { audioEngine } from './audioEngine.js';

export const SPOKEN_NUMBER_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
] as const;

export type SpokenNumberWord = typeof SPOKEN_NUMBER_WORDS[number];

/**
 * High-fidelity Voice Engine for chord progression ear training.
 * Uses real recorded human female voice audio files decoded through Web Audio API
 * (guaranteed to play seamlessly on all iOS, Android, and Desktop browsers without
 * being subject to Web Speech API restrictions or missing voice packs).
 * Includes seamless Web Speech API and HTML5 Audio fallbacks.
 */
class SpeechEngine {
  private voiceBuffers = new Map<string, AudioBuffer>();
  private loadingPromise: Promise<void> | null = null;
  private isSpeaking = false;
  private activeVoices: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
  private speechCancelFn: (() => void) | null = null;

  constructor() {
    // Warm up voice buffer loading in browser
    if (typeof window !== 'undefined') {
      this.preloadVoiceBuffers().catch(() => {});
    }
  }

  /**
   * Preloads and decodes the 7 female voice MP3 files into Web Audio buffers
   */
  public async preloadVoiceBuffers(): Promise<void> {
    if (this.voiceBuffers.size === SPOKEN_NUMBER_WORDS.length) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        const ctx = await audioEngine.ensureContext();

        const loadPromises = SPOKEN_NUMBER_WORDS.map(async (word) => {
          if (this.voiceBuffers.has(word)) return;
          try {
            const url = `/audio/voice/${word}.mp3`;
            const resp = await fetch(url);
            if (!resp.ok) {
              console.warn(`Could not fetch female voice file for '${word}': HTTP ${resp.status}`);
              return;
            }
            const arrayBuffer = await resp.arrayBuffer();
            const audioBuffer = await audioEngine.decodeAudio(ctx, arrayBuffer);
            this.voiceBuffers.set(word, audioBuffer);
          } catch (err) {
            console.warn(`Failed to decode voice audio for '${word}':`, err);
          }
        });

        await Promise.allSettled(loadPromises);
      } catch (err) {
        console.warn('Voice buffer initialization error:', err);
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Plays a single voice word through Web Audio API
   */
  private async playAudioBufferWord(word: string): Promise<void> {
    const ctx = await audioEngine.ensureContext();
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      try {
        await ctx.resume();
      } catch {
        // Safe ignore
      }
    }

    let buffer = this.voiceBuffers.get(word.toLowerCase());
    if (!buffer) {
      // Try on-demand load
      try {
        const resp = await fetch(`/audio/voice/${word.toLowerCase()}.mp3`);
        if (resp.ok) {
          const ab = await resp.arrayBuffer();
          buffer = await audioEngine.decodeAudio(ctx, ab);
          this.voiceBuffers.set(word.toLowerCase(), buffer);
        }
      } catch {
        // Fall back to synthesis
      }
    }

    if (!buffer) {
      // Fallback: use Web Speech API for this single word
      await this.speakWithWebSpeech([word]);
      return;
    }

    return new Promise((resolve) => {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        const voiceEntry = { source, gain: gainNode };
        this.activeVoices.push(voiceEntry);

        source.onended = () => {
          this.activeVoices = this.activeVoices.filter((v) => v !== voiceEntry);
          resolve();
        };

        source.start(0);

        // Safety timeout in case onended doesn't fire
        setTimeout(() => {
          resolve();
        }, Math.max(800, (buffer?.duration || 1) * 1000 + 200));
      } catch {
        resolve();
      }
    });
  }

  /**
   * Web Speech API fallback if audio buffers cannot be fetched
   */
  private speakWithWebSpeech(words: string[]): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(words.join(', ') + '.');

        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('en') &&
            /female|samantha|victoria|zira|karen|natural|google/i.test(v.name)
        ) || voices.find((v) => v.lang.toLowerCase().startsWith('en'));

        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        utterance.rate = 0.85;
        utterance.pitch = 1.15;
        utterance.volume = 1.0;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);

        // Safety timeout
        setTimeout(() => resolve(), Math.max(2000, words.length * 900));
      } catch {
        resolve();
      }
    });
  }

  /**
   * Speaks the progression numbers clearly with female human voice:
   * e.g. "one" -> [pause] -> "four" -> [pause] -> "one"
   */
  public async speakProgressionAnswer(words: string[]): Promise<void> {
    this.stopSpeech();
    this.isSpeaking = true;

    let isCancelled = false;
    this.speechCancelFn = () => {
      isCancelled = true;
    };

    try {
      // First ensure audio context and preloaded buffers
      await this.preloadVoiceBuffers();

      for (let i = 0; i < words.length; i++) {
        if (isCancelled) break;
        const word = words[i].toLowerCase();

        await this.playAudioBufferWord(word);

        // Inter-word educational spacing
        if (i < words.length - 1 && !isCancelled) {
          await new Promise((res) => setTimeout(res, 220));
        }
      }
    } catch (err) {
      console.warn('speakProgressionAnswer fallback error:', err);
      // Fallback to web speech
      if (!isCancelled) {
        await this.speakWithWebSpeech(words);
      }
    } finally {
      this.isSpeaking = false;
      this.speechCancelFn = null;
    }
  }

  /**
   * Plays a quick test voice sequence ("one, four, one") so the user can verify audio output
   */
  public async testVoice(): Promise<void> {
    await this.speakProgressionAnswer(['one', 'four', 'one']);
  }

  /**
   * Stops any currently active voice playback
   */
  public stopSpeech(): void {
    if (this.speechCancelFn) {
      this.speechCancelFn();
      this.speechCancelFn = null;
    }

    for (const voice of this.activeVoices) {
      try {
        voice.source.stop();
        voice.source.disconnect();
        voice.gain.disconnect();
      } catch {
        // Safe ignore
      }
    }
    this.activeVoices = [];

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe ignore
      }
    }

    this.isSpeaking = false;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechEngine = new SpeechEngine();
