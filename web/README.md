# `web/` — marketing site

Public-facing landing page + privacy policy for HearO. Independent of the mobile app — different stack, different deploy.

## Stack

- **[Astro 6](https://astro.build)** — static-first, near-zero JS in the output.
- **Tailwind CSS v4** via `@tailwindcss/vite` — brand tokens defined in [`src/styles/global.css`](./src/styles/global.css), kept in sync with the mobile app's [`../src/lib/tokens.ts`](../src/lib/tokens.ts).
- **TypeScript strict** — comes with the Astro template.

## Pages

| Route | Source | What |
|---|---|---|
| `/` | [`src/pages/index.astro`](./src/pages/index.astro) | Landing: hero, how a session works, what-it-is/isn't, store-coming-soon CTAs. |
| `/privacy` | [`src/pages/privacy.astro`](./src/pages/privacy.astro) | Privacy policy. **Draft — pending legal review before App Store submission.** |

## Develop locally

```bash
cd web
npm install        # one-time
npm run dev        # localhost:4321
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ on localhost:4321
```

## Deploy (Vercel)

Vercel auto-detects Astro. The only thing to set is **Root Directory** = `web` when importing the repo in the Vercel UI. Build command (`npm run build`) and output directory (`dist`) are auto-detected.

Domain (`hearo.app` or similar) gets pointed at Vercel via DNS once you register it. No code changes here for that.

## Conventions

- **Brand tokens come from one source.** If you change `--color-accent` in `src/styles/global.css`, change the matching value in `../src/lib/tokens.ts` too. Until we extract a shared package, the discipline is manual.
- **Voice is consistent with the app.** Same restraint, same words-we-use list from [`../docs/RATIONALE.md`](../docs/RATIONALE.md) and the root `README.md` "Words we use / don't" block. No therapy jargon, no military framing, no hero copy.
- **Privacy policy is custom-written, not generator-fed.** It reflects HearO's actual data stance (no crisis telemetry, on-device pulse, Supabase-backed prefs). When real data flows change, edit the policy at the same time.
