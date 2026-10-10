# Urheimat

A solo strategy game about the drift of culture and the limits of the comparative method. Lead a people across the ages, then watch future scholars try, and sometimes fail, to reconstruct what you actually believed.

**Play it now:** https://urheimat.vercel.app/

This README is in two halves on purpose. [What the game is today](#what-the-game-is-today) describes what you get when you open that link. [What the game is going to be](#what-the-game-is-going-to-be) describes the redesign the roadmap commits to, almost none of which has shipped yet. If a sentence in the second half sounds better than the first, that is the gap between them, not a hidden feature.

## What the game is today

The current build is a complete, short, menu-driven game: eight turns, playable in one sitting.

**Setup.** The game generates a world map, an ancestral people with a name, a home terrain and seventeen customs, and a scattering of neighbouring peoples, all from one seed. The intro shows you everything your people hold to be true. Then your band scatters, and you pick a tile within two days' walk of the homeland to settle on.

**Play.** The run is eight eras. In each era you give up to three orders, chosen from six:

- **Hold** a custom, so none of its parts drift this era.
- **Reform** a part of a custom to a value the land allows or a neighbour practises.
- **Migrate** to a neighbouring tile. Costs prosperity and loosens every custom for an era.
- **Daughter band**: split off a new people, who then drift on their own. Costs prosperity.
- **Teach** a people you are in contact with the parts of a custom they have lost and you still keep.
- **Consolidate** to gain prosperity.

Then you end the era. Every custom you did not hold may drift, pulled by the terrain, by contact with neighbours and by how conservative your rule is. Neighbouring peoples drift, move and send out daughter bands of their own. The header shows your prosperity, how many of the ways your band is fed strain against the land, and how many peoples are still alive. Three tabs show your customs, what you know of your kin (which goes stale when you lose contact) and a chronicle of what happened.

**Ending.** After eight eras the game runs a comparative-method reconstruction against every surviving descendant of your people and opens the Reconstructor's notebook. For each part of each custom it reports whether the scholars recovered the truth securely, recovered it doubtfully, reconstructed something false, or could not recover it at all, with a note explaining why. You get a score out of a maximum, and can start again with the same people or a new one.

**Under the hood.** The simulation is deterministic from its seed and runs entirely in your browser. Seventeen customs are built from 94 parts, every value tagged with what it is about and what a people may believe it does. A part can hold a set of values, a custom can run in stages (a funeral that burns, then buries the ash) and one custom can stand in for another while they describe the same act. Drift favours values similar to the current one, so Sky becomes Storm more readily than Sea.

**What the game does not do yet.** Be clear about these before you sign in or close the tab:

- **Nothing is saved.** Closing the tab loses the run. There is no save, no resume and no record of finished runs.
- **Signing in does nothing yet.** The GitHub sign-in button exists on deployments that have OAuth configured, and it does sign you in, but no run or score is written against your account. It is plumbing for the persistence work below.
- **There is no leaderboard or archive**, and no way to share a result.
- **The canvas map has no keyboard or screen-reader path.** You need a pointer to found a homeland or migrate.

## What the game is going to be

The design spikes in `docs/spikes/` interrogated the game above and kept little of its loop. The roadmap in `docs/roadmaps/PHASE_1.md` is the plan for building the replacement. The persistence track has its foundations in. The situation loop, which everything else in the redesign waits on, has not started. Treat everything in this section as intent.

**The premise changes.** You will not lead a band through eight eras of orders. You will be a spirit bound to one line among a scattering people. Leaders are born, lead and die on a 25-year step; the spirit remains and remembers everything, while each generation knows only what it lived and what its elders told it.

**The menu goes.** There will be no standing list of orders and no action budget. Instead, each turn raises situations: a custom straining against the land, a stranger at the ford, authored storylets that fire when their prerequisites are met. You answer them through your leaders. Pressure comes and goes like weather, with peaks and lulls. Random drift goes with the menu: every change in any band's customs, yours or a neighbour's, becomes something somebody saw happen.

**Numbers mostly leave the screen.** Prosperity becomes condition, felt as strands (food, numbers, standing) through the situations rather than shown as a figure. Strain stays per custom, with no aggregate count.

**The world gets deeper.** Territory and writing become customs a band can grow into rather than fixed phases: every band starts as a wandering point with a seat tile, settles when it meets the prerequisites, and a settled band reaches writing sooner. Every band keeps dated knowledge of every other, so a people met again after long absence may go unrecognised and a daughter band may be mistaken for its parent. A second, unrelated founding stock seeds the world to contaminate the record. Borrowing flows down a prestige gradient. Each band's history is recorded step by step.

**The ending becomes emergent.** The run ends when written record begins, because that is where prehistory ends. If writing stalls for a long time, a power from beyond the map arrives instead. A player whose band dies or is absorbed, or who chooses to stop, watches a timelapse of the world first.

**The notebook becomes a book, with no score.** The scholars will never meet a band. What they can say of a vanished people comes from material remains, from what literate neighbours wrote of it, from its own writing if it had any and from tales among other peoples. Attestation is derived from that evidence, value by value, never rolled. The notebook becomes two books with a switch on every page: the scholars' book, written by one named scholar from a small cast whose biases tip the close calls, and the true book, an omniscient history that remarks on the scholars' errors. Prose only, no totals. Nothing about the notebook is shown during play; it is a verdict on the whole of history, not a target you are told to play towards.

**Persistence arrives.** Save and resume across sessions and devices, and an unranked archive of finished runs that can rebuild their notebook on demand. This is the one track that does not wait on the redesign.

The dependency order, task status and the reasoning behind each decision live in `docs/roadmaps/PHASE_1.md` and `docs/reports/ROADMAP_OVERVIEW.md`. The spike reports in `docs/spikes/` record why each decision was made.

## Running it locally

### Prerequisites

- [bun](https://bun.sh) 1.x
- A container runtime for the local MongoDB via `bun run db:up`: [Colima](https://github.com/abiosoft/colima) or Docker Desktop, either of which provides the `docker compose` CLI. Alternatively, skip it and point `MONGODB_URI` at a MongoDB Atlas cluster.
- GitHub OAuth credentials, if you want the sign-in control to appear (optional; without them the game plays anonymously, and today sign-in stores nothing either way). See `docs/setup/github-oauth.md`.

### Installation

```bash
bun install
```

### Usage

```bash
colima start    # if using Colima and the VM isn't already running
bun run db:up   # start a local MongoDB
bun run dev
```

Then open the printed local URL. The simulation itself runs entirely client-side, so the game is playable without signing in or without a database at all; the server side handles authentication and run storage only. Run `bun run db:down` when you're done with the local database.

### Configuration

Copy `.env.example` to `.env`:

- `MONGODB_URI`: MongoDB connection string. `mongodb://localhost:27017` for the local Docker instance, or an Atlas connection string.
- `MONGODB_DB`: database name (defaults to `urheimat` if unset).

Sign-in is via GitHub, through Auth.js. These three are optional: leave them unset and the game plays anonymously with the sign-in control hidden.

- `AUTH_SECRET`: session encryption key. Generate with `openssl rand -hex 32`.
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`: from a GitHub OAuth app whose redirect URI is `http://localhost:5173/auth/callback/github`.

`docs/setup/github-oauth.md` walks through creating the OAuth apps, the Atlas cluster and the Vercel variables.

`bun run test` and `bun run check` both pass with no live database and no auth credentials required.

## Project structure

The game began as a single self-contained HTML artefact (`urheimat.html`, kept at the root) and was ported into a full SvelteKit project; see `docs/adrs/001-initial-tech-stack.md` for the port's rationale.

- `src/lib/sim/`: the pure simulation engine. `engine.ts` runs the eras; `slots.ts` is the corpus of customs; `vocabulary.ts` holds the words tags are written in; `predicates.ts` decides which parts apply and which customs shadow others; `similarity.ts` and `lens.ts` score how alike two values are; `serialise.ts` saves and loads runs; `display.ts` holds display constants. No Svelte or DOM dependency; independently testable.
- `src/lib/types.ts`: every data shape as an explicit TypeScript interface.
- `src/lib/game-store.svelte.ts`: the reactive UI-facing game state (Svelte 5 runes).
- `src/lib/components/`: one component per screen/region (`IntroScreen`, `StartPicker`, `GameScreen`, `ReconstructorNotebook`, `WorldMap`, `TraitRow`, `KinCard`, `TeachPicker`, `TerrainLegend`).
- `static/`: the favicon and other files served as-is.
- `src/routes/`: the game route that dispatches between the four game phases, the `signin`/`signout` form actions and `api/runs`.
- `src/lib/server/`: server-only code, namely the MongoDB connection and access helpers (`db.ts`, `runs.ts`, `scores.ts`), the Auth.js configuration (`auth.ts`) and the ownership guard (`player.ts`).
- `scripts/evidence/`: evidence scripts run with `bun run scripts/evidence/<name>.ts` (`corpus-fit.ts` measures whether the corpus is big enough and compares lens settings with `--sweep` and `--web`; `pacing.ts` and `play-styles.ts` measure game pacing).
- `docs/adrs/`: architecture decision records.
- `docs/spikes/`: design spike reports and the corpus tagging log.
- `docs/roadmaps/`, `docs/reports/`: the phase roadmap and its overview.
- `docs/setup/`: credential and deployment setup that can't be scripted.

## Development

```bash
bun run check       # svelte-check, strict TypeScript
bun run test:unit   # Vitest (server + browser-component projects)
bun run dev         # local dev server
```

## Documentation

See `docs/adrs/001-initial-tech-stack.md` for the stack decision and the artefact-to-Svelte port rationale, `docs/spikes/` for the design decisions the game now rests on and `CHANGELOG.md` for what changed in each release.

## License

Unlicensed (personal project).
