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
- A MongoDB Atlas connection string and GitHub OAuth credentials, once the save/leaderboard backend is implemented (not yet wired up — see Configuration)

## Installation

```bash
bun install
```

## Usage

```bash
bun run dev
```

Then open the printed local URL. The game runs entirely client-side; there is no build step required to play it locally.

## Configuration

No environment variables are required yet. The project is scaffolded for a MongoDB + Auth.js backend (save/resume runs, a leaderboard) per `docs/adrs/001-initial-tech-stack.md`, but that data layer has not been implemented. When it is, expect:

- `MONGODB_URI` — Atlas connection string
- `AUTH_SECRET`, plus the chosen OAuth provider's client ID/secret — Auth.js configuration

## Project Structure

- `src/lib/sim/` — the pure simulation engine (`engine.ts`, `slots.ts`) and display constants (`display.ts`). No Svelte or DOM dependency; independently testable.
- `src/lib/types.ts` — every data shape as an explicit TypeScript interface.
- `src/lib/game-store.svelte.ts` — the reactive UI-facing game state (Svelte 5 runes).
- `src/lib/components/` — one component per screen/region (`IntroScreen`, `StartPicker`, `GameScreen`, `ReconstructorNotebook`, `WorldMap`, `TraitRow`, `KinCard`, `TeachPicker`, `TerrainLegend`).
- `src/routes/` — the single SvelteKit route that dispatches between the four game phases.
- `docs/adrs/` — architecture decision records.

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
