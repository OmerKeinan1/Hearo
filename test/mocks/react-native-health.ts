// Factory for a `react-native-health` (AppleHealthKit) mock.
//
// healthKit.ios.ts has module-level init state (`initialized` / `initPromise`),
// so its suite re-requires the module per-test via jest.resetModules(). The
// AppleHealthKit mock must be a STABLE object across those re-requires, so the
// test creates one instance up front and points jest.mock at it:
//
//   const mockAHK = require("../../../test/mocks/react-native-health")
//     .createAppleHealthKitMock();
//   jest.mock("react-native-health", () => ({ __esModule: true, default: mockAHK }));
//
// AppleHealthKit.Constants.Permissions.HeartRate is read at module load, so it
// must exist before healthKit.ios.ts is required.

export interface AppleHealthKitMock {
  Constants: { Permissions: { HeartRate: string } };
  isAvailable: jest.Mock;
  initHealthKit: jest.Mock;
  getHeartRateSamples: jest.Mock;
}

export function createAppleHealthKitMock(): AppleHealthKitMock {
  return {
    Constants: { Permissions: { HeartRate: "HeartRate" } },
    isAvailable: jest.fn(),
    initHealthKit: jest.fn(),
    getHeartRateSamples: jest.fn(),
  };
}
