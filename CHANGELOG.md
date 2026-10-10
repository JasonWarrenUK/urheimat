<!-- doc-changelog: generated 2026-10-07. Delete this line once you hand-edit this file. -->
# Changelog

All notable changes to Urheimat are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) while it stays on 0.x.

## [Unreleased]

Nothing user-facing yet.

## [0.4.0] - 2026-10-10

### Breaking

- Runs saved under the previous schema no longer load; start a new game after updating. The save schema is now version 3: a culture's traits hold a list of values per part rather than one.
- Where the dead go is no longer a custom of its own; its destinations, judgement and rebirth live as readings on the funeral acts. The sacred drink is now the sacred substance. Every custom after the founding tale sits at a new position, so anything that addressed a custom by number must address it by id.
- Only strain in how a band is fed moves prosperity now; strain in belief customs is recorded and costs nothing until the situation system carries it.

### Added

- Every custom in the corpus is described: ids, land affinities in named levels, what each value is about and a full grid of what a people may believe it does. Sixteen customs joined the funeral; 94 parts in all.
- A part can hold a set of values: a rite names who takes part round by round, the greatest power may have two consorts or none, and a killer may be cleansed by fire and water or never at all. An empty set is how a custom says nothing, so there are no "none" values left.
- A custom can shadow another: sacrifice hides behind the sacred substance when the feast is the meal, and the daily cult hides behind the greatest power while its figure is read as that power. Either custom moving away from the match brings the hidden one back.
- Two new customs: how a band is fed (up to three sources, each worked by someone) and the kinds of people a band recognises. Descent, residence and the rites of passage draw on them.
- The greatest power gains five domains (moon, master of beasts, river, wind, death); the sacred substance gains fungus and meat; sacrifice gains a share axis and the first harvest; the founding tale, who rules, the oath, the stranger at the door, marriage and justice are each split where a value bundled two ideas.
- A reading can depend on who else takes part: binding the takers to the chief means nothing if the chief drinks alone.
- The default lens is chosen rather than guessed: `corpus-fit --web` measures each part's values as a web, and the near-neighbour rule is the part's spanning tree plus every pair scoring at least 600, which gives one connected web in every part.
- A tagging log, `docs/spikes/4SD.16-tagging-log.md`, recording every decision and the historical sources consulted.

### Fixed

- The game header shows strain in how the band is fed (the number that moves prosperity) and says how many customs strain too.
- The stranger at the door no longer needs a special case in its rendering: nothing passes and no span runs for a stranger turned away.
- Custom retention bonuses are read from tags rather than display names, so renaming a value cannot silently drop them.

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

[Unreleased]: https://github.com/JasonWarrenUK/urheimat/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/JasonWarrenUK/urheimat/releases/tag/v0.1.0
