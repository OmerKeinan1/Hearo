# intensity-control

## Purpose

The user must always be able to make the trigger sound softer — without the app being able to override them in the other direction. Two control layers run in parallel: a manual slider the user drags during a session, and an automatic pulse-driven attenuation that reacts to the user's body. Both layers can only make the trigger softer, never louder. They cooperate by treating the manual slider as a ceiling the automatic layer cannot exceed.

This is a safety capability as much as a UX one. The whole exposure model rests on the user trusting that they remain in control.
## Requirements
### Requirement: Slider is always visible and reachable
The manual intensity slider MUST be visible and reachable on the session screen during all three phases. The slider MUST support drag gestures with smooth continuous motion (not stepped).

#### Scenario: Slider present during opening
- GIVEN the session is in the opening phase
- WHEN the session screen is observed
- THEN the slider is visible with its current ceiling position rendered

#### Scenario: Slider responds to drag
- GIVEN the slider is at the midpoint
- WHEN the user drags the slider thumb left
- THEN the thumb moves continuously with the gesture
- AND the trigger sound output (if playing) follows the position in real time

### Requirement: Slider controls trigger volume only
The manual slider MUST affect only the trigger sound volume via `TriggerGainNode`. `AmbientGainNode` and `VoiceGainNode` MUST be unaffected by slider movement.

#### Scenario: Drag does not affect ambient
- **WHEN** the user drags the slider to the softest position during `ADAPTIVE_LOOP`
- **THEN** the ambient soundscape continues at gain 1.0
- **AND** only `TriggerGainNode.gain` ceiling is updated

### Requirement: Slider is a ceiling, not a fixed level
The slider position MUST represent the maximum gain value the engine is allowed to apply to `TriggerGainNode`. The engine's automatic HR-spike response MAY lower `TriggerGainNode.gain` below the ceiling but MUST NEVER set it above the slider's position.

#### Scenario: HR spike response respects ceiling
- **WHEN** the slider is at 0.6 and `PulseSpiked` is emitted
- **THEN** `TriggerGainNode.gain` fades toward 0 (below the 0.6 ceiling)
- **AND** the slider thumb stays at 0.6
- **AND** a ghost indicator shows the actual gain position on the track

#### Scenario: Recovery ramp respects ceiling
- **WHEN** `PulseNormalized` is emitted after a spike with slider at 0.6
- **THEN** `TriggerGainNode.gain` ramps back toward 0.6 (the pre-spike level, which is ≤ the slider ceiling)
- **AND** gain never exceeds 0.6

### Requirement: No numeric labels on the slider
The slider MUST NOT display numeric labels, percentages, or step indicators. Only the textual endpoints `Softer` and `Louder` MAY be shown.

#### Scenario: Slider visual inspection
- GIVEN the session is running
- WHEN the slider is observed
- THEN only `Softer` (or its Hebrew equivalent) and `Louder` text labels are visible flanking the track
- AND no number, percentage, or level value appears

### Requirement: User input wins concurrent animation
If the automatic attenuation is mid-animation and the user grabs the slider, the user's input MUST take precedence. The automatic animation MUST cancel immediately.

#### Scenario: Race between auto and manual
- GIVEN the automatic attenuation is sliding the trigger from 0.6 down to 0.3 over 4 seconds
- WHEN the user grabs the slider and drags to 0.2 while the animation is in flight
- THEN the animation cancels immediately
- AND the slider lands at 0.2
- AND the trigger output snaps to 0.2

### Requirement: Ceiling persists across sessions
The slider position the user lands on at session end MUST become the default starting ceiling the next time the same trigger sound is played.

#### Scenario: Ceiling carries over
- GIVEN the user ended their last motorcycle session with the slider at 0.35
- WHEN the user starts a new session with motorcycle in their consented sounds
- THEN the slider's initial position is 0.35
- AND not the original default of 0.65

### Requirement: No mute, no off
The slider MUST NOT have a position labeled "off" or "mute". Pulling the slider to the softest position MUST attenuate the trigger but MUST NOT fully silence it.

#### Scenario: Slider at softest
- GIVEN the slider is dragged to its softest extreme
- WHEN a trigger sound plays
- THEN the trigger plays at a very low audible volume
- AND it is not muted to silence

