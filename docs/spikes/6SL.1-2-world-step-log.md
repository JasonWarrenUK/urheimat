# 6SL.1 and 6SL.2 log

Decisions made with Jason while building the world step, leaders and the situation shell. Each entry records what he decided; the spike they rest on is `2DS.1-gameplay-loop.md` (3b, 3c, 3l, 3o, 3q).

## Set-up

- One branch, `feat/world-step`, 6SL.1 first then 6SL.2, one PR.
- 6SL.2 delivers the shape and the step: the order menu, action budget, reform picker, teach, consolidate and daughter-band buttons go; a step control advances the world; the era screen shows a situations list (empty until 6SL.3 and 6SL.5) and the step's chronicle; migrate stays as the one player-started act (spike 4i).

## 6SL.1: the step and the leaders

- The era becomes the 25-year step: one `endEra` call is 25 years, year 0 is the scattering, and the cap (`maxEra`) is 15 per spike 3u, pending 6SL.13's ending.
- Lifespans: death drawn uniformly from 36 to 75 at birth. Founders at the scattering are aged 18 to 45.
- Fertility: a first child at 18; then, while under 45, each further child with halving odds (one half, one quarter, one eighth) at a gap of 2 to 8 years, drawn at birth; a child due after the parent's death is not born. The spouse is assumed the leader's age.
- The family is a tree, bounded: only the leader, the leader's siblings and the descendants of either bear tracked children. Everyone else in the tree stays, alive or dead, and their further children are the untracked band. Without the bound every line breeds and a band holds tens of thousands of people within fifteen steps.
- Succession reads the band's own descent rule from the corpus by tag: `descent/heirs` decides whose children count first (the leader's own, or the leader's siblings'; the other set is the fallback), `descent/share` orders siblings (eldest or youngest first; equal means eldest for now). The nearest generation goes first. With no adult found, a kinsman of no tracked line, aged 18 to 45, takes over.
- A daughter band is founded by an adult child of the leader who is not the heir, taking their own descendants with them; failing one, a kinsman. Which branch the player follows is 6SL.10.
- Shown now: a header line naming the player's leader, their age and generation since the scattering; chronicle lines for the player's band's deaths and successions. Display proper is 2DS.2 and 6SL.15.
- Save schema 4.

## 6SL.2: the shell

- The order menu and the action budget are gone: no hold, reform, teach, consolidate or daughter-band order, no reform picker, no actions counter. A step carries a move (spike 4i: the one act a band may start unprompted) and an answer per situation, by id; nothing else can be started and there is no budget (3l, 3o).
- The player's band keeps random drift until 6SL.3 replaces it with pressures and answers, so customs still move during a run.
- The situation shape is defined now and left empty: a `Situation` has an id, a text and `Answer`s (id and text, no effect yet; 6SL.4 defines effects); `GameState.situations` holds the current step's, cleared at each step, and the screen renders "let it lie" for each (3m). 6SL.3 and 6SL.5 fill it.
- The step control reads "Let 25 years pass"; the chronicle is dated by year. The intro's facts are corrected (fifteen steps of twenty-five years, no actions); its rewrite is 6SL.14.
- Teach is gone (4c) and the player cannot order a split; daughter bands still arise for AI bands, and 6SL.10 brings them back as outcomes for the player.
- Cultures no longer carry a held set, and saves no longer need a Set-free shape beyond the rng state.
- The play-styles evidence script keeps two policies, staying put and always moving; the hold, reform, teach and consolidate policies went with the menu.

## Smoke test

- Played in a browser: intro, start picker, the step screen with no menu, one step (year 0 to 25, the leader aged 28 to 53, chronicle dated by year), no console errors beyond the favicon. The livelihood custom was moved beside the other non-rite customs so the customs tab's domain headings do not split Kinship in two.
