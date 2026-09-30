# 2DS.1: Gameplay-loop spike

| Prop    | Value |
|---------|-------|
| Started | 2026-09-30 |
| Branch  | `spike/gameplay-loop` |
| Status  | All five topics closed; task batch drafted for review |

A running log. Every entry under Decisions was made by Jason; nothing is recorded there until he has decided it. Evidence sections are observations only.

## Agenda

Order chosen by Jason: premise first, each later topic inheriting the earlier answers.

1. [x] Premise
2. [x] Victory conditions
3. [x] Loop shape and pacing (eight eras of three actions)
4. [x] The six mechanics: Hold, Reform, Teach, Consolidate, Daughter band, Migrate
5. [x] Derivation of condition, strain and action-budget states

## Premise

Version 2, approved by Jason on 2026-09-30 after 1f to 1h reframed the player. A design statement: the spirit is never named in the game itself (1h).

> You are a spirit bound to one line among a scattering people. Leaders are born, lead and die; you remain. You remember everything you have witnessed, while each generation knows only what it has lived and what its elders passed down. Through them you answer whatever the times demand. Long after, scholars try to reconstruct what these peoples once were; their notebook is a verdict on the history you left them, never a target you were given.

Version 1, approved earlier the same day and superseded, opened "You are a lineage among a scattering people" and had the player leading the band generation after generation.

## Evidence

### Baseline: scripted play, 400 seeds

Seeds 1 to 400, start tile `startTiles(st)[seed % length]`, one fixed script per run. Score is a percentage of the 94-point maximum (47 features, 2 points each). Script: `scripts/evidence/play-styles.ts`; the pacing table below comes from `scripts/evidence/pacing.ts`.

| Play style | Mean score | SD | Correct | Wrong | Lost | Survivors | Player dies |
|---|---|---|---|---|---|---|---|
| Do nothing | 47.7% | 14.4 | 29.2 | 12.9 | 5.0 | 5.7 | 7% |
| Consolidate ×3 every era | 48.2% | 14.0 | 29.5 | 13.0 | 4.6 | 5.8 | 0% |
| Hold 3 still-ancestral customs (strained first) | 50.9% | 15.9 | 30.0 | 11.4 | 5.6 | 5.6 | 13% |
| Daughter band when prosperity ≥ 4, else consolidate | 56.3% | 14.7 | 32.8 | 12.4 | 1.9 | 9.3 | 0% |
| Reform up to 3 straining parts to the land's favourite | 44.1% | 16.8 | 28.0 | 13.9 | 5.0 | 5.7 | 0% |
| Migrate every era, consolidate ×2 | 46.7% | 14.6 | 29.0 | 13.7 | 4.3 | 5.7 | 0% |
| Teach when possible, else hold | 52.4% | 16.9 | 30.3 | 10.7 | 6.0 | 5.5 | 12% |

Same-seed comparison against doing nothing:

| Play style | Better | Worse | Equal |
|---|---|---|---|
| Consolidate ×3 | 20 | 6 | 374 |
| Hold 3 | 234 | 154 | 12 |
| Daughter band | 281 | 109 | 10 |
| Reform strain | 158 | 217 | 25 |
| Migrate always | 183 | 199 | 18 |
| Teach else hold | 258 | 135 | 7 |

Observations:

- Seed variance (SD about 14 points) is larger than the gap between doing nothing and the best script (8.6 points). The scripts are crude; a thoughtful human should beat them.
- Consolidate changes the final score on 26 of 400 seeds. It buys survival only, and three consolidates an era take the death rate to 0%.
- Daughter band is the strongest single lever: it cuts unrecoverable features from 5.0 to 1.9 by adding witnesses.

### Pacing: what changes era by era with no orders, 400 seeds

Figures are for the player's band while it is alive, except the last three columns, which are for the whole world.

| Era | Parts changed | Original parts still kept | Parts straining | Prosperity | Bands alive | Splits | Deaths |
|---|---|---|---|---|---|---|---|
| 1 | 4.2 | 42.8 of 47 | 12.1 | 5.9 | 6.0 | 0.00 | 0.00 |
| 2 | 4.4 | 39.2 | 11.2 | 5.8 | 6.1 | 0.09 | 0.00 |
| 3 | 5.0 | 36.1 | 10.5 | 5.8 | 6.3 | 0.20 | 0.01 |
| 4 | 5.1 | 33.3 | 9.7 | 5.9 | 6.3 | 0.17 | 0.18 |
| 5 | 5.1 | 31.1 | 9.0 | 6.0 | 6.2 | 0.17 | 0.27 |
| 6 | 5.3 | 28.9 | 8.4 | 6.1 | 6.1 | 0.21 | 0.25 |
| 7 | 5.0 | 27.1 | 7.9 | 6.3 | 5.9 | 0.00 | 0.23 |
| 8 | 5.2 | 25.7 | 7.5 | 6.4 | 5.7 | 0.00 | 0.17 |

Observations:

- About five of the 47 parts change in the player's band every era, at a steady rate. After eight eras a little over half the original survives in it.
- Nothing mounts. Prosperity sits near its starting value of 6 throughout, strain eases by itself as customs drift towards the land, and the number of bands alive stays near six. Era 8 feels much like era 1.
- Splits and deaths are rare: about one of each per five eras across the whole world.

### Leader cadence arithmetic (3c)

Worked from Jason's rule: a child at 18, death anywhere from 36 to 75.

- A successor always exists and is always an adult. If the child is already dead the leader is at least 54, so the grandchild is at least 18; if the grandchild is dead too the leader is at least 72, so the great-grandchild is at least 18 and cannot yet have died.
- A reign can last anything from a few years to 57 (taking over at 18, dying at 75), so a 25-year turn can hold no handover or several.
- Up to five generations of the family are alive at once.

### Early and late, read off the decisions

Derived by Claude from the decisions above and put to Jason; he amended only the "lost for good" list (3v, and the recreated-custom question).

- Only early: moving freely through unclaimed country (3k); being recognised as kin by every band, since all share one memory (2v); leaders who lived the scattering, since a leader's memory reaches back two or three turns (3c).
- Only late: holding land, boundaries, crowding, absorption (3k, 2t); writing and the end (2n, 3j); meeting a changed kin as strangers, or taking a stranger for kin (2s, 2v); reviving what the band has lost (1g).
- Lost for good: the shared memory of the scattering, once the last leader who lived it dies. Claimed land can be abandoned (3v). Whether a lost custom can be recreated by chance was put to Jason.

### King of Dragon Pass, as the example for condition (5a)

Verified on 2026-09-30 against Failbetter's "Echo Bazaar Inspirations: King of Dragon Pass", A Sharp's overview page and the KoDP wiki's Morale page.

- Numbers only for what the clan could count (hides of pasturage, cows); moods are words such as "resolute" or "unhappy".
- Morale is three strands: the clan, the farmers, the weaponthanes.
- The Ring of advisors sits on every screen, speaks from skill, position and patron god, and never agrees; in a scene each backs an answer.
- A decision scene arrives about every other turn, from a pool of over 400, with consequences landing later.
- A computer-written saga reads like a real history.

### Where a band is, in the current build

- A band is a single point on a 9 by 7 grid, and `freeLand` (`engine.ts:218`) forbids two bands on one tile.
- That one tile's terrain sets every custom's fit and strain (`strainedFeatures`, `engine.ts:286`) and the land's richness.
- Contact is measured between points (`contact`, `engine.ts:151`), and the scholars' "different land" test reads the same single terrain.
- At most ten bands are alive at once (`trySplit`, `engine.ts:332`), so the 63 tiles never fill.
- None of the sixteen customs is about how land is held. The nearest values are "Dowry in land" (Marriage), "the boundaries of the land" (How the past is kept) and "wards the herds" (Who rules).

### Structural facts from the code

- `reconstruct` (`src/lib/sim/engine.ts:501`) reads only the cultures alive at the end. The player's band counts exactly as much as any other band.
- The truth being scored is `st.ancestral`, fixed at era 0 before the player acts. The intro screen shows it in full, along with the scholars' rules.
- When the player's band dies the game carries on to era 8 without orders and is still scored.

## Decisions

| # | Topic | Decision |
|---|---|---|
| 0a | Set-up | Branch `spike/gameplay-loop`, 2DS.1 claimed in the roadmap, this log kept as decisions land |
| 0b | Agenda | Premise, victory conditions, loop shape and pacing, mechanics, state derivation |
| 1a | Premise | The goal changes. Recoverability stops being what the player steers at during the eras; the reconstruction becomes a verdict on how they lived |
| 1b | Premise | The player pursues situational aims. No single standing goal: each era throws up pressures and the player responds as a leader would |
| 1c | Premise | The reconstruction is de-emphasised during play. It is not hidden, but it is not presented as a goal, in the way most games do not announce their score screen |
| 1d | Premise | The player is a lineage. Diegetically, a single avatar (for example the daughter) has direct experience only of the customs they have lived, plus increasingly abstract knowledge of what their parent and grandparent told them |
| 1e | Premise | An avatar is both a generation and a band member. Memory of the old ways fades with each new generation; moving to a daughter band is a further break, because the daughter carries only what she lived before leaving. The cadence of generational change is undecided and may not be one generation per era |
| 1f | Premise | Reframes who the player is: a spirit or entity attached to the band via the lineage. A single leader does not have the ability to reshape a whole culture. Decided during topic 3; the approved premise statement needs a redraft to match |
| 1g | Premise | The spirit remembers everything. The leader and the band keep the memory rules of 1d and 1e |
| 1h | Premise | The spirit is a frame only: never named or shown in the fiction, simply the reason one player guides many generations |
| 2a | Victory | There is no victory as such: this is primarily a narrative game and the notebook is the only ending. You are only ever attached to the grouping you are with. If that band dies you have a shorter, less rich narrative to look back on, so survival matters because it continues your game, but it is not a win state |
| 2b | Victory | The notebook is prose only: a written judgement and per-custom entries, no totals of any kind |
| 2c | Victory | The notebook must be about much more than whether the scholars can reconstruct the original belief system; otherwise it removes importance from the unique history of your band |
| 2d | Victory | At each split the player chooses whether their line goes with the daughter band or stays with the parent |
| 2e | Victory | When your band dies the game invisibly fast-forwards through the rest of history, possibly with the player watching a timelapse of the UI. The notebook accounts for the whole of history, and your culture, along with any others that did not survive to the end, is treated differently because of its shorter existence |
| 2g | Victory | The notebook is maximalist in what it explores. Its subjects are listed under Notebook subjects below |
| 2h | Victory | The leaders-into-legend strand must be shaped by time depth and by the written record |
| 2i | Victory | It must be possible for the scholars to wrongly characterise a band as being from a completely different origin. This ties to other origin bands at game start (4SD.6) |
| 2j | Victory | Probable, not yet firm: the notebook can be toggled between what the scholars believe and the actual truth. Granularity (whole notebook, per section or per item) is undecided |
| 2k | Victory | What each band knows of every other band is tracked over time. Jason counts this as a benefit of the writing idea |
| 2l | Victory | Whether something leaves material traces is worked out at the level of the individual value (custom fragment); the category level is too coarse. Some values of "The holy place" leave remains and others do not |
| 2m | Victory | In the fiction the final era is long, long before the scholars write, and bands and scholars never meet. The analogy is the reconstruction of the Yamnaya and PIE peoples; Tocharian is the model of a culture for which no living descendant gives direct knowledge. Alternative D in the writing think-through is therefore out |
| 2n | Victory | Writing is in: a custom, arriving late, in grades. A culture can have early writing and still leave no full record, and the cliff between bands that died before writing and after it is acceptable as flavour. How it is gated is open: a general prerequisite structure for customs (akin to a storylet system) or a one-off gate, to be decided in topic 3 with where era pressures come from |
| 2o | Victory | For the MVP nothing changes between the final era and the notebook. The scholars have perfect knowledge of the end state but no direct conversation: they cannot ask the survivors about other cultures and rely only on what was recorded. Simulating the passage of time between game end and the scholars is a future addition, out of scope for this phase |
| 2p | Victory | For a band that left no living line the scholars can draw on four kinds of evidence: material remains, others' writing about it, its own writing, and tales among other peoples |
| 2q | Victory | At the close, 5RC.1 and 5RC.2 are both rewritten to describe the evidence model decided here (2k, 2l, 2n, 2p) |
| 2r | Victory | The player sees no reference to anything about the notebook during play. This tightens 1c |
| 2s | Victory | Knowledge (2k) is tied to the chronological point at which it was gained. So this can occur: Band A encounters Band B; several ages elapse with no contact, in which B changes significantly; the two meet again and A does not realise this is the band it met in an earlier age |
| 2t | Victory | Besides band death and the last era, a run can end by absorption, and the player may also choose to stop. Absorption needs a robust and transparent mechanic for deciding which band absorbed which, and a ruling on whether an equal merger differs from an absorption. Player-as-lineage is the guiding principle; the test for any such event is "after the event, does the player's lineage still have authority?" |
| 2u | Victory | The fast-forward after band death is a timelapse of the world: the map plays forward and the player sees everything, including what their band never knew |
| 2v | Victory | Recognition between bands works by resemblance, in grades: a band judges each meeting against its dated records. A close match is taken for the same people, a partial match for their kin, a poor match for strangers. True identity is never consulted |
| 2w | Victory | When a band's earlier identification turns out wrong (A took C for B, then meets the real B, which matches A's oldest record better), the best match across all dated records wins and A corrects itself, re-filing C as kin of B. This needs really robust provenance tracking, so that the scholars can spot paradoxes and the truth toggle can explain what happened |
| 3a | Loop | An era's situations come from both layers: pressures read from the state of the simulation, always present, with authored storylets firing on top when their prerequisites are met |
| 3b | Loop | A turn is roughly 25 years |
| 3c | Loop | For the MVP, leaders live on a strict cadence: every character has a child at 18 and can die at any age between 36 and 75, with some randomness in the date. Leadership passes to a descendant, and the age range ensures there is always one, even if a generation must be skipped. Story events may later change an individual's cadence, but this is the base level. After the MVP a more robust descent and inheritance system gets worked out. The ages of the leader's family are tracked at each point |
| 3d | Loop | Open, floated by Jason: turn lengths may vary, with a period of peace or stability letting more time pass. That would need a way to model what other bands do in that time, especially where they interact with the player's band |
| 3e | Loop | What the player attends to in a turn is, in essence, responding to environmental events and storylets in ways that reshape the culture. To be returned to in more detail |
| 3f | Loop | Whether the player can act unprompted is undecided. If they can, the action is still shaped and constrained by the circumstances of the band |
| 3g | Loop | The length of a run is decided after the other first principles are established. It is dictated by satisfying gameplay and is not set arbitrarily |
| 3h | Loop | The arc of a run is emergent. No shape is written in; it comes from state piling up |
| 3i | Loop | Pressure behaves like weather: peaks and lulls, with no climb towards the end |
| 3j | Loop | "History arrives" is the main assumed ender: the run closes once written record has begun. If territory is implemented, a settled, territory-owning group is much more likely to develop writing, which hastens the same clock. "A power from beyond" is the fallback, based on a sky clock, designed to fire only if history has (a) not arrived after a long time and (b) seen no recent progress towards it |
| 3k | Loop | Territory is a gated custom. Every band starts as a wandering point; a band that meets the prerequisites begins to claim tiles, so wanderers and settlers share the map. A band keeps a single seat, a home tile that sets fit and strain exactly as now; claimed tiles affect only contact, ownership and crowding |
| 3l | Loop | No standing menu. Every choice is an answer written for a situation, and nothing can be started unprompted (this settles 3f). Answers are derived from various sources: ones carried by the storylet, combinations of existing customs, ancestral customs, things learned from neighbours, things provoked by the environment, and more |
| 3m | Loop | Provisional, held open in case a counter-example arises: "let it lie" is always offered, and drift then decides |
| 3n | Loop | In general, the band's own state decides which answers exist |
| 3o | Loop | No budget: the player may answer everything that arises |
| 3p | Loop | The number of situations follows the weather: none in a lull, several in a storm. Open: how migration works under this, and what keeps lulls fun |
| 3q | Loop | Provisional, held open: the world moves in fixed 25-year steps for every band, and a step that brings the player's band nothing is recorded in a line and passed over, so a long turn (3d) is a run of quiet steps |
| 3r | Loop | One prerequisite structure: storylets, writing and territory all gate on the same kind of conditions |
| 3s | Loop | Migration is nuanced. A move can be forced by events, and a move can be initiated by the player, but a player-initiated move must always be diegetically justified or carry a consequence. This qualifies 3l: a move is something the player can start |
| 3t | Loop | Lulls: fine weather offers opportunities (a feast, a marriage, teaching, a daughter band, consolidation) when the band has any; otherwise the step passes visibly as a watched lull, with drift, deaths, births and neighbours' moves as chronicle lines |
| 3u | Loop | A run is medium to long: fifteen turns or more, so 375 years and up, and save and resume (3PL.3) becomes load-bearing |
| 3v | Loop | Claimed land can be lost and regained: it can be abandoned, for environmental reasons, through raids by non-settled bands and the like |
| 4a | Mechanics | Hold: the one-turn keep stays, as the effect of an answer. Sanctifying is a possibility whose impact Jason wants thought through first. And, now that the action economy is gone, random drift is removed from player-controlled bands |
| 4b | Mechanics | Reform: an answer's effect, drawn from any of the sources in 3l, and it can bite back: a reform can provoke its own situation next step (elders resist, a faction keeps the old way, a schism threatens) |
| 4c | Mechanics | Teach is gone as a separate action. Its effects may survive through storylet choices and the like |
| 4d | Mechanics | Consolidate: an answer's effect. Some situations offer a cautious answer whose effect is condition gained |
| 4e | Mechanics | Confirmed reading of 4a: every change to the player's band's customs comes through a situation (the land or a neighbour pulling on a custom, surfaced by layer 1) or a storylet consequence, and "let it lie" resolves to the pull's own outcome. Layer 1 is the band's drift made visible. AI bands keep random drift |
| 4f | Mechanics | Sanctifying is parked: the taboo and archaism task (4SD.8) decides whether it exists and how it costs. Claude's think-through is in the log for that task |
| 4g | Mechanics | Daughter band: splits arise from pressure and from opportunity. The daughter's prosperity is always derived from a combination of the parent band's prosperity, the narrative reason for splitting and the environmental conditions of where the daughter spawns (probably a neighbouring cell) |
| 4h | Mechanics | Migrate: how a move arises is 3s. Its cost is shaped by whether the band is settled; the numbers are decided in the territory build |
| 4i | Mechanics | In the early game a move is the only act the player can start unprompted. Later stages may offer player-started acts such as settling and expanding territory. Topic 4 is open until the late-game mechanics are addressed |
| 4j | Mechanics | Late-game acts the player can start under 3s's rule: settle, expand territory, raid or conquer. Abandoning land arises only from situations |
| 4k | Mechanics | AI bands receive the same layer-1 pressures and storylets as the player, answered by a script shaped by their conservatism and drive. One system; the chronicle can report their choices |
| 4l | Mechanics | Peaceful relations (trade, alliance, marriage) are part of the late game and some are player-started. The nature and scale of peaceful actions evolve along with custom. For both peaceful and aggressive actions, the custom and development of both parties define which actions are possible |
| 4m | Mechanics | Random drift goes for all bands, amending 4e. Every custom change anywhere is a pressure answered (by the player or by a script) or a storylet consequence |
| 5a | States | Condition is several strands, partly revealed in prose, but the primary way the state is felt is through diegesis in storylets. Jason asked for an analysis of King of Dragon Pass as the example |
| 5b | States | Strain: per custom only. The per-custom fit line survives; there is no aggregate, and pressures are simply the situations of the turn |
| 5c | States | 4SD.3 (narrative action-budget state) is dropped at the close; there is no budget to derive a state for |
| 5d | States | New derived states shown to the player: recognition (2v), settledness and writing (3k, 2n), leader and generation (3c). Memory was offered and not chosen. Settledness and writing are displayed like any custom, but their category is invisible until active, which opens a design space for hidden custom categories |
| 5e | States | Condition's strands in the early game are food (the land against the customs), numbers (births, deaths, splits, absorptions) and standing (how neighbours regard you, feeding prestige in 4SD.5). New strands arise according to circumstance |
| 5f | States | No numbers, probably: the roadmap's rule stands over King of Dragon Pass's counting rule. Open to reconsideration later |
| 5g | States | Initially the leader's family is voiceless. Later, family opinion can trigger storylets |
| 3w | Loop | A lost custom value can be recreated by chance, but rarely: a value the band once held and lost is weighted down in drift unless a neighbour practises it or the land favours it |

## Notebook subjects

Every subject here was chosen by Jason under decision 2g. The scholars attempt each one and can be right, wrong or silent.

| Group | Subject | What the scholars attempt |
|---|---|---|
| Origins | The original belief system | The era-0 customs, as the current build reconstructs |
| Origins | Homeland and route | Where the people came from and how your band moved |
| Origins | The family tree | Which peoples descend from which, and where your band sits |
| Your band | Customs over time | What your line believed at different points, what it changed and when |
| Your band | Turning points | Splits, migrations, reforms, contacts, near-deaths: recovered, misread or traceless |
| Your band | Character | How your line is summed up, drawn from how it was played |
| Your band | Hard times and good | Lean and rich eras, read from gaps and abundance in the record |
| Peoples | Contact and borrowing | Inherited or borrowed, and from whom; direction can be reversed |
| Peoples | The vanished peoples | Bands that died out, known through neighbours' report and what they left |
| Peoples | Names and labels | Self-name, neighbours' name and the scholars' label |
| Peoples | Absorbed and displaced | Whom your band replaced, joined or swallowed (ties to 4SD.6, 4SD.7) |
| Peoples | How neighbours saw you | Your band as it appears in other peoples' tales |
| Peoples | Claimed descent against real | Invented or denied genealogies weighed against the evidence of custom |
| Peoples | Centre and margin | Which people the others copied and which sat at the edge (ties to 4SD.5) |
| Peoples | Teachers and pupils | Who restored what among whom; a taught band may read as an offshoot |
| Peoples | Isolation and relic peoples | Long-isolated bands treated as windows on the old ways, rightly or not |
| Peoples | Partings | When two peoples last met and when kin stopped counting each other as kin |
| Peoples | Conflict and its winners | Hostility, conquest and displacement as told by the survivors (ties to 4SD.9) |
| Peoples | Heirs | Who carries your band at the end: descendants, absorbers, a neighbour keeping one custom, or no one |
| Peoples | Mistaken origin | A band wrongly characterised as coming from a completely different origin (ties to the second founding stock, 4SD.6) |
| Time | Chronology | The order and dating of splits and changes |
| Time | Land against inheritance | Common ancestor or separate arrival because the land favours it |
| Time | Leaders into legend | Real deeds resurfacing as myth; shaped by time depth and written record (2h) |
| Scholarship | Rival schools | Competing readings of the same evidence (ties to 5RC.3) |
| Scholarship | Revivals misread | Restored customs taken for survivals, or the reverse (ties to 4SD.8) |
| Scholarship | The silences | What happened and left no trace, shown to the player alone |

## Parked

Questions raised by a decision that belong to a later topic.

- From 1b, for topic 3: where each era's pressures come from.
- From 1e, for topic 3: the cadence of generational change relative to eras.
- From 1d, for topics 4 and 5: the player's knowledge of the original is currently perfect (`gameState.ancestral` drives the "was:" marker, the kin counts and Teach). Under 1d it fades with descent, which makes remembered knowledge a candidate derived state alongside condition, strain and action budget.

- From 2j, for the UI spike (2DS.2) unless Jason wants it settled here: the granularity of the believed/true toggle.
- From 3s, for topic 4: whether the other mechanics (daughter band, teach, consolidate) can also be player-initiated under the same rule of diegetic justification or consequence.
- Topic 3, deferred by Jason until the rest of the topic is resolved: what is only possible early and only possible late in a run, including what is lost for good.
- Topic 3, raised by Jason: whether band territory expands, whether a band is only ever in one place, or whether the move to owning territory is a gated custom.
- From 2n, for topic 3: a late-arriving writing custom presumes a known game length, so when it can first appear has to be settled with pacing.
- From 2n, for topic 3: a prerequisite structure for customs could also be where each era's pressures come from (the question parked from 1b). One system, two uses; undecided.
- From 1a and 1c, for the close: existing roadmap tasks written under the old premise need re-reading. Known so far: the 5RC.2 note calls legibility to the future "a goal in itself"; 3PL.4 is a leaderboard, and under 2b the notebook has no total to rank by; 4SD.8 (deliberate archaism) assumes the player knows what was lost; `ScoreDocument` in `src/lib/types.ts` stores `total` and `max`.

## Writing: options considered

Thought through with Jason under topic 2 after he floated writing arriving late in the game.

| Option | Summary | Where it stands |
|---|---|---|
| A. Late event | Writing arrives for everyone at one moment near the end | Its cliff is welcome as flavour (2n) |
| B. Custom | Writing is a value that arises and spreads like any custom | Jason's leaning, with prerequisites gating it (2n) |
| C. Generational memory | Every band's knowledge of every other fades by generation | Pairwise knowledge is in (2k); how it reaches the scholars is open |
| D. Scholars' writing | Outsiders record what the living say | Out: bands and scholars never meet (2m) |

## Proposed task batch

Drafted by Claude from the decisions above, for Jason's review before anything touches the roadmap. Nothing here is decided until he approves it. IDs are provisional and follow the roadmap's `<milestone><letters>.<n>` pattern.

### Two structural proposals

1. **A new milestone, M6 "The situation loop"** (approved by Jason). The loop rebuild is the phase's new critical path and does not fit M4's "deepen the drift model" goal. Suggested goal: "Replace the order menu with situations and answers, so that every change in a band's customs is something somebody saw happen."
2. ~~An MVP line.~~ Offered and declined: no MVP flag is recorded, and ordering comes from dependencies alone.

### M2 Design spikes: changes

| ID | Change | From |
|---|---|---|
| 2DS.2 | Dependencies become 2DS.1, 4SD.2, 6SL.6. Notes gain: display of the new states in 5d, the notebook toggle granularity (2j), the timelapse (2u), and what a watched lull shows (3t) | 5c, 5d, 2j, 2u, 3t |
| 2DS.3 (new) | Design the scholars' notebook: visual layout, mechanical behaviour and prose structure. Prose only (2b); the subjects table, combined or spread as the design finds best; the believed/true toggle (2j); how an early death reads (2e). Depends on 2DS.1 | 2b, 2c, 2e, 2g, 2j |

### M3 Persistence: changes

| ID | Change | From |
|---|---|---|
| 3PL.4 | Left untouched for now, until the notebook design (2DS.3) says what a finished run yields. `ScoreDocument` stores `total` and `max` today | 2b |

### M6 The situation loop (new)

| ID | Task | Depends on | From |
|---|---|---|---|
| 6SL.1 | World step and leaders: a fixed 25-year step for every band; leaders with a child at 18 and death between 36 and 75; family ages tracked; succession to the nearest adult descendant | 2DS.1 | 3b, 3c, 3q |
| 6SL.2 | Remove the order menu and the action budget; an era becomes situations, answers, step | 2DS.1 | 3l, 3o |
| 6SL.3 | Layer 1 pressures: surface the land's and neighbours' pull on a custom as a situation with written answers, replacing random drift for all bands; "let it lie" resolves to the pull; a lost value returns rarely | 6SL.2 | 4a, 4e, 4m, 3m, 3w |
| 6SL.4 | Answer effects: one-turn keep, reform from any source, condition gained; reform can bite back with a follow-up situation | 6SL.3 | 4a, 4b, 4d |
| 6SL.5 | Prerequisite structure and storylet engine: conditions on world and band state, firing, answers and consequences; one structure for storylets, writing and territory | 6SL.2 | 3a, 3r |
| 6SL.6 | Condition as strands (food, numbers, standing) felt through situations, with death and split thresholds; new strands by circumstance. Replaces 4SD.1 | 6SL.3 | 5a, 5e, 5f |
| 6SL.7 | Scripted answers for AI bands, shaped by conservatism and drive; chronicle reports them | 6SL.3 | 4k |
| 6SL.8 | Weather and lulls: situation count by pressure; fine-weather opportunities; watched steps with chronicle lines | 6SL.3, 6SL.5 | 3i, 3p, 3t |
| 6SL.9 | Band memory: what the people remember of each custom's past fades by generation and breaks at a split; the spirit's view stays complete; ancestral answers draw on what the band remembers | 6SL.1 | 1d, 1e, 1g, 3l |
| 6SL.10 | Daughter band as an outcome of pressure or opportunity, daughter condition derived from parent, reason and land; the player chooses which branch to follow | 6SL.6, 6SL.8 | 2d, 4g |
| 6SL.11 | Moves: forced by events or player-started with justification or consequence; cost by settledness | 6SL.3 | 3s, 4h, 4i |
| 6SL.12 | Storylet corpus, first batch: enough authored storylets for a medium run, including reform bite-back and the first grade of writing | 6SL.5 | 3a, 2n |
| 6SL.13 | Run ending: history arrives once written record begins; sky-clock fallback with a power from beyond when writing has stalled; the player may stop; timelapse of the world to the notebook | 6SL.5, 4SD.12 | 3j, 2t, 2u |
| 6SL.14 | Intro and framing rewrite: no scholars, no rules, no goal; the spirit unnamed | 6SL.2 | 1c, 1h, 2r |
| 6SL.15 | New displayed states derived: recognition, settledness and writing as hidden custom categories, leader and generation (display itself is 2DS.2) | 6SL.1, 4SD.11, 4SD.12 | 5d |
| 6SL.16 | Family opinion as a storylet trigger | 6SL.12 | 5g |

### M4 Simulation depth: changes and additions

| ID | Change | Depends on | From |
|---|---|---|---|
| 4SD.1 | Removed; 6SL.6 replaces it outright. 2DS.2 and 4SD.5 re-wired to 6SL.6 | | 5a |
| 4SD.2 | Rewritten: remove the aggregate strain count; the per-custom fit line is all that remains | 6SL.3 | 5b |
| 4SD.3 | Dropped. 2DS.2 re-wired | | 5c |
| 4SD.5 | Prestige now reads the standing strand of 6SL.6 | 6SL.6 | 5e |
| 4SD.8 | Re-read: decides whether sanctifying exists and how it costs (think-through in this log); revival draws on the spirit's memory against the band's | 6SL.9 | 4f, 1g |
| 4SD.9 | Rewritten: raids, conquest and absorption, and peaceful relations (trade, alliance, marriage), some player-started; possible actions defined by both parties' custom and development; absorption judged by whether the lineage keeps authority; equal merger ruled on | 4SD.11, 6SL.5 | 2t, 4j, 4l |
| 4SD.11 (new) | Territory as a gated custom: every band starts as a wandering point and keeps a seat; settling, expanding and abandoning land; claimed tiles affect contact, ownership and crowding only | 6SL.5 | 3k, 3v, 4j |
| 4SD.12 (new) | Writing as a gated custom in grades, from tallies to full record; a settled band reaches it sooner; what each grade fixes in the record | 6SL.5, 4SD.11 | 2n, 3j |
| 4SD.13 (new) | Dated knowledge between every pair of bands: what each knows of each other and when; recognition by graded resemblance; self-correction on a better match; provenance robust enough to expose paradoxes | 6SL.1 | 2k, 2s, 2v, 2w |
| 4SD.14 (new) | Material traces tagged value by value across the corpus | 4SD.10 (soft) | 2l |

### M5 Reconstruction: changes and additions

| ID | Change | Depends on | From |
|---|---|---|---|
| 5RC.1 | Rewritten: the evidence model. Scholars know the end state perfectly and cannot converse; for a vanished band they have material remains, others' writing, its own writing and tales among other peoples; the chronicle is one record among several | 4SD.12, 4SD.13, 4SD.14 | 2o, 2p, 2q |
| 5RC.2 | Rewritten: attestation derived from the evidence model, band by band and value by value; the "goal in itself" note removed | 5RC.1 | 2q, 1a |
| 5RC.5 (new) | Build the notebook to 2DS.3's design: prose only, the subjects table, the believed/true toggle, mistaken origin possible, early deaths treated by their evidence | 2DS.3, 5RC.2, 5RC.3 | 2b, 2g, 2i, 2j |

### Evidence scripts

Committed under `scripts/evidence/` per Jason's choice at the close.

### Out of scope for this phase

| From | Future work |
|---|---|
| 2o | Simulate the passage of time between the final era and the scholars |
| 3c | A more robust descent and inheritance system for leaders, replacing the strict MVP cadence |

### Details left for the tasks above

- Notebook design, set by Jason: how "treated differently" (2e) reads in prose for a band that died early.
- Notebook design, set by Jason: 26 subjects does not mean 26 sections. Subjects can be dealt with in combination or spread across other subjects.
- Intro rewrite, raised by 2r: the intro screen is currently all about the scholars and their rules. Whether it counts as "during play" has not been asked.
- 3a and 2n together: the option Jason chose for 3a described storylet prerequisites as the gate for customs such as writing. He has not separately confirmed that as the answer to the gating question in 2n.
- For 4SD.8, from 4f: sanctifying with no random drift in the player's band would stop pressure arising on that custom (or bar the "change it" answers), turn a recurring decision into a one-off, drain condition steadily if the custom strains against the land, seed storylets (heresy, a faction wanting the rule lifted), give the scholars an unbroken line for that custom and the "revivals misread" trap, and could make some AI bands relic peoples.
- 2p and 2o together: tales among other peoples have to reach the scholars without conversation. The reading that fits both is that a tale survives as part of a surviving people's end-state customs. Not confirmed by Jason.
