// Stable AppleHealthKit mock object (survives the per-test jest.resetModules()).
const mockAHK = require("../../../test/mocks/react-native-health").createAppleHealthKitMock();
jest.mock("react-native-health", () => ({ __esModule: true, default: mockAHK }));

// Control the sticky-granted storage flag directly (no AsyncStorage needed).
const mockGetGranted = jest.fn();
const mockSetGranted = jest.fn();
jest.mock("@/lib/storage", () => ({
  getHealthKitGranted: mockGetGranted,
  setHealthKitGranted: mockSetGranted,
}));

type HealthKitIos = typeof import("@/lib/healthKit.ios");
let hk: HealthKitIos;

beforeEach(() => {
  // Fresh module each test → resets `initialized` / `initPromise`.
  jest.resetModules();
  mockAHK.isAvailable.mockReset();
  mockAHK.initHealthKit.mockReset();
  mockAHK.getHeartRateSamples.mockReset();
  mockGetGranted.mockReset().mockResolvedValue(false);
  mockSetGranted.mockReset().mockResolvedValue(undefined);
  // Importing by the explicit `.ios` filename keeps resolution deterministic.
  hk = require("@/lib/healthKit.ios") as HealthKitIos;
});

describe("healthKit.ios / isAvailable", () => {
  it("returns false when HealthKit reports unavailable", async () => {
    mockAHK.isAvailable.mockImplementation((cb: any) => cb(null, false));
    expect(await hk.isAvailable()).toBe(false);
    expect(mockAHK.initHealthKit).not.toHaveBeenCalled();
  });

  it("initializes and returns true when available", async () => {
    mockAHK.isAvailable.mockImplementation((cb: any) => cb(null, true));
    mockAHK.initHealthKit.mockImplementation((_perms: any, cb: any) => cb(null));

    expect(await hk.isAvailable()).toBe(true);
    expect(mockSetGranted).toHaveBeenCalledWith(true);
  });

  it("returns false when init fails even though HealthKit is available", async () => {
    mockAHK.isAvailable.mockImplementation((cb: any) => cb(null, true));
    mockAHK.initHealthKit.mockImplementation((_perms: any, cb: any) => cb("init denied"));

    expect(await hk.isAvailable()).toBe(false);
  });

  it("swallows a thrown native error and returns false", async () => {
    mockAHK.isAvailable.mockImplementation(() => {
      throw new Error("native boom");
    });
    expect(await hk.isAvailable()).toBe(false);
  });
});

describe("healthKit.ios / requestAuthorization", () => {
  it("returns granted when init succeeds", async () => {
    mockAHK.initHealthKit.mockImplementation((_perms: any, cb: any) => cb(null));
    expect(await hk.requestAuthorization()).toBe("granted");
  });

  it("returns denied when init fails", async () => {
    mockAHK.initHealthKit.mockImplementation((_perms: any, cb: any) => cb("nope"));
    expect(await hk.requestAuthorization()).toBe("denied");
  });

  it("deduplicates concurrent init attempts", async () => {
    let initCb: ((err: string | null) => void) | undefined;
    mockAHK.initHealthKit.mockImplementation((_perms: any, cb: any) => {
      initCb = cb;
    });

    const p1 = hk.requestAuthorization();
    const p2 = hk.requestAuthorization();
    expect(mockAHK.initHealthKit).toHaveBeenCalledTimes(1); // shared in-flight promise

    initCb!(null); // resolve both callers
    expect(await p1).toBe("granted");
    expect(await p2).toBe("granted");
  });
});

describe("healthKit.ios / getAuthorizationStatus", () => {
  it("returns granted once initialized in-session", async () => {
    mockAHK.initHealthKit.mockImplementation((_perms: any, cb: any) => cb(null));
    await hk.requestAuthorization(); // sets initialized = true

    expect(await hk.getAuthorizationStatus()).toBe("granted");
  });

  it("returns granted from the sticky flag on a cold start", async () => {
    mockGetGranted.mockResolvedValue(true);
    expect(await hk.getAuthorizationStatus()).toBe("granted");
  });

  it("returns undetermined when never granted", async () => {
    mockGetGranted.mockResolvedValue(false);
    expect(await hk.getAuthorizationStatus()).toBe("undetermined");
  });
});

describe("healthKit.ios / subscribeHeartRate", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-08T12:00:00Z").getTime());
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("forwards new samples with rounded bpm on the first poll", () => {
    const now = Date.now();
    const onSample = jest.fn();
    mockAHK.getHeartRateSamples.mockImplementation((_opts: any, cb: any) =>
      cb(null, [{ value: 90.4, endDate: new Date(now - 30_000).toISOString() }]),
    );

    const unsubscribe = hk.subscribeHeartRate(onSample);
    expect(onSample).toHaveBeenCalledWith({ bpm: 90, timestamp: expect.any(Number) });
    unsubscribe();
  });

  it("does not re-forward an already-seen sample", () => {
    const now = Date.now();
    const onSample = jest.fn();
    const sample = { value: 88, endDate: new Date(now - 10_000).toISOString() };
    mockAHK.getHeartRateSamples.mockImplementation((_opts: any, cb: any) => cb(null, [sample]));

    const unsubscribe = hk.subscribeHeartRate(onSample);
    expect(onSample).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2000); // next poll, identical sample → skipped
    expect(onSample).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("ignores errored poll results", () => {
    const onSample = jest.fn();
    mockAHK.getHeartRateSamples.mockImplementation((_opts: any, cb: any) => cb("read error", null));

    const unsubscribe = hk.subscribeHeartRate(onSample);
    expect(onSample).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("stops polling after unsubscribe", () => {
    const now = Date.now();
    const onSample = jest.fn();
    mockAHK.getHeartRateSamples.mockImplementation((_opts: any, cb: any) =>
      cb(null, [{ value: 80, endDate: new Date(now - 5_000).toISOString() }]),
    );

    const unsubscribe = hk.subscribeHeartRate(onSample);
    onSample.mockClear();
    unsubscribe();

    jest.advanceTimersByTime(10_000);
    expect(onSample).not.toHaveBeenCalled();
  });

  it("drops a poll result that arrives after unsubscribe", () => {
    let pollCb: ((err: unknown, samples: unknown) => void) | undefined;
    mockAHK.getHeartRateSamples.mockImplementation((_opts: any, cb: any) => {
      pollCb = cb; // capture without responding yet
    });
    const onSample = jest.fn();

    const unsubscribe = hk.subscribeHeartRate(onSample);
    unsubscribe(); // cancelled = true before the poll responds
    pollCb!(null, [{ value: 80, endDate: new Date(Date.now()).toISOString() }]);

    expect(onSample).not.toHaveBeenCalled();
  });
});
