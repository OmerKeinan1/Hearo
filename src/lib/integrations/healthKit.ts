// HealthKit adapter — the seam between Apple Watch heart rate and our pulse
// hook. Real implementation lives in `healthKit.ios.ts`; Metro resolves
// platform extensions automatically.
//
// On web and Android we return "not available" so the pulse router falls
// through to the mock generator. No web/Android implementation today; if
// Android HealthConnect lands later, it lives in `healthKit.android.ts`.

export type AuthorizationStatus = "granted" | "denied" | "undetermined";

export type HeartRateSample = {
  bpm: number;
  timestamp: number;
};

export type HeartRateUnsubscribe = () => void;

export async function isAvailable(): Promise<boolean> {
  return false;
}

export async function requestAuthorization(): Promise<AuthorizationStatus> {
  return "denied";
}

export async function getAuthorizationStatus(): Promise<AuthorizationStatus> {
  // Web / Android have no HealthKit at all. Always undetermined — the iOS
  // adapter persists a sticky-granted flag and reads from storage to survive
  // cold start (see healthKit.ios.ts).
  return "undetermined";
}

export function subscribeHeartRate(
  _callback: (sample: HeartRateSample) => void,
): HeartRateUnsubscribe {
  return () => {};
}
