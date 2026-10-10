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
