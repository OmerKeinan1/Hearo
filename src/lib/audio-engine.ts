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

// Linear gain for practical silence (≈ −60 dB, inaudible).
// exponentialRampToValueAtTime cannot start from exactly 0.
const SILENCE_GAIN = 0.001;

export function dBToGain(dB: number): number {
  return Math.pow(10, dB / 20);
}

// Build a perceptually even (linear-dB) ramp from fromGain to toGain.
// Returned Float32Array can be passed to setValueCurveAtTime.
function buildLogCurve(fromGain: number, toGain: number, steps: number): Float32Array {
  const fromDB = 20 * Math.log10(Math.max(fromGain, SILENCE_GAIN));
  const toDB = 20 * Math.log10(Math.max(toGain, SILENCE_GAIN));
  const arr = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const db = fromDB + ((toDB - fromDB) * i) / (steps - 1);
    arr[i] = Math.pow(10, db / 20);
  }
  return arr;
}

// Cancel any scheduled gain automation and freeze at the current instantaneous
// value. cancelScheduledValues alone does NOT stop a mid-flight curve; we need
// cancelAndHoldAtTime (or the setValueAtTime workaround if unavailable).
function freezeGain(gain: GainNode['gain'], ctx: AudioContext): void {
  const now = ctx.currentTime;
  const current = gain.value;
  gain.cancelScheduledValues(now);
  // cancelAndHoldAtTime freezes a mid-flight curve at its current value.
  // Fall back to setValueAtTime if the method is absent (partial implementations).
  if (typeof (gain as any).cancelAndHoldAtTime === 'function') {
    (gain as any).cancelAndHoldAtTime(now);
  } else {
    gain.setValueAtTime(current, now);
  }
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

  // Active looping source nodes.
  private ambientSource: AudioBufferSourceNode | null = null;
  private triggerSource: AudioBufferSourceNode | null = null;

  // Ramp tracking.
  private _ceilingGain = 0;
  private _rampDuration = 0;
  private _rampStartTime = 0;
  private _preSpikeGain = SILENCE_GAIN;
  private _isSpiked = false;
  private _graceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.ambientGain = this.ctx.createGain();
    this.triggerGain = this.ctx.createGain();
    this.voiceGain = this.ctx.createGain();

    this.ambientGain.gain.value = 1.0;
    this.triggerGain.gain.value = SILENCE_GAIN;
    this.voiceGain.gain.value = 1.0;

    this.ambientGain.connect(this.ctx.destination);
    this.triggerGain.connect(this.ctx.destination);
    this.voiceGain.connect(this.ctx.destination);
  }

  // ── Buffer loading ──────────────────────────────────────────────────────

  // Two-phase loading: ambient + voice clips are needed for DISCLAIMER;
  // the trigger buffer is only needed at ADAPTIVE_LOOP entry.
  // Separating them avoids passing an empty placeholder as triggerSource.

  async loadAmbientAndVoice(
    ambientSource: number | string,
    voiceClipSources: (number | string)[]
  ): Promise<void> {
    const [ambientBuf, ...voiceBufs] = await Promise.all([
      this.ctx.decodeAudioData(ambientSource),
      ...voiceClipSources.map((s) => this.ctx.decodeAudioData(s)),
    ]);
    this.ambientBuffer = ambientBuf;
    this.voiceBuffers = voiceBufs;
  }

  async loadTrigger(triggerSource: number | string): Promise<void> {
    this.triggerBuffer = await this.ctx.decodeAudioData(triggerSource);
  }

  // ── Ambient ─────────────────────────────────────────────────────────────

  startAmbient(): void {
    if (!this.ambientBuffer) throw new Error('ambient buffer not loaded');
    if (this.ambientSource) return;

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

  startTriggerRamp(opts: TriggerRampOptions): void {
    if (!this.triggerBuffer) throw new Error('trigger buffer not loaded');

    this._ceilingGain = opts.ceilingGain;
    this._rampDuration = opts.durationSeconds;
    this._rampStartTime = this.ctx.currentTime;
    this._isSpiked = false;

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

  // Schedule a perceptual gain ramp. The curve is offset by a tiny amount to
  // avoid colliding with any preceding setValueAtTime at `now`.
  private _scheduleRamp(
    fromGain: number,
    toGain: number,
    durationSeconds: number
  ): void {
    const now = this.ctx.currentTime;
    // Freeze any in-flight curve before scheduling new one.
    freezeGain(this.triggerGain.gain, this.ctx);
    const curve = buildLogCurve(fromGain, toGain, 200);
    // Small offset avoids same-timestamp conflict between freeze and curve.
    this.triggerGain.gain.setValueCurveAtTime(curve, now + 0.001, durationSeconds);
  }

  // ── Spike / normalize ────────────────────────────────────────────────────

  onSpike(): void {
    // Guard: only active once trigger is running and not already spiked.
    if (!this.triggerSource || this._isSpiked) return;
    this._isSpiked = true;

    this._preSpikeGain = this.triggerGain.gain.value;

    const now = this.ctx.currentTime;
    freezeGain(this.triggerGain.gain, this.ctx);
    this.triggerGain.gain.linearRampToValueAtTime(SILENCE_GAIN, now + 2.5);

    if (this._graceTimer) clearTimeout(this._graceTimer);
  }

  onNormalized(): void {
    if (!this._isSpiked) return;

    if (this._graceTimer) clearTimeout(this._graceTimer);

    this._graceTimer = setTimeout(() => {
      // Guard against callback firing after destroy().
      if (this.ctx.state === 'closed') return;

      this._isSpiked = false;
      this._graceTimer = null;

      const remaining = Math.max(
        this._rampDuration - (this.ctx.currentTime - this._rampStartTime),
        10
      );

      // Update tracking so subsequent spikes compute remaining time correctly.
      this._rampStartTime = this.ctx.currentTime;
      this._rampDuration = remaining;

      this._scheduleRamp(this._preSpikeGain, this._ceilingGain, remaining);
    }, 30_000);
  }

  // ── Voice overlay ────────────────────────────────────────────────────────

  playVoiceClip(index: number): Promise<void> {
    const buffer = this.voiceBuffers[index];
    if (!buffer) return Promise.resolve();

    const now = this.ctx.currentTime;

    // If a spike is active, the trigger is already at silence — skip
    // the save/restore cycle entirely to avoid competing schedules.
    const shouldRestoreTrigger = !this._isSpiked;
    const savedTriggerGain = shouldRestoreTrigger
      ? this.triggerGain.gain.value
      : SILENCE_GAIN;

    // Duck trigger immediately.
    freezeGain(this.triggerGain.gain, this.ctx);
    this.triggerGain.gain.setValueAtTime(0, now);

    return new Promise<void>((resolve) => {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.voiceGain);

      let resolved = false;

      const finish = () => {
        if (resolved) return;
        resolved = true;

        if (shouldRestoreTrigger) {
          const t = this.ctx.currentTime;
          freezeGain(this.triggerGain.gain, this.ctx);
          this.triggerGain.gain.setValueAtTime(0, t);
          this.triggerGain.gain.linearRampToValueAtTime(savedTriggerGain, t + 1.0);
        }
        resolve();
      };

      // onended fires when the source finishes (non-looping).
      src.onEnded = finish;
      // Safety net in case the library does not implement onended reliably.
      setTimeout(finish, buffer.duration * 1000 + 300);

      src.start(0);
    });
  }

  // ── Ceiling control (intensity slider) ───────────────────────────────────

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

  fadeOutAll(durationSeconds = 3): void {
    const now = this.ctx.currentTime;
    const end = now + durationSeconds;

    freezeGain(this.ambientGain.gain, this.ctx);
    this.ambientGain.gain.linearRampToValueAtTime(0, end);

    freezeGain(this.triggerGain.gain, this.ctx);
    this.triggerGain.gain.linearRampToValueAtTime(0, end);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  destroy(): void {
    if (this._graceTimer) {
      clearTimeout(this._graceTimer);
      this._graceTimer = null;
    }
    try {
      this.ambientSource?.stop();
      this.triggerSource?.stop();
    } catch {
      // Already stopped — ignore.
    }
    this.ctx.close();
  }
}
