# Urheimat PHASE_1: Roadmap Overview

**46 tasks across 6 milestones.** Files: `.claude/roadmaps.json` (machine-readable), `docs/roadmaps/PHASE_1.md` (full task list with Mermaid dependency diagram), `docs/spikes/2DS.1-gameplay-loop.md` (the design decisions most of the phase now rests on), `docs/spikes/2DS.3-notebook-design.md` (the notebook's design).

> The gameplay-loop spike (2DS.1) reported on 2026-09-30. It changed the premise, removed the order menu and the action budget, and added a sixth milestone to build the loop that replaces them. The notebook design spike (2DS.3) reported on 2026-10-03 and added three tasks. Thirty-two of the 46 tasks are blocked, nearly all of them behind M6's first steps. Eight are actionable today: 6SL.1 and 6SL.2 start the loop rebuild, 4SD.4, 4SD.6, 4SD.10 and 4SD.14 are simulation work with no remaining design question, 5RC.5 builds the notebook shell and 3PL.5 adds the data-layer integration tests. The 2DS.3 pull request is not yet merged.

---

## What we're building

Urheimat came out of the port as a complete, playable game with no remote, no persistence and no audience. Its loop was a menu: three orders an era from six, a prosperity number and a count of straining customs, then a scored reconstruction at the end that the player was told to play towards. The spike interrogated all of that and kept little of it.

The game is now this. The player is a spirit bound to one line among a scattering people. Leaders are born, lead and die on a 25-year step; the spirit remains and remembers everything, while each generation knows only what it lived and what its elders told it. Through those leaders the player answers whatever the times demand: pressures the simulation raises (a custom straining against the land, a stranger at the ford) and authored storylets that fire when their prerequisites are met. There is no standing menu, no action budget and no goal on screen. Pressure comes and goes like weather. Long after, scholars try to reconstruct what these peoples once were, and their notebook is a prose verdict on the whole of history, never a target the player was given.

Three things carry the argument. The first is memory: every band's knowledge of every other is dated, so a people met again after long absence may go unrecognised, and a daughter band may be taken for its parent. The second is evidence: the scholars never meet a band, so a people that died out is known only from material remains, from what literate neighbours wrote of it, from its own writing if it had any and from tales among other peoples. The third is the record itself: writing arrives late, as a custom in grades. The run ends when written record begins, because that is where prehistory ends.

## Milestone sequence and the reasoning behind it

**M1 Foundations and launch** is done: the game is public at a Vercel URL, so everything afterwards ships somewhere real.

**M2 Design spikes** holds the gameplay-loop spike and the notebook design spike, both reported, and the UI spike. The UI spike waits on condition being derived (6SL.6) and on strain losing its aggregate (4SD.2), because it cannot design the display of states whose derivation is unsettled. It also absorbs the mobile and accessibility work and must leave real tasks behind, and it now owns the notebook's visual design over the wireframes the notebook spike produced. That spike settled the notebook's structure, toggle behaviour, prose and wireframe-level layout: two books, a whole-book switch on every page, chapters per band, and a named scholar drawn from a small cast.

**M3 Persistence** is the one track independent of the redesign: save and resume, integration tests for the data layer and an archive of finished runs. Save and resume matters more than it did, since a run is now medium to long. The notebook has no score, so the leaderboard became an unranked archive: each record keeps what is needed to rebuild its notebook on demand, and `ScoreDocument` loses `total` and `max` when it is built.

**M6 The situation loop** is new and is the phase's critical path. Its first tasks remove the menu and the budget, set the 25-year step and the leader cadence, and surface the land's and neighbours' pull on a custom as situations with written answers, which replaces random drift for every band. On top of that come the prerequisite structure and storylet engine, condition as strands felt through situations, scripted answers for AI bands, weather and lulls, band memory against the spirit's, the daughter band as an outcome, moves, a first storylet corpus, the run ending and the intro rewrite. It is numbered sixth because it was appended after M5 existed; it sits before M4 and M5 in every dependency.

**M4 Simulation depth** keeps the drift-model work the spike did not touch (semantic drift, prestige asymmetry, a second founding stock, substrate inheritance, corpus expansion) and gains five tasks the spikes created: territory as a gated custom, writing as a gated custom in grades, dated knowledge between every pair of bands with recognition by resemblance, material traces tagged value by value and a step-by-step record of each band's history, which today's game state does not keep. Two tasks were removed as superseded: the narrative condition state is now 6SL.6, and there is no action budget to derive a state for.

**M5 Reconstruction** is rebuilt around the evidence model. The scholars know the end state perfectly and cannot converse; what they can say of a vanished band comes from the four kinds of evidence above. Attestation is derived from that model, band by band and value by value. The scholar model still gains weighted evidence and competing hypotheses, and three new tasks build the notebook to the design spike's answer, all prose with no totals. 5RC.5 is the shell: two books and a whole-book switch. 5RC.6 is the scholars' book, written by one named scholar whose biases tip close calls only. 5RC.7 is the true book, an omniscient history of every band that remarks on the scholars' errors. The evidence kinds are also due to widen beyond the four above; candidates sit in the 2DS.3 log for 5RC.1 to decide.

## Decisions that shaped the structure

**The reconstruction is a verdict.** Nothing about the notebook is shown during play, the way most games never announce their score screen. The player's reasons for acting are the situations in front of them. This is what let the action budget go: with no target to budget towards, a player may answer everything that arises.

**Random drift is gone for everyone.** Every change in any band's customs is either a pressure answered (by the player or by a script) or a storylet consequence. Layer 1 of the situation system is drift made visible, and the chronicle can report what every band chose.

**Territory and writing are customs, not phases.** Every band starts as a wandering point with a seat tile that sets fit and strain; a band that meets the prerequisites begins to claim land, and a settled band reaches writing sooner. One prerequisite structure gates storylets, territory and writing alike, so the arc of a run is emergent rather than authored.

**The end is emergent, with a fallback.** History arrives when written record begins. If writing stalls for a long time with no progress, a power from beyond the map arrives on a sky clock instead. A player whose band dies or is absorbed, or who chooses to stop, watches a timelapse of the world before the notebook.

**Numbers leave the interface, probably.** Condition is strands (food, numbers, standing) felt through storylets, with King of Dragon Pass as the model; strain is a per-custom line with no aggregate; the actions-left counter is gone. The counting rule KoDP uses (a count for anything the clan could count) was considered and declined for now.

**M6 was appended, not inserted.** The milestone numbering convention appends; the dependency graph, not the number, says where M6 sits.

## External blockers (flag early)

None outside the author's control; the phase has no external gates. Three things are worth watching:

- **M6 is large and everything waits on it.** Sixteen tasks, most of them new systems; both M4 and M5 depend on its early steps. If the storylet engine or the pressure surfacing proves slower than expected, the whole phase slips with it.
- **Content is now load-bearing.** A medium run needs enough authored storylets (6SL.12) to keep the weather interesting, and the corpus needs material-trace tags value by value (4SD.14). Neither is engineering; both are on the critical path to a playable game.
- **Saved runs will outlive the schema.** GameState changes throughout M6 and M4, so the serialised state needs a version from the start or early saved runs will break on load as the loop is rebuilt.
