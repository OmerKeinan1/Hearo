# OpenSpec — HearO

This directory uses [openspec.dev](https://openspec.dev), a change-driven spec workflow. Specs describe **requirements** capabilities must satisfy. Changes are tracked proposals that modify those requirements.

## Layout

```
openspec/
├── README.md           this file
├── specs/              the living source of truth — one folder per capability
│   ├── exposure-session/spec.md
│   ├── intensity-control/spec.md
│   └── crisis-access/spec.md
└── changes/            tracked modifications — each is a proposal bundle
    └── <change-name>/
        ├── proposal.md     what's changing and why
        ├── design.md       technical decisions
        ├── tasks.md        implementation breakdown
        └── specs/          the *delta* — only the parts of specs that change
            └── <capability>/spec.md
```

## How OpenSpec relates to the other docs

- **[`../README.md`](../README.md)** — product framing, persona, brand.
- **[`../docs/FRONTEND.md`](../docs/FRONTEND.md)** — visual design system + screen layout sketches.
- **Supabase schema** — the database tables that back the app's persistent data. There is no separate API contract; the schema *is* the contract.
- **`./specs/`** — *requirements* each capability must hold. Testable contracts in Given/When/Then form. These outlive any specific design or implementation.

The other docs say *what we built* and *what it looks like*. The specs here say *what it must do, regardless of how it's built*.

## Adding a new capability

1. Decide the capability name (kebab-case, action-oriented, e.g. `crisis-access`, not `crisis_sheet_ui`).
2. Create `openspec/specs/<name>/spec.md` using the template below.
3. Write requirements + scenarios. Keep scenarios concrete — Given/When/Then with real values.

## Proposing a change to existing capabilities

Instead of editing `specs/` directly, create a change proposal:

```
openspec/changes/<short-change-name>/
├── proposal.md
├── design.md
├── tasks.md
└── specs/
    └── <affected-capability>/spec.md     ← only the delta
```

The delta files mirror the path inside `specs/`. After the change is merged, the delta gets promoted into the canonical spec and the change folder is archived (or deleted).

If you have the OpenSpec CLI installed, `openspec init` and `/opsx:propose "<description>"` (via your AI agent) automate this.

## Spec template

OpenSpec validates a specific markdown shape. Each requirement uses an RFC 2119 keyword (MUST / SHALL / SHOULD / MAY) and contains at least one scenario in GIVEN / WHEN / THEN bullet form.

```markdown
# <capability-name>

## Purpose
<one or two sentences — what this capability is for, who uses it, when>

## Requirements

### Requirement: <Short title>
<One sentence stating the rule. Use MUST / SHALL / SHOULD / MAY.>

#### Scenario: <Short scenario title>
- GIVEN <starting state>
- WHEN <user action or event>
- THEN <observable outcome>
- AND <additional outcome, optional>

#### Scenario: <Another scenario>
- GIVEN ...
- WHEN ...
- THEN ...

### Requirement: <Another rule>
...
```

Validate with `npx -y @fission-ai/openspec validate --all` from the repo root. All requirements must have at least one scenario or validation fails.

Keep scenarios concrete. "GIVEN the user has the slider at the midpoint" beats "GIVEN the slider is set."

## Current capabilities

Order roughly by load-bearing-ness, not by file order:

| Capability                            | What it covers |
|---------------------------------------|----------------|
| [exposure-session](./specs/exposure-session/spec.md)    | The hero feature — guided sound exposure with voice + pulse loop. |
| [intensity-control](./specs/intensity-control/spec.md)  | The dual-layer softening (manual ceiling + automatic pulse-driven). |
| [crisis-access](./specs/crisis-access/spec.md)          | One-tap reach to ERAN 1201 from every screen. |

When the backend lands, add specs for `user-preferences`, `session-history`, `content-catalog`, `daily-reminders`.
