# Expo SDK 56

This project targets Expo SDK 56 (`expo ~56.0.8` in `package.json`; to match the Expo Go version available on team devices). Read the SDK 56 docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code that touches Expo APIs.

`package.json` is the source of truth for the SDK and all dependency versions. If this doc and `package.json` ever disagree, `package.json` wins — reconcile this doc to it.

## Dev build required

The audio engine uses `react-native-audio-api` (Software Mansion), a native module. **Expo Go will not work** for any session-related development. Use `npx expo run:ios` or `npx expo run:android` (or an EAS dev build) for all testing that involves the session screen or audio playback.
