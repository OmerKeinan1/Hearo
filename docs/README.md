# Docs

Long-form documentation for HearO. Each file has YAML front-matter with tags and audience hints. The root `README.md` stays at the repo root as the project front door.

## Index

| Doc | Tags | Audience | One-liner |
|---|---|---|---|
| [`RATIONALE.md`](./RATIONALE.md) | `clinical`, `product`, `persona`, `research` | everyone, clinician | Why the product is shaped the way it is. Exposure-therapy literature, persona constraints, what HearO is *not*. |
| [`FRONTEND.md`](./FRONTEND.md) | `design`, `ui`, `screen-specs`, `frontend-dev` | frontend-dev, designer | Palette, typography, motion, screen-by-screen ASCII mockups, crisis-sheet pattern, RTL and bilingual implementation. |
| [`CONVENTIONS.md`](./CONVENTIONS.md) | `code`, `conventions`, `stack`, `frontend-dev` | frontend-dev | Tech stack, folder structure, hooks pattern, state management rules, Supabase typed-client workflow, day-one feature checklist. |
| [`research/in-the-moment-feature.md`](./research/in-the-moment-feature.md) | `clinical`, `product`, `research` | everyone, clinician, product | Exploratory memo: an on-device "before & after" regulation feature, the renewal/transfer gap it targets, and the peer-reviewed engagement evidence on whether users self-initiate during a trigger. |

## Related (not in this folder)

| Where | What |
|---|---|
| [`../README.md`](../README.md) | Project overview, core loop, brand, scope. Repo front door. |
| [`../openspec/`](../openspec/) | Capability requirements (Given/When/Then) + change proposals via [openspec.dev](https://openspec.dev). |
| [`../voice-scripts/`](../voice-scripts/) | Per-scene voice narration source text (start / briefing / closing), EN + HE. |
| [`../CLAUDE.md`](../CLAUDE.md), [`../AGENTS.md`](../AGENTS.md) | Tooling files auto-loaded by Claude Code / Cursor / other AI agents. Kept at root by convention. |

## Tag glossary

The front-matter tags on each doc make it easy to grep for a given concern (`grep -rln "tags:.*clinical" docs/`):

- `clinical` — anything grounded in PTSD / exposure-therapy literature or constrained by clinical guidelines.
- `product` — what the product is, who it's for, what it isn't.
- `persona` — combat-veteran persona constraints (language, imagery, framing).
- `design`, `ui` — visual design system: palette, typography, motion, layout.
- `screen-specs` — ASCII mockups + behavior per screen.
- `code`, `conventions`, `stack` — implementation choices: libraries, folder structure, naming.
- `research` — citations to clinical guidelines and academic papers.

## When to add to this folder

- New long-form prose about *why* or *how* the product/code is shaped a particular way.
- Anything that would be a heavyweight `README` section but isn't needed by readers of the repo's front door.

When **not** to add here:
- API specs / wire formats — those belong with the data layer (Supabase schema docs or generated types).
- OpenSpec capabilities — those live in [`../openspec/specs/`](../openspec/specs/).
- Short tactical notes — keep those in the source file or commit message; if they need a doc, write a feature folder under [`../src/components/features/`](../src/components/) with its own `index.ts`.
