# crisis-access

## Purpose

A user in distress must be able to reach a human within one tap from anywhere in the app. The primary route is ERAN 1201 — Israel's free, 24/7, anonymous emotional first-aid hotline. The capability is a safety floor, not a feature: every other screen, animation, or pitch consideration must yield to this one working reliably. The UI for crisis access is deliberately quiet rather than alarming, because alarming UI in a crisis moment is itself activating for a traumatized user.

## Requirements

### Requirement: Crisis affordance on every screen
Every screen in the app MUST surface a crisis affordance — a small `i` glyph in the top-left of the screen. The affordance MUST use the letter `i`. It MUST NOT use `!`, `?`, `SOS`, red icons, or any alarm imagery.

#### Scenario: Welcome screen
- GIVEN the user is on the Welcome screen, before sign-in
- WHEN the user observes the top-left of the screen
- THEN a small `i` glyph is visible
- AND tapping it opens the crisis sheet

#### Scenario: Session screen
- GIVEN the user is mid-session with a trigger sound playing
- WHEN the user observes the top-left of the screen
- THEN the same `i` glyph is visible in the same position

### Requirement: Crisis sheet opens fast and offline
Tapping the crisis affordance MUST open the crisis sheet within 200ms. The sheet MUST NOT depend on any network resource and MUST work fully offline.

#### Scenario: Tap with no network
- GIVEN the device has no network connection
- WHEN the user taps the `i` glyph
- THEN the crisis sheet opens within 200ms
- AND the `call ERAN` action is present and tappable

### Requirement: Non-alarming headline
The crisis sheet headline MUST NOT contain the words `crisis`, `panic`, `emergency`, or `help` (or their Hebrew equivalents). The headline MUST be phrased as a quiet question.

#### Scenario: Headline content
- GIVEN the crisis sheet is open in English
- WHEN the headline is observed
- THEN it reads `Need someone to talk to right now?`
- AND it does not contain the words crisis, panic, emergency, or help

### Requirement: Call ERAN via tel URI
The primary action on the crisis sheet MUST be a phone call to ERAN 1201, invoked via the `tel:1201` URI so iOS handles the call directly. The app MUST NOT place the call itself.

#### Scenario: Primary action tapped
- GIVEN the crisis sheet is open
- WHEN the user taps the `call ERAN` action
- THEN iOS opens the phone dialer with 1201 prefilled
- AND the user can confirm the call from iOS

### Requirement: Secondary trusted-contact action
The crisis sheet MUST contain a secondary action labeled `a person you trust` (or its Hebrew equivalent) that opens the user's nominated trusted-contact list. If no contacts are configured, the action MAY route to a stub that explains where to set them up.

#### Scenario: Trusted contacts configured
- GIVEN the user has added one or more trusted contacts
- WHEN the user taps `a person you trust`
- THEN the trusted contacts list opens
- AND tapping a contact starts a call to that contact

#### Scenario: No trusted contacts configured
- GIVEN the user has not configured any trusted contacts
- WHEN the user taps `a person you trust`
- THEN a brief stub explains how to add them later

### Requirement: Session pauses, does not end
If the crisis sheet opens during an active session, the session MUST pause (audio fade-to-silence, animations frozen) rather than end. Dismissing the sheet MUST resume the session from where it paused.

#### Scenario: Pause and resume
- GIVEN the user is mid-session with audio playing
- WHEN the user taps the `i` glyph and the crisis sheet opens
- THEN the audio fades to silence over 200ms
- AND the breathing circle freezes
- AND when the user dismisses the sheet without calling, the audio resumes and the breathing circle resumes from where it paused

### Requirement: No backend telemetry on crisis taps
The backend MUST never be informed when the crisis sheet is opened or when the user taps `call ERAN`. No request MAY be sent to any server as a result of these actions.

#### Scenario: Backend audit
- GIVEN the user taps the `i` glyph and then taps `call ERAN`
- WHEN the backend logs and request history are inspected
- THEN no record of the crisis tap or the call exists for this user

### Requirement: Dismissible without action
The crisis sheet MUST be dismissable without the user being forced to choose any action. A `close` text link MUST be present at the bottom of the sheet.

#### Scenario: User dismisses
- GIVEN the crisis sheet is open
- WHEN the user taps `close`
- THEN the sheet slides down and disappears
- AND the user returns to the screen they were on
