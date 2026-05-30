# HearO frontend conventions

Conventions for the React Native (Expo) UI. Sister docs: [`../FRONTEND.md`](../FRONTEND.md) for visual design and screen specs, [`../server/openapi.yaml`](../server/openapi.yaml) for the API contract.

## 1. Tech stack

| Concern | Library | Status |
|---|---|---|
| Runtime | Expo SDK 54 (managed) | in use |
| Language | TypeScript strict | in use |
| Routing | Expo Router (file-based) | in use |
| Styling | NativeWind (Tailwind) + scoped `StyleSheet` | in use |
| Animations | `react-native-reanimated` | in use |
| Server state / caching | `@tanstack/react-query` v5 | planned (no backend yet) |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | planned |
| Validation schemas | `zod` | planned |
| i18n | `i18next` + `react-i18next` | in use |
| Date | `date-fns` | planned |
| Errors | `@sentry/react-native` | planned |
| Analytics | `posthog-react-native` | planned |
| Icons | hand-bundled SVGs via `react-native-svg-transformer` | in use (Streamline + custom) |
| Charts | `victory-native` or `react-native-svg-charts` | only if we need them |
| API client | `@hey-api/openapi-ts` + TanStack Query bindings | planned (spec exists, no backend yet) |
| Linting | `eslint` + `@react-native/eslint-config` | planned |
| Formatting | Prettier | planned |
| Audio | `expo-audio` | in use |
| Video | `expo-video` | planned (scene loops, asset-blocked) |

## 2. Folder structure

Under `src/`:

```
src/
├── app/             Expo Router screens (file-based)
├── components/
│   ├── features/    feature-scoped components (one folder per feature)
│   │   └── <feature>/
│   │       ├── Screen.tsx       top-level screen
│   │       ├── Card.tsx         presentational
│   │       ├── Constants.ts     feature-local constants
│   │       └── index.ts         public exports
│   ├── common/      shared low-level components
│   └── icons/       custom icon components (today: Icon.tsx wrapper + SVGs)
├── contexts/        React contexts (when used — see §6)
├── hooks/           custom hooks, one per feature/concern (see §4)
├── lib/             framework-agnostic utilities (content seam, audio, pulse, stores)
├── generated/api/   auto-generated OpenAPI client + TanStack Query bindings (planned)
├── types/           shared TypeScript types
├── config/          config constants (URLs, feature-flag defaults)
├── styles/          design tokens + theme (today: lib/tokens.ts)
├── locales/<lang>/  i18n string files (today: inlined in lib/i18n.ts; split when features grow)
└── utils/           pure utility functions
```

Rules:

- **Feature folders are the unit of organization.** New feature → new folder under `features/`. Don't scatter feature code across `components/`, `hooks/`, etc. Cross-cutting hooks (`useAuth`, `useOrganization`) go in top-level `hooks/`.
- **No barrel files at the root** — only inside each feature folder via its `index.ts`.
- **Imports use absolute paths** (`@/components/features/sat/SatUserCard`), not deep relative paths. Aliases are configured in `tsconfig.json` and Metro.

## 3. Design tokens

Centralize tokens in `src/lib/tokens.ts` (today's location) — migrating to `src/styles/theme.ts` is fine when the surface grows.

Token scales to define:

- **Colors** — semantic names: `bg`, `text`, `accent`, `critical`, `sage`. See [`../FRONTEND.md#palette`](../FRONTEND.md#palette) for the canonical palette and rationale.
- **Spacing** — 4px-based scale: 1=4, 2=8, 3=12, 4=16, 6=24, 8=32, 12=48, 16=64.
- **Typography** — token names, not raw sizes: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`. Define font family, weight, line-height per token.
- **Radii** — `sm`, `md`, `lg`, `full`.
- **Shadows** — `xs`, `sm`, `md`, `lg`. On RN this means explicit `elevation` (Android) + `shadowColor/Offset/Opacity` (iOS).

Rules:

- **Never hardcode hex or px in components.** Always reference tokens.
- **Light mode default**, dark mode optional. Plan dark from day one.

## 4. Hooks conventions

Top-level `hooks/` holds one hook per feature or concern, naming pattern `useXxx`:

- Server state via TanStack Query, wrapping the auto-generated API client (`useOrganization`, `useUsers`, etc.).
- Auth + session: `useAuth`, `useAppStatus`.
- Analytics: `useAnalytics`.
- Feature-specific data hooks: `useSatApi`, `useLeaks`, etc.
- Feature flags: `useAsatFeatureFlag`.

Rules:

- **One hook per file**, named after the file (`useSatApi.ts` exports `useSatApi`).
- **Wrap the generated API client in a hook** — don't call it directly from components. The hook owns query-key shape, error handling, cache invalidation.
- **No business logic in components** that belongs in a hook.

## 5. API client — auto-generated

Pattern:

1. Server publishes an OpenAPI spec (today: [`../server/openapi.yaml`](../server/openapi.yaml)).
2. `@hey-api/openapi-ts` generates `src/generated/api/` with typed request/response models and TanStack Query hooks per endpoint.
3. Feature hooks wrap the generated hooks with project-specific defaults (auth headers, query keys, error mapping).
4. Run via `npm run generate:api` whenever the spec changes.

Rules:

- **Don't hand-write API types.** If the type isn't in `generated/api/`, the server doesn't expose it — add it server-side first.
- **`generated/api/` is read-only.** Never edit by hand.
- **Regenerate on every spec change.** Commit the regen alongside the consumer change.

## 6. State management

- **Server state → TanStack Query** (every fetch goes through a hook).
- **URL / route state → Expo Router navigation params**.
- **Cross-cutting client state → React Context** (auth session, theme). One context per concern, providers composed at app root.
- **Zustand is allowed where Context creates re-render storms or feels overkill.** We currently use it in `lib/session-store.ts`, `lib/crisis-store.ts` — small slices that several disconnected components subscribe to. Default to Context unless there's a concrete reason; reach for Zustand only when measured.
- **No Redux, no MobX.**

## 7. Forms

Pattern: `react-hook-form` + `zod` schema via `@hookform/resolvers`.

```ts
const schema = z.object({
  email: z.string().email(),
  clientAmount: z.number().int().positive(),
});

const { register, handleSubmit, formState: { errors } } =
  useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
```

Rules:

- All forms use this stack. No ad-hoc `useState` juggling for form state.
- Schema defines required-ness, not the UI — required asterisk in the label is derived from `schema.shape[field]._def.typeName !== 'ZodOptional'`.
- Server-side validation mirrors the schema. Don't trust the client.
- Submit blocked until valid — disable the submit button until `formState.isValid`.

## 8. i18n

`react-i18next` with locale files in `src/locales/<lang>/`. One JSON file per feature (`sat.json`, `leaks.json`, `auth.json`). Keys nested by feature subcomponent.

Rules:

- **No hardcoded user-facing strings.** Every visible string lives in a locale file. Catalog content (scene labels, voice scripts) lives in `lib/content.ts`, not i18n — the adapter owns its own bilingual fields.
- **No string interpolation in JSX with `${}`** — use i18next interpolation: `t('sat.welcome', { name: user.name })`.
- **Hebrew is a first-class language**, not an afterthought. RTL is handled via `I18nManager.forceRTL` at app start.

## 9. Analytics + errors

- PostHog for product analytics. Every user-meaningful action gets an event. Wrap PostHog in `useAnalytics()` so swap-out is one place.
- Sentry for errors. Wrap the app in an `ErrorBoundary` + global error handler. Distinct DSN per environment.

Rules:

- Identify the user post-login: `posthog.identify(userId, props)` + `group('organization', orgId, { name })` so sessions tag correctly.
- **No PII in event properties beyond user ID + org ID.**
- **Crisis-access taps MUST NOT be logged.** Spec requirement from [`../openspec/specs/crisis-access/spec.md`](../openspec/specs/crisis-access/spec.md): "the backend MUST never be informed when the crisis sheet is opened." Analytics wrappers must explicitly skip these events.

## 10. Naming & style

- **Files:** PascalCase for components (`SatUserCard.tsx`), camelCase for hooks/utils (`useSatApi.ts`, `formatDate.ts`), kebab-case for configs/scripts (`.eslintrc.js`).
- **Components:** PascalCase, descriptive (`SatUserDrawer` not `Drawer`).
- **Hooks:** `useXxx`, named after what they return.
- **Constants:** SCREAMING_SNAKE for true constants, camelCase for config-y things.
- **Imports:** absolute via `@/`, sorted (external → internal → relative).
- **No default exports for components in shared libs** — makes refactors easier. Page entry points (Expo Router screens) can use default exports if the router demands it.

## 11. TypeScript

- `strict = true`. No `any` without a comment explaining why.
- Generated types are the source of truth for API shapes.
- Discriminated unions over `if (typeof === ...)` for state machines.
- `noUncheckedIndexedAccess: true` — catches a class of bugs around array/object lookups.

## 12. Testing

- **Unit:** Jest + React Testing Library (native) for pure logic + hooks.
- **E2E:** Maestro or Detox.
- **No tests for trivial getters or pure UI.** Test logic, hooks, and critical user flows.

## 13. Day-one checklist for a new feature

- [ ] Feature folder under `src/components/features/<name>/`
- [ ] Locale file at `src/locales/<lang>/<name>.json`
- [ ] Server endpoints added to OpenAPI spec, regenerated, hook wrapper in `src/hooks/use<Name>Api.ts`
- [ ] Tokens used for every color/space/radius
- [ ] Forms (if any) use `react-hook-form` + `zod`
- [ ] User-meaningful actions wired through `useAnalytics()`
- [ ] Hebrew strings present for every English string

## 14. Current state vs. aspiration

The conventions above are the target. As of the last commit, HearO is partly there:

- **In place:** Expo Router, TypeScript strict, NativeWind, tokens in `lib/tokens.ts`, i18n with EN+HE, Reanimated, Zustand stores, content adapter in `lib/content.ts` shaped to mirror the OpenAPI spec, OpenAPI spec at `server/openapi.yaml`, `expo-audio` for trigger playback.
- **Not yet:** TanStack Query (no backend yet), `@hey-api/openapi-ts` generation, forms (no form screens exist), Sentry, PostHog, formal `src/styles/` and `src/locales/` splits (still inlined while the surface is small), `react-native-svg-charts` (no charts yet), feature folders (the app is small enough that everything lives at `src/app/` and `src/components/`).

Adopt the structure as new features land; don't refactor purely for the sake of it.
