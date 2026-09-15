# ADR-001: Initial tech stack and port from the single-file artefact

> **Status**: Accepted
> **Date**: 2026-09-15
> **Author**: Jason Warren
> **Context**: Ported from a single-file HTML artefact (`urheimat.html`) exported from Claude Chat

---

## Context

Urheimat began as a self-contained `urheimat.html` artefact: a hand-rolled DOM-string render loop (`app.innerHTML = ...` on every state change), a pure `SIM` object holding the game logic, and a single inline `<style>` block. It had no build step, no framework, no persistence and no external dependencies.

The game needed to grow into a real project: typed source, a component structure that survives future feature growth (deeper narrative state, more slots and features), automated tests, and a backend for saving runs and a lightweight leaderboard, without losing any of the interactivity the artefact already had.

---

## Decision

- **Frontend**: Svelte 5 (runes) / SvelteKit 2, TypeScript strict.
- **Backend**: MongoDB Atlas, two collections (`runs` for save/resume state, `scores` for the leaderboard).
- **Auth**: Auth.js (`@auth/sveltekit` with `@auth/mongodb-adapter`), attributing saved runs and scores to a signed-in player.
- **Deploy**: Vercel (`@sveltejs/adapter-vercel`).
- **Package manager**: bun.
- **Testing**: Vitest, split into a `server` project (pure logic, Node environment) and a `client` project (Svelte components, Playwright-driven browser environment).

---

## Rationale

The artefact's `SIM` object was already engine-agnostic (no DOM access, pure functions over a plain state object), so it ported almost verbatim into `src/lib/sim/engine.ts` and `src/lib/sim/slots.ts`, gaining types rather than being rewritten. The UI layer changed shape entirely: the artefact's manual `main()` / `renderPanel()` re-render calls became Svelte 5 runes (`$state`, `$derived`) driving a normal component tree, which removes an entire class of "did I re-render everything that changed" bugs the artefact's imperative approach was prone to.

MongoDB was chosen over the initially-assumed Postgres/Supabase default after the actual priority came out during the interview: the narrative state (`GameState`, with its nested `cultures`/`traits`/`map`/`log`) is the product's core and is expected to deepen over time, while the leaderboard is explicitly not a first-class feature. A document store is the native fit for a single nested blob that is always loaded and saved whole and never queried into; the leaderboard's relational query needs (ranking, top-N) are handled adequately by an indexed Mongo collection even though they are not its strongest case. Auth.js was chosen over Clerk because it is self-hosted with a first-party MongoDB adapter, avoiding a third-party auth service for what is a personal project.

---

## Alternatives Considered

### Option 1: PostgreSQL via Supabase

**Description**: `runs` table with a `jsonb` state column, relational tables for the leaderboard, Supabase Auth + RLS for attribution.

**Pros**:
- Native RLS ties row ownership to the signed-in user with no extra auth service.
- Leaderboard ranking/pagination is SQL's home turf.
- `jsonb` behaves like a document store for the one column that needs it, while everything else stays relational.

**Cons**:
- The primary feature (narrative state) sits in a bolted-on column rather than the database's native model.
- Doesn't reflect the stated priority once "leaderboard is not first-class, narrative state is everything" was made explicit.

**Why rejected**: weighted by feature priority rather than by which technology is more broadly capable, the primary feature's natural fit wins.

### Option 2: Split Mongo (state) + Postgres (auth/leaderboard)

**Description**: Best-fit database per data shape.

**Pros**: Each database does only what it's best at.

**Cons**: Two backend systems to run, pay for and operate for a solo project.

**Why rejected**: unjustified operational cost for the project's current scale.

---

## Consequences

### Positive

- The pure simulation engine has zero framework dependency and is fully unit-testable in isolation (`src/lib/sim/engine.test.ts`).
- Svelte 5 runes remove the artefact's manual re-render bookkeeping; UI bugs from a forgotten `main()` call are structurally impossible.
- The narrative state can deepen (more slots, richer culture relationships) without a schema migration.

### Negative

- MongoDB has no native row-level security; ownership checks for `runs`/`scores` documents live in SvelteKit server route logic rather than being enforced by the database.
- No foreign-key constraints between `runs`/`scores` and the player; referential integrity is an application concern.

### Neutral

- The backend (Mongo collections, Auth.js wiring, API routes) was scoped out of this initial port per the scaffolding skill's own boundary: the schema and provider choice are recorded here, but `src/auth.ts`, `hooks.server.ts` and the `/api/runs`, `/api/scores` route handlers are not yet implemented.

---

## Implementation Notes

- `src/lib/sim/slots.ts` and `src/lib/sim/engine.ts` are the ported simulation; `src/lib/types.ts` declares every data shape as an explicit `interface`.
- `src/lib/game-store.svelte.ts` holds the UI-facing reactive state (`GameStore` class using `$state` fields, including `orders.held` as a `SvelteSet` since Svelte 5's `$state` proxy does not deep-wrap `Set`/`Map`).
- Component tree: `+page.svelte` dispatches on `game.phase` to `IntroScreen` / `StartPicker` / `GameScreen` / `ReconstructorNotebook`; `GameScreen` composes `WorldMap`, `TraitRow`, `KinCard`, `TeachPicker`.
- `RunDocument`/`ScoreDocument`/`SerializedGameState` types in `src/lib/types.ts` mark the intended Mongo document shapes for when the data layer is built.

---

## Verification

- `bun run check` (svelte-check, strict TypeScript) passes with zero errors.
- `bun run test:unit` passes (engine determinism tests plus the scaffold's own component test).
- Every interaction catalogued from the original artefact (Hold, Reform + picker + Undo, Migrate, Daughter band, Teach, Consolidate, End the era, tab switching, both ending-screen restart paths) was driven live in a browser against the ported app and confirmed to behave identically to the artefact.

---

## Related Decisions

- None yet; this is the project's first ADR.

---

## References

- Original artefact: `urheimat.html` (single-file HTML/JS/CSS export).
- `~/.claude/skills/import-scaffold_artefact/SKILL.md` — the scaffolding procedure this port followed.
