// Jest stub for static asset imports (images, audio, video).
//
// RN's asset registry returns an opaque number at runtime; tests only need a
// stable, requireable value. content.ts types audio modules as `number`, so a
// number keeps the shape honest. Asset *identity* is never asserted in unit
// tests — audio.test mocks content.ts directly to test variation selection.
module.exports = 1;
