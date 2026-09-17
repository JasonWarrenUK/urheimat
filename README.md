# Urheimat

A solo strategy game about the drift of culture and the limits of the comparative method: lead a people across eight eras, then watch future scholars try (and sometimes fail) to reconstruct what you actually believed.

## Overview

You start as one ancestral culture with sixteen customs (cosmology, rite, kinship, law), each built from several independently-drifting parts. Across eight eras you hold, reform, migrate, split off daughter bands and teach forgotten customs back to your neighbours. At the end, the game runs its own comparative-method reconstruction against every surviving descendant culture and scores how much of the truth would actually have been recoverable, false convergences and all.

The game began as a single self-contained HTML artefact and was ported into a full SvelteKit project; see `docs/adrs/001-initial-tech-stack.md` for the port's rationale.

## Features

- Deterministic, seeded procedural generation of the map, the ancestral culture and every neighbouring people.
- Sixteen customs, each with two to three independently-drifting features, pulled by terrain, contact with neighbours and how conservative your rule is.
- A genuine comparative-method scoring pass: secure recoveries, doubtful ones, false reconstructions and unrecoverable losses are all distinguished and explained.
- Canvas-rendered world map with click-to-select tile interactions for founding a homeland and migrating.

## Prerequisites

- [bun](https://bun.sh) 1.x
- [Docker](https://www.docker.com/) (for a local MongoDB via `bun run db:up`), or a MongoDB Atlas connection string
- GitHub OAuth credentials, to sign in and keep runs (optional; without them the game plays anonymously). See `docs/setup/github-oauth.md`.

## Installation

```bash
bun install
```

## Usage

```bash
bun run db:up   # start a local MongoDB (requires Docker running)
bun run dev
```

Then open the printed local URL. The simulation itself runs entirely client-side, so the game is playable without signing in; the server side handles authentication and run storage only. Run `bun run db:down` when you're done with the local database.

## Configuration

Copy `.env.example` to `.env`:

- `MONGODB_URI` — MongoDB connection string. `mongodb://localhost:27017` for the local Docker instance, or an Atlas connection string.
- `MONGODB_DB` — database name (defaults to `urheimat` if unset).

Sign-in is via GitHub, through Auth.js. These three are optional: leave them unset and the game plays anonymously with the sign-in control hidden.

- `AUTH_SECRET` — session encryption key. Generate with `openssl rand -hex 32`.
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — from a GitHub OAuth app whose callback URL is `http://localhost:5173/auth/callback/github`.

`docs/setup/github-oauth.md` walks through creating the OAuth apps, the Atlas cluster and the Vercel variables.

`bun run test` and `bun run check` both pass with no live database and no auth credentials required.

## Project Structure

- `src/lib/sim/` — the pure simulation engine (`engine.ts`, `slots.ts`) and display constants (`display.ts`). No Svelte or DOM dependency; independently testable.
- `src/lib/types.ts` — every data shape as an explicit TypeScript interface.
- `src/lib/game-store.svelte.ts` — the reactive UI-facing game state (Svelte 5 runes).
- `src/lib/components/` — one component per screen/region (`IntroScreen`, `StartPicker`, `GameScreen`, `ReconstructorNotebook`, `WorldMap`, `TraitRow`, `KinCard`, `TeachPicker`, `TerrainLegend`).
- `src/routes/` — the game route that dispatches between the four game phases, the `signin`/`signout` form actions and `api/runs`.
- `src/lib/server/` — server-only code: the MongoDB connection and access helpers (`db.ts`, `runs.ts`, `scores.ts`), the Auth.js configuration (`auth.ts`) and the ownership guard (`player.ts`).
- `docs/adrs/` — architecture decision records.
- `docs/setup/` — credential and deployment setup that can't be scripted.

## Development

```bash
bun run check       # svelte-check, strict TypeScript
bun run test:unit   # Vitest (server + browser-component projects)
bun run dev         # local dev server
```

## Documentation

See `docs/adrs/001-initial-tech-stack.md` for the stack decision and the artefact-to-Svelte port rationale.

## License

Unlicensed (personal project).
