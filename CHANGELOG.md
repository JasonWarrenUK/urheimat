# Changelog

All notable changes to Urheimat are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) while it stays on 0.x.

## [Unreleased]

### Added

- A favicon: one root branching into three, in the game's colours, as SVG with an `.ico` fallback and an Apple touch icon. The browser tab no longer shows the Svelte logo.

### Changed

- The README is split into what the game is today and what the roadmap says it will become, and says plainly that nothing is saved yet and that signing in stores nothing.

## [0.6.0] - 2026-10-10

### Breaking

- Runs saved under the previous schema no longer load; start a new game after updating. The save schema is now version 5: a band may lack customs, and the run carries its events, its story and the storylets raised for the next step.

### Added

- Storylets. A storylet is data: when it may fire, what it says, the answers it offers and what each answer does. At the end of a step the answers you gave to the last step's situations take effect before the world moves; then every storylet is checked against your band and the ones whose conditions hold become the coming step's situations. Letting a situation lie can have consequences of its own. A storylet may fire once per run, cool down for a number of steps or fire only when another storylet raises it.
- One condition language, which will also gate writing and territory: a custom holding a value about a tag or carrying a reading, whether the band still keeps a custom, the year, the land, prosperity, the leader's age and generation, contact with neighbours, what happened this step (a succession, a move, a split, a death) and what the engine itself has already raised and been told.
- Consequences an answer can carry: a chronicle line, a change in prosperity, setting a part of a custom to a value, losing or regaining a custom and raising a storylet next step.
- A band can lack a custom. Its values stay as a dormant memory, so regaining it restores what the band had; the customs tab shows "No longer kept".
- Three storylets to begin with: a young leader whose elders mutter, elders who keep the daily rite from the leader, and strangers at the ford for a band that bars them. The corpus proper is a later task.
- A decisions log for the engine, `docs/spikes/6SL.5-storylet-engine-log.md`.

## [0.5.0] - 2026-10-10

### Breaking

- Runs saved under the previous schema no longer load; start a new game after updating. The save schema is now version 4: every band carries its leading family and leader, and a run is fifteen steps.
- The order menu and the action budget are gone. A step takes a move and an answer per situation; hold, reform, teach, consolidate and the daughter-band order no longer exist, and the reform picker and teach picker with them.

### Added

- The world moves in fixed 25-year steps, and a run is fifteen of them. The header shows the year and the step; the chronicle is dated by year.
- Every band is led by a person from a family whose lives are drawn at birth: a child at 18, more with halving odds while under 45, death between 36 and 75. When a leader dies the band's own descent custom decides who follows (the leader's children or a sibling's; eldest or youngest first), with a kinsman of no tracked line as the fallback. A daughter band is founded by a child of the leader who is not the heir. The header names your leader with their age and generation since the scattering, and the chronicle records your band's deaths and successions.
- The step screen: one button lets twenty-five years pass, migrate is the one act you can start yourself, and a place for situations and their answers stands ready with "let it lie" always offered. Nothing raises a situation yet; that is the pressure and storylet work on the roadmap.
- A log of the decisions behind the step and the leaders, `docs/spikes/6SL.1-2-world-step-log.md`.

### Changed

- The README is in two halves, what the game is today and what it is going to be, with the redesign marked as intent; the first half describes the step, the leaders and the missing menu.
- The intro states the facts of the run (fifteen steps, no actions); its rewrite is still to come.
- The site has a favicon.

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

[Unreleased]: https://github.com/JasonWarrenUK/urheimat/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/JasonWarrenUK/urheimat/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/JasonWarrenUK/urheimat/releases/tag/v0.1.0
