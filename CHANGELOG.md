<!-- doc-changelog: generated 2026-10-07. Delete this line once you hand-edit this file. -->
# Changelog

All notable changes to Urheimat are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) while it stays on 0.x.

## [Unreleased]

Nothing user-facing yet.

## [0.3.0] - 2026-10-07

### Breaking

- Runs saved under the previous schema no longer load; start a new game after updating. The save schema is now version 2.
- Treatment of the dead is now 18 parts rather than 3, so the part count across the corpus is 62 and the reconstruction score's maximum is no longer twice that count: only parts the ancestral people had are scored.
- Terrain affinity on a value is written in five named levels (strong, favours, allows, resists, excludes) instead of numbers.

### Added

- Customs carry meaning: every value can hold tags for what it is about, what a people believes it does and what physically happens to the remains, written in a shared vocabulary of nouns and verbs with families (`beyond/sky`, `homeland/split`) and an opposites list.
- Similarity between values of the same part, scored through a lens per cause of change and stored as integer tables, so seeded runs stay deterministic. One default lens ships; the land's pull in drift now favours values near the current one.
- Customs can run in stages with material flowing through them: a funeral may burn, then bury the ash in an urn, then keep nothing. Parts that cannot apply lie dormant (ash has no posture) and values that cannot be held are never offered (an urn takes ash or dust, never a body).
- Treatment of the dead rebuilt as three stages of six axes (act, place, vessel, goods, orientation, posture) and fully described: twelve acts from burning to defleshing, ten places, seven vessels, four rules for grave goods, twelve orientations and seven postures.
- An evidence script, `scripts/evidence/corpus-fit.ts`, measuring whether the corpus is big enough: unique runs, density, spread and whether kin feel alike, with a `--sweep` mode for comparing lens settings.
- Design spike reports for the gameplay loop (2DS.1) and the scholars' notebook (2DS.3), and the roadmap rebuilt around their decisions.

### Fixed

- The scholars' notebook no longer shows phantom stages for parts of a funeral the ancestral people never had.
- The reform picker no longer offers values the land resists as if a neighbour practised them.
- The strain line and the kin cards count only the parts a band actually has.

## [0.2.0] - 2026-09-18

### Added

- Sign in with GitHub, with sign-in and sign-out in the interface.
- Saved runs and scores belong to the signed-in player; the server routes refuse access to anyone else's.

### Fixed

- A failed session lookup falls back to an anonymous session instead of erroring.
- The Vercel functions run on Node rather than Bun.

## [0.1.0] - 2026-09-17

### Breaking

- The random number generator exposes its counter state, so a saved run can resume exactly where it left off. Earlier saves carry no such state.

### Added

- The game, scaffolded from the original single-file prototype, with the project theme applied.
- A MongoDB data layer for runs and scores, with helpers to serialise and restore a game state.
- A local MongoDB via Docker Compose for development.

### Fixed

- Listing runs degrades gracefully on a malformed document instead of failing the whole list.
- Index setup retries after a transient database failure.
- The local Mongo container binds to loopback only.

[Unreleased]: https://github.com/JasonWarrenUK/urheimat/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/JasonWarrenUK/urheimat/releases/tag/v0.1.0
