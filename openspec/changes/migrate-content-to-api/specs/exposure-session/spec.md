## ADDED Requirements

### Requirement: Voice script matches the scene
The voice narration played during a session SHALL belong to the chosen scene. A session in a given scene MUST NOT play voice content that describes a different scene.

#### Scenario: Park scene plays park voice
- **WHEN** the user starts a session with the Park scene
- **THEN** the opening, during, and calming voice lines describe a park
- **AND** they do not describe a river, cafe, or road

#### Scenario: River scene plays river voice
- **WHEN** the user starts a session with the River scene
- **THEN** the voice lines describe the river walk
- **AND** the imagery shown matches the river scene
