# 6SL.5 log

Decisions made with Jason while building the prerequisite structure and the storylet engine (spike 2DS.1, decisions 3a, 3r, 3m, 3n).

- Scope: the engine and the shapes, a small consequence vocabulary the engine executes now (a chronicle line, a prosperity change, setting a custom part by value id, losing or gaining a custom, raising a storylet next step), and three sample storylets to prove each mechanism. The corpus is 6SL.12; derived answers, the one-turn keep and bite-back are 6SL.4; how many situations a step raises is 6SL.8; AI bands answering by script is 6SL.7.
- Condition kinds, all in the first version: tag and reading queries scoped to a custom or a part; custom-level absence; world and band state (year, seat terrain, prosperity, leader age and generation, contact); this step's events (succession, move, split, death); the engine's own history (what fired, what was answered, how long ago); and whether a custom names a kind of person the gender custom does not recognise (the 4SD.16 constraint, as a condition a storylet can fire on). `not` wraps any condition.
- Custom-level absence is `Culture.absent`, a set of custom ids. An absent custom keeps its traits as a dormant memory, so a band that regains it regains what it had; strain, drift and the customs tab treat it as inactive. Nothing is absent at generation yet: territory and writing (4SD.11, 4SD.12) will start absent.
- Storylets are typed data in `src/lib/sim/storylets.ts`. At the end of a step the engine applies the player's answers to last step's situations (an unanswered one was let lie, and runs the storylet's `lie` consequences if it has any), moves the world, then evaluates every storylet against the player's band and raises each whose conditions hold. `once` fires one time per run; `cooldown` holds a storylet for so many steps; a raised storylet fires next step whatever its conditions.
- The three samples: `new-leader-doubts` (a succession to a leader under 25; one answer raises `elders-resist`), `elders-resist` (raised only, once; one answer sets the daily cult's officiant), `strangers-at-the-ford` (a band that bars strangers while in contact, cooldown 3; one answer opens the door). Over 30 seeded runs the two self-firing samples raised 118 situations.
- Save schema 5.

## Smoke test

- Played in a browser: `new-leader-doubts` fired at step 12 after a succession to a leader aged 24, the first answer was taken, and the chronicle carried its consequence ("The elders keep the old ways, and the band is the calmer for it.") dated to that step, ahead of the step's drift lines. No console errors beyond the favicon.
