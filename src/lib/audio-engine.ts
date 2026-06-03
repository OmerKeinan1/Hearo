// Three-layer Web Audio graph for HearO exposure sessions.
//
// Layer 1  Ambient  — looping soundscape, gain locked at 1.0
// Layer 2  Trigger  — looping trigger sound, gain ramps from 0 toward dB
//                     ceiling logarithmically; HR events control the ramp
// Layer 3  Voice    — one-shot voice clips; ducks TriggerGain while playing
//
// Usage lifecycle:
//   1. new AudioEngine()
//   2. await engine.loadBuffers(ambientSource, triggerSource, voiceClipSources)
//   3. engine.startAmbient()          — call at AMBIENT_FADE_IN entry
//   4. engine.startTriggerRamp(opts)  — call at ADAPTIVE_LOOP entry
//   5. engine.onSpike() / onNormalized()  — driven by usePulseMonitor
//   6. engine.playVoiceClip(index)    — DISCLAIMER / MID_SESSION / WIND_DOWN
//   7. engine.destroy()               — on unmount or session end

import {
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
  GainNode,
} from 'react-native-audio-api';

// dB → linear gain conversion.
// exponentialRampToValueAtTime cannot start from 0, so we treat
// SILENCE_GAIN as the practical floor (≈ −60 dB, inaudible).
const SILENCE_GAIN = 0.001;

function dBToGain(dB: number): number {
  return Math.pow(10, dB / 20);
}

// Build a Float32Array of N values that follow a perceptually even (linear-dB)
// ramp from SILENCE_GAIN to ceilingGain.
function buildLogCurve(ceilingGain: number, steps: number): Float32Array {
  const ceilingDB = 20 * Math.log10(ceilingGain);
  const silenceDB = 20 * Math.log10(SILENCE_GAIN);
  const arr = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const db = silenceDB + ((ceilingDB - silenceDB) * i) / (steps - 1);
    arr[i] = dBToGain(db);
  }
  return arr;
}

export interface TriggerRampOptions {
  /** Total ramp duration in seconds (= ADAPTIVE_LOOP expected duration). */
  durationSeconds: number;
  /** Linear gain ceiling (use dBToGain from your content definitions). */
  ceilingGain: number;
}

export type { AudioBuffer };

export class AudioEngine {
  private ctx: AudioContext;

  // Gain nodes — created once, persist for session lifetime.
  private ambientGain: GainNode;
  private triggerGain: GainNode;
  private voiceGain: GainNode;

  // Decoded buffers — loaded before session starts.
  private ambientBuffer: AudioBuffer | null = null;
  private triggerBuffer: AudioBuffer | null = null;
  private voiceBuffers: AudioBuffer[] = [];

  // Active source nodes.
  private ambientSource: AudioBufferSourceNode | null = null;
  private triggerSource: AudioBufferSourceNode | null = null;

  // Ramp tracking — needed to resume at pre-spike level.
  private _ceilingGain = 0;
  private _rampDuration = 0;
  private _rampStartTime = 0;       // ctx.currentTime when ramp began
  private _rampStartGain = SILENCE_GAIN;
  private _preSpikeGain = SILENCE_GAIN;
  private _isSpiked = false;
  private _graceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.ambientGain = this.ctx.createGain();
    this.triggerGain = this.ctx.createGain();
    this.voiceGain = this.ctx.createGain();

    // Ambient is always at unity.
    this.ambientGain.gain.value = 1.0;
    // Trigger starts silent.
    this.triggerGain.gain.value = SILENCE_GAIN;
    // Voice at unity.
    this.voiceGain.gain.value = 1.0;

    this.ambientGain.connect(this.ctx.destination);
    this.triggerGain.connect(this.ctx.destination);
    this.voiceGain.connect(this.ctx.destination);
  }

  // ── Buffer loading ──────────────────────────────────────────────────────

  /** Load all audio buffers. Must be awaited before starting playback. */
  async loadBuffers(
    ambientSource: number | string,
    triggerSource: number | string,
    voiceClipSources: (number | string)[]
  ): Promise<void> {
    const [ambientBuf, triggerBuf, ...voiceBufs] = await Promise.all([
      this.ctx.decodeAudioData(ambientSource),
      this.ctx.decodeAudioData(triggerSource),
      ...voiceClipSources.map((s) => this.ctx.decodeAudioData(s)),
    ]);
    this.ambientBuffer = ambientBuf;
    this.triggerBuffer = triggerBuf;
    this.voiceBuffers = voiceBufs;
  }

  // ── Ambient ─────────────────────────────────────────────────────────────

  /** Start ambient loop. Call at AMBIENT_FADE_IN entry. */
  startAmbient(): void {
    if (!this.ambientBuffer) throw new Error('ambient buffer not loaded');
    if (this.ambientSource) return; // already running

    const src = this.ctx.createBufferSource();
    src.buffer = this.ambientBuffer;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = this.ambientBuffer.duration;
    src.connect(this.ambientGain);
    src.start(0);
    this.ambientSource = src;
  }

  // ── Trigger ramp ─────────────────────────────────────────────────────────

  /** Start the trigger loop and begin the logarithmic gain ramp.
   *  Call at ADAPTIVE_LOOP entry. */
  startTriggerRamp(opts: TriggerRampOptions): void {
    if (!this.triggerBuffer) throw new Error('trigger buffer not loaded');

    this._ceilingGain = opts.ceilingGain;
    this._rampDuration = opts.durationSeconds;
    this._rampStartTime = this.ctx.currentTime;
    this._rampStartGain = SILENCE_GAIN;
    this._isSpiked = false;

    // Start the looping trigger source at silence.
    const src = this.ctx.createBufferSource();
    src.buffer = this.triggerBuffer;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = this.triggerBuffer.duration;
    src.connect(this.triggerGain);
    src.start(0);
    this.triggerSource = src;

    this._scheduleRamp(SILENCE_GAIN, opts.ceilingGain, opts.durationSeconds);
  }

  /** Schedule a logarithmic gain ramp on TriggerGainNode using setValueCurveAtTime. */
  private _scheduleRamp(
    fromGain: number,
    toGain: number,
    durationSeconds: number
  ): void {
    const now = this.ctx.currentTime;
    // 200-point curve gives a smooth, 5s-granularity perceptual ramp.
    const curve = buildLogCurve(toGain, 200);
    // Override first value to start from current gain (seamless on resume).
    curve[0] = fromGain;
    this.triggerGain.gain.cancelScheduledValues(now);
    this.triggerGain.gain.setValueAtTime(fromGain, now);
    this.triggerGain.gain.setValueCurveAtTime(curve, now, durationSeconds);
  }

  // ── Spike / normalize ────────────────────────────────────────────────────

  /** Called by usePulseMonitor when a spike is detected. */
  onSpike(): void {
    if (this._isSpiked) return;
    this._isSpiked = true;

    // Snapshot gain before fading (approximate, since gain is scheduled).
    this._preSpikeGain = this.triggerGain.gain.value;

    const now = this.ctx.currentTime;
    this.triggerGain.gain.cancelScheduledValues(now);
    this.triggerGain.gain.setValueAtTime(this._preSpikeGain, now);
    this.triggerGain.gain.linearRampToValueAtTime(SILENCE_GAIN, now + 2.5);

    if (this._graceTimer) clearTimeout(this._graceTimer);
  }

  /** Called by usePulseMonitor when HR returns to ≤90% of baseline. */
  onNormalized(): void {
    if (!this._isSpiked) return;

    if (this._graceTimer) clearTimeout(this._graceTimer);

    // 30-second grace period before trigger returns.
    this._graceTimer = setTimeout(() => {
      this._isSpiked = false;
      this._graceTimer = null;

      // Resume ramp from pre-spike gain toward ceiling.
      // Remaining ramp time = time not yet consumed before the spike.
      const elapsed = this.ctx.currentTime - this._rampStartTime;
      const remaining = Math.max(this._rampDuration - elapsed, 10);

      this._scheduleRamp(this._preSpikeGain, this._ceilingGain, remaining);
    }, 30_000);
  }

  // ── Voice overlay ────────────────────────────────────────────────────────

  /** Play a pre-loaded voice clip by index, ducking trigger gain while it plays.
   *  Returns a promise that resolves when the clip finishes. */
  playVoiceClip(index: number): Promise<void> {
    const buffer = this.voiceBuffers[index];
    if (!buffer) return Promise.resolve();

    const savedTriggerGain = this.triggerGain.gain.value;
    const now = this.ctx.currentTime;

    // Duck trigger immediately.
    this.triggerGain.gain.cancelScheduledValues(now);
    this.triggerGain.gain.setValueAtTime(0, now);

    return new Promise<void>((resolve) => {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.voiceGain);

      src.onended = () => {
        // Restore trigger gain over 1 second.
        const t = this.ctx.currentTime;
        this.triggerGain.gain.setValueAtTime(0, t);
        this.triggerGain.gain.linearRampToValueAtTime(
          savedTriggerGain,
          t + 1.0
        );
        resolve();
      };

      src.start(0);
    });
  }

  // ── Ceiling control (intensity slider) ───────────────────────────────────

  /** Update the trigger ceiling from the intensity slider.
   *  Does not interrupt a spike fade — effective on next normalized ramp. */
  setTriggerCeiling(gain: number): void {
    this._ceilingGain = Math.max(SILENCE_GAIN, gain);
  }

  get currentTriggerGain(): number {
    return this.triggerGain.gain.value;
  }

  // ── Pause / resume (crisis sheet) ───────────────────────────────────────

  async pauseAll(): Promise<void> {
    await this.ctx.suspend();
  }

  async resumeAll(): Promise<void> {
    await this.ctx.resume();
  }

  // ── Wind-down ────────────────────────────────────────────────────────────

  /** Fade all layers to silence over `durationSeconds`. */
  fadeOutAll(durationSeconds = 3): void {
    const now = this.ctx.currentTime;
    const end = now + durationSeconds;

    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain.gain.linearRampToValueAtTime(0, end);

    this.triggerGain.gain.cancelScheduledValues(now);
    this.triggerGain.gain.setValueAtTime(this.triggerGain.gain.value, now);
    this.triggerGain.gain.linearRampToValueAtTime(0, end);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  destroy(): void {
    if (this._graceTimer) clearTimeout(this._graceTimer);
    try {
      this.ambientSource?.stop();
      this.triggerSource?.stop();
    } catch {
      // Already stopped — ignore.
    }
    this.ctx.close();
  }
}

export { dBToGain };
