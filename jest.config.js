// Jest config lives here (not in package.json) so package.json stays a clean
// dependency manifest and config changes are easy to spot in diffs.
// See docs/adr/ADR-001 and docs/TEST_COVERAGE_PLAN.md for the coverage strategy.

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // Reanimated v4's mock pulls in react-native-worklets, whose `.native` build
  // throws under jsdom; this resolver strips the `.native` extension so the
  // jest-safe variant loads. Required for any component test that renders
  // reanimated/gesture-handler.
  resolver: "react-native-worklets/jest/resolver.js",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "\\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|m4a|mp4)$":
      "<rootDir>/test/assetMock.js",
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/lib/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}",
    "!src/lib/tokens.ts",
    "!src/lib/i18n.ts",
  ],
  coverageThreshold: {
    // src/lib ratcheted to its ADR-001 final target. Glob key = per-file gate.
    "./src/lib/**/*.{ts,tsx}": {
      lines: 95,
      branches: 90,
    },
    // src/components: directory key = aggregate (folder-wide) gate, so a single
    // file with an unreachable branch (e.g. SceneBackground) can't fail the bar.
    "./src/components/": {
      lines: 70,
      branches: 70,
    },
  },
};
