import { useEffect, useState } from "react";

export type PulsePhase = "baseline" | "rising" | "peak" | "settling";

type Options = {
  active: boolean;
  phase: PulsePhase;
};

const TARGETS: Record<PulsePhase, number> = {
  baseline: 74,
  rising: 96,
  peak: 112,
  settling: 82,
};

const STEP = 1.4;
const JITTER = 1.6;
const TICK_MS = 220;

export function usePulse({ active, phase }: Options) {
  const [value, setValue] = useState<number>(TARGETS.baseline);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setValue((current) => {
        const target = TARGETS[phase];
        const delta = target - current;
        const direction = Math.sign(delta);
        const moved = Math.abs(delta) < STEP ? delta : direction * STEP;
        const next = current + moved + (Math.random() - 0.5) * JITTER;
        return Math.max(58, Math.min(130, next));
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [active, phase]);

  return Math.round(value);
}
