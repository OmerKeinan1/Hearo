import { useEffect, useRef, useCallback } from 'react';
import { AudioEngine, TriggerRampOptions } from '@/lib/audio-engine';

export interface UseAudioEngineResult {
  startAmbient: () => void;
  startTriggerRamp: (opts: TriggerRampOptions) => void;
  onSpike: () => void;
  onNormalized: () => void;
  playVoiceClip: (index: number) => Promise<void>;
  setTriggerCeiling: (gain: number) => void;
  pauseAll: () => Promise<void>;
  resumeAll: () => Promise<void>;
  fadeOutAll: (durationSeconds?: number) => void;
  loadBuffers: (
    ambientSource: number | string,
    triggerSource: number | string,
    voiceClipSources: (number | string)[]
  ) => Promise<void>;
  currentTriggerGain: () => number;
}

/** React hook that owns an AudioEngine instance for the lifetime of the
 *  session screen. The engine is created on mount and destroyed on unmount. */
export function useAudioEngine(): UseAudioEngineResult {
  const engineRef = useRef<AudioEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new AudioEngine();
  }

  useEffect(() => {
    const engine = engineRef.current!;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const loadBuffers = useCallback(
    (
      ambientSource: number | string,
      triggerSource: number | string,
      voiceClipSources: (number | string)[]
    ) => engineRef.current!.loadBuffers(ambientSource, triggerSource, voiceClipSources),
    []
  );

  const startAmbient = useCallback(
    () => engineRef.current!.startAmbient(),
    []
  );

  const startTriggerRamp = useCallback(
    (opts: TriggerRampOptions) => engineRef.current!.startTriggerRamp(opts),
    []
  );

  const onSpike = useCallback(() => engineRef.current!.onSpike(), []);

  const onNormalized = useCallback(
    () => engineRef.current!.onNormalized(),
    []
  );

  const playVoiceClip = useCallback(
    (index: number) => engineRef.current!.playVoiceClip(index),
    []
  );

  const setTriggerCeiling = useCallback(
    (gain: number) => engineRef.current!.setTriggerCeiling(gain),
    []
  );

  const pauseAll = useCallback(
    () => engineRef.current!.pauseAll(),
    []
  );

  const resumeAll = useCallback(
    () => engineRef.current!.resumeAll(),
    []
  );

  const fadeOutAll = useCallback(
    (durationSeconds?: number) => engineRef.current!.fadeOutAll(durationSeconds),
    []
  );

  const currentTriggerGain = useCallback(
    () => engineRef.current?.currentTriggerGain ?? 0,
    []
  );

  return {
    loadBuffers,
    startAmbient,
    startTriggerRamp,
    onSpike,
    onNormalized,
    playVoiceClip,
    setTriggerCeiling,
    pauseAll,
    resumeAll,
    fadeOutAll,
    currentTriggerGain,
  };
}
