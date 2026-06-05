// Component-test setup (Phase 2, ADR-001). Logic-layer suites in src/lib need
// none of this; it's wired only so RNTL can render the native UI components,
// which pull in reanimated, gesture-handler, and i18n.

// Gesture-handler's own jest shim — provides the native module stubs that
// GestureDetector/Gesture.Pan() touch on import.
require("react-native-gesture-handler/jestSetup");

// Reanimated ships a jest mock that turns worklets/animations into synchronous
// no-ops. Without it, useSharedValue/withTiming throw under jsdom.
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// AsyncStorage's native module is null under jest. The package ships an
// in-memory mock for tests — wire it up here so any test that touches storage
// (directly or transitively, e.g. via lib/trustedContacts → lib/storage)
// resolves without "NativeModule: AsyncStorage is null".
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Initialize i18n once so useTranslation() resolves real keys. Device locale is
// unavailable under jest-expo, so i18n falls back to "he"; pin to a known
// language for deterministic copy assertions.
import i18n from "@/lib/i18n";
import { useCrisisStore } from "@/lib/crisis-store";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

// Zustand stores are module singletons — reset shared safety state between tests
// so one test opening the crisis sheet can't leak into the next. Done in
// beforeEach (not afterEach) so it runs after RNTL has already unmounted the
// previous test's tree, avoiding an act() warning from re-rendering a live tree.
beforeEach(() => {
  useCrisisStore.setState({ isOpen: false });
});
