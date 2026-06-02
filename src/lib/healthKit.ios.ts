// HealthKit adapter — iOS implementation.
//
// Wraps react-native-health behind a small Promise/subscribe-callback API so
// the pulse hook in `lib/pulse.ts` doesn't have to know about HealthKit's
// callback-based, sample-polling style.
//
// Real-time heart-rate via HKObserverQuery requires background entitlements
// and a more involved setup. For a foregrounded session this poll-based
// approach (every POLL_MS) is enough to drive the auto-soften decision —
// Apple Watch writes new samples every few seconds during active use.
//
// Privacy: nothing in this file reaches the network. Samples stay in memory
// and are consumed by the hook. See `wire-healthkit-pulse` spec.

import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthValue,
} from "react-native-health";

import {
  AuthorizationStatus,
  HeartRateSample,
  HeartRateUnsubscribe,
} from "./healthKit";

const READ_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.HeartRate],
    write: [],
  },
};

const POLL_MS = 2000;

let initialized = false;

function callbackToPromise<T>(
  fn: (cb: (err: string | null, result: T) => void) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(new Error(typeof err === "string" ? err : "HealthKit error"));
      else resolve(result);
    });
  });
}

async function ensureInit(): Promise<boolean> {
  if (initialized) return true;
  try {
    await new Promise<void>((resolve, reject) => {
      AppleHealthKit.initHealthKit(READ_PERMISSIONS, (err) => {
        if (err) reject(new Error(err));
        else resolve();
      });
    });
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

export async function isAvailable(): Promise<boolean> {
  try {
    const available = await callbackToPromise<boolean>((cb) =>
      AppleHealthKit.isAvailable((_err, result) => cb(null, result)),
    );
    if (!available) return false;
    return await ensureInit();
  } catch {
    return false;
  }
}

export async function requestAuthorization(): Promise<AuthorizationStatus> {
  const ok = await ensureInit();
  return ok ? "granted" : "denied";
}

export async function getAuthorizationStatus(): Promise<AuthorizationStatus> {
  return initialized ? "granted" : "undetermined";
}

export function subscribeHeartRate(
  callback: (sample: HeartRateSample) => void,
): HeartRateUnsubscribe {
  // Track the most recent sample's endDate so each poll only forwards new ones.
  let lastEndDateMs = Date.now() - 60_000; // start by looking 1 min back
  let cancelled = false;

  const tick = () => {
    if (cancelled) return;
    const options: HealthInputOptions = {
      startDate: new Date(lastEndDateMs).toISOString(),
      ascending: true,
      limit: 20,
    };
    AppleHealthKit.getHeartRateSamples(options, (err, samples: HealthValue[]) => {
      if (cancelled) return;
      if (!err && samples && samples.length > 0) {
        for (const s of samples) {
          const endMs = new Date(s.endDate).getTime();
          if (endMs <= lastEndDateMs) continue;
          lastEndDateMs = endMs;
          callback({ bpm: Math.round(s.value), timestamp: endMs });
        }
      }
    });
  };

  // First poll fires immediately so we don't wait POLL_MS for the first reading.
  tick();
  const id = setInterval(tick, POLL_MS);

  return () => {
    cancelled = true;
    clearInterval(id);
  };
}
