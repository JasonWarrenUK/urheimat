# 6SL.3 log

Decisions made with Jason while building layer 1 pressures: the land's and neighbours' pull on a custom surfaced as a situation with written answers, replacing random drift for every band.

## Shape

- A pressure is a pull per source, not one scoring pass with a label. Each source (the land under the seat, each band in contact, the band's memory of a lost value, a land it lived on before, another custom's tags, the land's preference for a part being empty) makes its own pull on a part towards one operation (adopt a value, add a member, drop a member) with its own strength. The strongest contributor this step names the situation; two sources pulling the same way add up. Every note on the task slots in as a source rather than a term in a formula.
- Pulls build. A pull carries over between steps and grows while its source persists; one whose source has gone halves each step and dies under 0.1. A pull surfaces when it reaches the band's hold (the old retention: conservatism, law, mediation, stone, voice, less after a move), strongest first, to a cap. Chosen over a threshold alone (pile-ups on arrival) and over a per-step roll (stateless, nearer the old drift).
- The cap is three pressures a step, beside the storylet cap of two, so a stormy step can show five situations. A placeholder until 6SL.8's weather. Chosen over two: today's silent rate was about five part changes a step, and three keeps the game nearer that churn with every change seen.
- AI bands get the same pulls and the same cap (spike 4k, one system) and resolve each surfaced pull by its let-it-lie outcome until 6SL.7 scripts them. Their changes appear in the player's chronicle when the player is in contact with them.
- Nothing in the pressure system spends the seeded rng: which pulls surface is decided by strength alone.

## Answers

- "Let it lie" is an answer like any other: it does what the fiction makes likely for that kind of pull, and it never duplicates another answer. Under the land's pull (and the pulls that read like it: a remembered landscape, a custom's ask, absence) inaction lets the land win, so the custom changes and no give-way answer is offered beside it. Under a neighbour's pull inaction lets it spread. Under a memory it fizzles and the pull dies.
- Holding fast is delay only: the pull goes back at half strength and rebuilds while its source persists. No prosperity cost: prosperity as a shown number goes with 6SL.6, where it becomes condition strands, so "custom strain is pressure" means exactly that the land keeps pulling.
- The third course comes from a lens per cause of change (the 4SD.4 pilot). Scarcity keeps the reason and swaps the material (readings 0.7, about 0.3, material 0): under the land's pull, the value nearest the held one by what it does and is about that the land prefers over it, "keep the meaning, change the means". Upheaval keeps the material and changes the reason (material 0.7, about 0.3, readings 0): under a neighbour's pull, the value nearest theirs by what physically happens and nearest yours by meaning, "take their way, keep your reason". Offered only at the web's near threshold (600), chosen over 500 and 400: rare and close, a true compromise or nothing. Never on an add that displaces nothing.
- Memory offers restore or hold; land-like pulls offer hold and the third course; a neighbour's offers forbid and the third course. Two or three answers plus let-it-lie.

## Scope

- Shipped alongside the core, because no other task carries them: absence (a per-part `empty` affinity, so the desert can pull the greatest power towards unwed and the steppe a holy place towards no image, as a drop of the last member); livelihood pulling descent and residence through a corpus table (large herds and the plough towards the father's line and the husband's kin, hoe crops and women's labour towards the mother's line and the wife's kin, herds towards the youngest heir and the plough the eldest; Aberle 1961, Ember and Ember 1971, Holden and Mace 2003, Boserup 1970), with descent's terrain affinities retired; past landscapes (a band counts the steps it lives on each land, and a land it lived on pulls as the seat would at half strength scaled by the share of its life spent there; a daughter band inherits the count).
- Moved out: a marriage rule with no qualifying band in reach to 6SL.17, which resolves marriage's partner rules against the band tree; settledness as a pull to 4SD.11; the food channel's prosperity tuning to 6SL.6.

## Strengths

Placeholders, sized against the old drift rate and accepted as measured.

- Land, ordinary part: 2 × (affinity gain of the best candidate over the held value) × nearness in the web, plus 1 if the held value is resisted and 2 if excluded. A band fishing in the desert feels about 5 a step; a value merely favoured over an allowed one about 0.5. A set: the same for the best member to add, measured against the mean affinity of what is held; a drop of 2 × (1 − affinity) for each resisted member above the minimum size; a drop towards emptiness where the part's `empty` affinity beats a member's, shared across the members.
- Neighbour: 1 × contact weight a step for each differing part; an add for each member they hold and the band lacks; a drop at half for each member the band holds and they lack.
- Memory: 0.3 a step for each lost value that could return (spike 3w: rarely enough to come back alone). Livelihood on descent: 0.6 for line and residence, 0.4 for the heir's share. Landscape: half the land's pull, scaled by the share of life spent there, from two steps on.
- Hold: 5 × conservatism, plus 1.5 for law, 1 for mediation, 1 for stone, 0.5 for voice, minus 2 after a move, never under 2.

## Result

`scripts/evidence/pressures.ts`, 200 passive runs of 15 steps:

| Measure | Value |
|---|---|
| Pressures per step, mean | 2.02 |
| Steps with none / one / two / three | 24.8% / 8.3% / 7.5% / 59.5% |
| Per step from step 1 | 0.0 0.0 0.9 2.1 2.6 2.4 2.3 2.1 2.2 2.2 2.3 2.3 2.4 2.5 2.5 |
| By source | land 61%, neighbour 32%, memory 3%, livelihood 3%, absence 1% |
| By operation | adopt 66%, add 32%, drop 2% |
| Third course offered | 11% of pressures |
| Pulls building on the band per step | 37.3, of which 3.9 past the hold and waiting |
| Custom changes per band per step | player 1.95, AI 2.27 (before: 5.1 and 5.4, silent) |
| Storylets alongside, per step | 1.14; all situations together mean 3.16, 69% of steps with three or more |

Nothing surfaces for two steps while pulls build; the empty steps are almost all those two. From step 4 the band sits at the cap most of the game. Accepted as measured: lulls are 6SL.8's job.

## Tests and fixtures

- `pressures.test.ts` covers every source, building and fading, surfacing to the cap, the three let-it-lie outcomes, holding fast, the third course, the `pressure` condition, AI resolution, answer routing and that the step spends no rng.
- The seeded passive baseline (`tests/fixtures/drift-baseline.ts`) was recaptured: drift is gone, so every band's traits after eight steps differ.
- The server test project's timeout rises to 30 seconds: a full 15-step run now costs about a second, and under a dozen parallel worker files the default 5 seconds tripped.
