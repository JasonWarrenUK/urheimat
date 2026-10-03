# 2DS.3: Notebook design spike

| Prop    | Value |
|---------|-------|
| Started | 2026-10-01 |
| Branch  | `spike/notebook-design` |
| Status  | All seven topics closed; task batch approved by Jason and applied to the roadmap |

A running log. Every entry under Decisions was made by Jason; nothing is recorded there until he has decided it. Evidence sections are observations only.

Inherits from 2DS.1 (`docs/spikes/2DS.1-gameplay-loop.md`): decisions 1a, 1c, 2b, 2c, 2e, 2g, 2h, 2i, 2j, 2m, 2o, 2p, 2r, 2u and its Notebook subjects table.

## Agenda

Order chosen by Jason: purpose first.

1. [x] Purpose: what reading the notebook does for the player
2. [x] Scope: where 2DS.3 ends and 2DS.2 begins
3. [x] Prose structure: grouping the 26 subjects; the scholars' voice
4. [x] Believed/true toggle: whether it exists, then how
5. [x] Early death: how a band that did not survive reads
6. [x] Layout, wireframe level only (2b)
7. [x] Run yield: what a finished run leaves behind (agenda item or parked, decided when reached)

## Evidence

### The notebook in the current build

`src/lib/components/ReconstructorNotebook.svelte`, fed by `reconstruct()` (`src/lib/sim/engine.ts:501`).

- Opens "Three thousand years on" with the number of surviving peoples and whether the player's band is among them.
- Shows a score (`result.total` of `result.max`) and counts of parts recovered, reconstructed wrongly and unrecoverable. 2b rules out all three.
- One entry per custom (16), grouped by domain. Each shows the reconstructed form with an asterisk, then an "In truth" line with the real era-0 form, always visible.
- Under each custom, one line per part (47 in all): a verdict (secure, doubtful, wrong, lost), a per-part points figure and a generated note naming the witnesses ("the X, the Y: different land, never met").
- Covers one subject of the 26 only: the original belief system.
- The chronicle line when the player's band dies reads "Your testimony ends here" (`engine.ts:483`), which names the reconstruction during play; 2r rules that out.

### What the game state can feed today

From `GameState` and `Culture` in `src/lib/types.ts`.

| Exists now | Not stored |
|---|---|
| Every band's current customs (`traits`) | Any band's customs at an earlier era |
| The era-0 truth (`ancestral`) | Any band's position at an earlier era (routes) |
| Each band's `parent`, `bornEra`, `diedEra` | Who borrowed what from whom |
| One snapshot per band of what the player last saw of it (`known`, `knownEra`) | What each band knows of each other band (4SD.13) |
| The chronicle as plain text lines (`log`) | Material traces (4SD.14), writing (4SD.12), territory (4SD.11) |
| Current position and terrain | Leaders, families, reigns (6SL.1) |

### The 26 subjects against their data

Which task supplies what each subject needs. "Now" means today's state could support a first version.

| Subject | Needs | Supplied by |
|---|---|---|
| The original belief system | End-state customs, contact | Now |
| Homeland and route | Position history | Not on the roadmap |
| The family tree | Parentage | Now (`parent`) |
| Customs over time | Custom history per band | Not on the roadmap |
| Turning points | Dated events | Partly now (chronicle text); structured events not on the roadmap |
| Character | How the line was played | 6SL.2 to 6SL.4 (answers chosen) |
| Hard times and good | Condition over time | 6SL.6 |
| Contact and borrowing | Source of each change | 6SL.3, 6SL.4 |
| The vanished peoples | Four evidence kinds | 5RC.1, 4SD.12, 4SD.13, 4SD.14 |
| Names and labels | Self-name, neighbours' names | 4SD.13 (in part) |
| Absorbed and displaced | Absorption events | 4SD.9 |
| How neighbours saw you | Others' knowledge of you | 4SD.13 |
| Claimed descent against real | Claimed genealogies | Not on the roadmap |
| Centre and margin | Prestige | 4SD.5 |
| Teachers and pupils | Restorations | Teach is gone (2DS.1, 4c); storylet effects (6SL.12) |
| Isolation and relic peoples | Contact over time | 4SD.13 |
| Partings | Last meeting, recognition | 4SD.13 |
| Conflict and its winners | Raids, conquest | 4SD.9 |
| Heirs | Descent and absorption at the end | Now (descent); 4SD.9 (absorption) |
| Mistaken origin | Second stock | 4SD.6, 5RC.4 |
| Chronology | Dated splits and changes | Partly now (`bornEra`, `diedEra`) |
| Land against inheritance | Terrain fit, contact | Now |
| Leaders into legend | Leaders, writing | 6SL.1, 4SD.12 |
| Rival schools | Competing hypotheses | 5RC.3 |
| Revivals misread | Revival, archaism | 4SD.8 |
| The silences | Everything, against what survived | Depends on all the above |

Observations:

- Five subjects have data today; most of the rest wait on M6 or M4 tasks.
- Three subjects need history nobody is yet tasked to record: position history (route), custom history per band (customs over time) and claimed genealogies.

## Decisions

| # | Topic | Decision |
|---|---|---|
| 0a | Set-up | Branch `spike/notebook-design`, 2DS.3 claimed in the roadmap, this log kept as decisions land |
| 0b | Agenda | Purpose, scope, prose structure, the believed/true toggle, early death, visual layout, run yield |
| 0c | Set-up | The pending roadmap status sync after 2DS.1 was committed to `main` before branching |
| 1a | Purpose | Three purposes are required at once, through the scholars/true toggle: a mirror (how your band is remembered, misremembered or forgotten), a reveal (the gap between what the scholars believe and what happened) and a saga (a readable history of the run in the scholars' voice). Teaching the player how evidence survives, to inform a later run, is unimportant |
| 1b | Purpose | Floated by Jason, to be considered: the notebook has chapters. It opens on an introduction giving a high-level, world-scope summary. A reader who wants more goes to a table of contents, and from there to detailed world summaries and to per-band or per-culture chapters. How the toggle interacts with this is to be worked out |
| 1c | Purpose | Your band's chapter is signposted for the player only: the scholars treat it like any other band, and the UI marks it as yours. Two cases still need handling: sibling bands, and bands that are now separate but were one people for a long time |
| 1d | Purpose | The scholars cite their sources. The true side does not need to |
| 1e | Purpose | The true side recounts the run in full, as a history in its own right, so that the player is reminded of what truly happened and the reveal can land |
| 1f | Purpose | The true side tells everything: an omniscient history of the whole world and every band, beyond what the player's line witnessed |
| 1g | Purpose | How the scholars' errors feel varies with the error: a lost custom can be sad, a confident misreading funny, an erased people unjust |
| 2a | Scope | Split at visuals. 2DS.3 owns the notebook's structure, prose and toggle behaviour (granularity included). 2DS.2 owns its visual design (look, typography, mobile) alongside the rest of the UI |
| 3a | Prose | 1b is adopted as the structure: a world-scope introduction; a table of contents; detailed world summaries; per-band or per-culture chapters |
| 3b | Prose | "Structure A, but filtered through D on the scholar side." A: one chapter per band that ever existed; shared history lives in the parent's chapter, and a daughter's chapter starts at the split and points back. D: the scholars' chapters follow the peoples they believe existed, which can be wrong. Claude's reading, put to Jason with 3c: the true side has a chapter per real band; the scholar side applies the same shape to the peoples and splits the scholars believe in. Jason did not amend that reading |
| 3c | Prose | Subjects by place. World summaries: homeland and route; family tree; chronology; land against inheritance; contact and borrowing (the web); centre and margin; isolation and relic peoples; conflict and its winners; mistaken origin; rival schools. Band chapters: the original belief system ("a band trait, not a world trait, especially when we introduce extra starting bands"); customs over time; turning points; character; hard times and good; names and labels; how neighbours saw them; claimed descent against real; absorbed and displaced; teachers and pupils; partings; heirs; leaders into legend; revivals misread. A vanished band gets a band chapter like any other, with thinner sources (detail in topic 5). The silences are true-side only, spread through every chapter wherever something left no trace |
| 3d | Prose | The introduction is the world saga plus a hook: the arc of the world, ending on a pointer into your band's chapter |
| 3e | Prose | The hook is a UI link: the scholars' introduction ends normally, and a signposted link to your band's chapter follows it, outside the prose. 1c holds |
| 3f | Prose | The scholar side is written by one named scholar, with a personality and biases that colour their readings |
| 3g | Prose | The scholar is drawn from a small authored cast, so a player meets the same few over many runs |
| 3h | Prose | A scholar's biases tip close calls only; clear evidence reads the same for every scholar |
| 3i | Prose | The true side has a distinct omniscient voice, in its own register and set apart from the scholar, so that toggling feels like changing books |
| 3j | Prose | Rival schools are the other members of the cast: the scholars not writing this run appear as the opposing school, cited by name |
| 4a | Toggle | The toggle is firm, settling 2j: the notebook has a scholars' side and a true side, and the player switches between them |
| 4b | Toggle | Granularity is the whole notebook: one switch swaps the entire book, contents page included |
| 4c | Toggle | The notebook opens on the scholars' side: the verdict first, the truth on turning over |
| 4d | Toggle | Flipping always lands on the other book's contents page |
| 4e | Toggle | The true book remarks on the scholars' errors in its omniscient voice (for example, "the scholars would later take them for kin of the Ashfolk"). The scholars' book does not point at the true book |
| 4f | Toggle | The purposes map onto the books so: the mirror is the scholars' book; the reveal is the true book's remarks (4e) plus the player's own comparison; the saga is both books, each a history in its own voice (3f, 3i). Settles the parked 1a questions |
| 5a | Early death | A band that left no evidence at all has no chapter in the scholars' book; it lives only in the true book. Jason added that inference from a gap (scholars sensing that some people must have been there) suggests the kinds of evidence a scholar can consider should widen beyond 2p's four |
| 5b | Early death | The wider evidence list is recorded here as undecided candidates only (see Evidence kinds: candidates); 5RC.1 decides |
| 5c | Early death | A vanished band with some evidence gets a scholars' chapter of the usual shape, shorter, with the scholar hedging each claim by the kind of evidence it rests on |
| 5d | Early death | Nothing extra marks the player's own band dying early: its chapter is signposted as usual (1c) and simply ends where it ends |
| 6a | Layout | The UI signposts your line as a trail: every chapter your line passed through, in order (for example, "Your line: the Reedfolk → the Ashfolk") |
| 6b | Layout | Band chapters on a contents page are ordered as a family tree, each nested under the band it split from; on the scholars' side the tree is the one the scholars believe in (3b) |
| 6c | Layout | The contents page lists the world summaries first, then the band tree |
| 6d | Layout | The book switch sits on every page, always in the same place |
| 6e | Layout | Inside a band chapter: a chronological narrative first, then short thematic sections (for example names, customs at the end, heirs) |
| 6f | Layout | A chapter page links back to the contents, to its parent and daughter chapters, and from every band named in its prose to that band's chapter. No previous/next stepping |
| 7a | Run yield | The leaderboard is replaced by an archive of past runs: each finished run kept as a record (people, seed, how it ended), with no ranking |
| 7b | Run yield | An archived run keeps what is needed to rebuild its notebook on demand, not the text. The player can reopen it |
| 7c | Run yield | Sharing an archived notebook with someone else is future work, out of scope for this phase |
| 2b | Scope | Topic 6 stays, as layout at wireframe level only: which pages exist, what sits on each, where the toggle lives. The look stays with 2DS.2 |

## Evidence kinds: candidates

Offered by Claude under 5b. None is decided; 5RC.1 chooses. They would sit beside 2DS.1's four (material remains, others' writing, own writing, tales among other peoples).

- Inference from gaps: land unaccounted for, a displacement in neighbours' movements
- Orphan borrowings: a custom among the living with no known source
- Place-names
- Genetic or physical traces in descendants
- Absorbed remnants: a custom surviving inside the band that absorbed them

## Proposed task batch

Drafted by Claude from the decisions above. Approved by Jason as drafted on 2026-10-03 and applied to the roadmap.

### Changes to existing tasks

| ID | Change | From |
|---|---|---|
| 2DS.2 | Notes lose "the granularity of the notebook's believed/true toggle"; gain "the notebook's visual design (look, typography, mobile) over 2DS.3's wireframes" | 2a |
| 2DS.3 | Description narrowed: structure, toggle behaviour, prose and wireframe-level layout of the notebook. Marked done | 2a, 2b |
| 3PL.4 | Rewritten: "Archive of finished runs: unranked records (people, seed, how it ended), each able to rebuild its notebook on demand". `ScoreDocument` loses `total` and `max`. Depends on 3PL.2, 5RC.5 | 7a, 7b |
| 5RC.1 | Notes gain: widen the evidence kinds beyond 2p; candidates in this log | 5a, 5b |
| 5RC.5 | Rewritten as the notebook shell: two books, whole-book switch on every page, opens on the scholars' side, a flip lands on the other contents page; introduction with UI link and your line's trail; contents with world summaries then band tree; chapter links (contents, parent and daughters, inline mentions). Deterministic from the stored run. Depends on 2DS.3 only | 3a, 3d, 3e, 4b to 4d, 6a to 6f, 7b |
| 6SL.14 | Notes gain: remove the "Your testimony ends here" chronicle line (`engine.ts:483`) | 2r |

### New tasks

| ID | Task | Depends on | From |
|---|---|---|---|
| 4SD.15 | Record history: each band's custom changes, positions and structured events by step, for both books to draw on | 6SL.1 | 1e, 1f; Evidence above |
| 5RC.6 | The scholars' book: one named scholar from a small authored cast, biases tipping close calls; sources cited; rival schools as the other cast members, named; chapters over the peoples and tree the scholars believe in; vanished bands shorter and hedged by evidence kind; no chapter for a band with no evidence | 5RC.5, 5RC.2, 5RC.3 | 1d, 3b, 3f to 3j, 5a, 5c |
| 5RC.7 | The true book: a distinct omniscient voice telling every band's full history; band chapters as narrative then themes; remarks on the scholars' errors; the silences | 5RC.5, 4SD.15 | 1e, 1f, 3c, 3i, 4e, 6e |

### Out of scope for this phase

| From | Future work |
|---|---|
| 7c | Sharing an archived notebook with someone else |

⚠️ Breaking change: removing `total` and `max` from `ScoreDocument` changes a stored document shape; the 3PL.4 build should flag it.

## Parked

Questions raised by a decision that belong to a later topic.

- ~~From 1a, for topic 4: whether the toggle is firm.~~ Settled by 4a.
- ~~From 1a, for topics 3 and 4: how the three purposes map onto the two sides.~~ Settled by 4f.
- ~~From the topic 1 aspects list, for topic 3: what the introduction alone must do.~~ Settled by 3d.
- ~~From the topic 1 aspects list, for topic 7: whether a notebook is kept, revisited or shared.~~ Settled by 7b and 7c.
- ~~From 1c, for topic 3: sibling bands and long-shared histories.~~ Settled by 3b.
