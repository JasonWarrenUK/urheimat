# 6SL.6 log

Decisions made with Jason while turning the single prosperity number into condition strands (food, numbers, standing), felt through situations, with death and split thresholds. Spike source: 2DS.1 decisions 4g, 5a, 5e and 5f.

## Shape

- The strands form a causal chain. Food feeds numbers each step; numbers is the band's size, and a band whose numbers fail dies. Standing stands apart, moved by storylets and neighbours. Chosen over independent gauges (any strand at zero kills) and over a hidden prosperity aggregate. No scale or set of values for any strand is assumed yet.

## Splits

- Numbers is one avenue to a split, never the only one. Four further avenues are in scope: hunger (food runs short for the band's numbers, so some leave to find land), quarrel (a feud, schism or rival heir ends in a split instead of a fight), open land (a thriving band sends a daughter to claim a rich free tile nearby) and standing (high regard draws followers away under their own leader; low standing drives the shamed out).
- A split normally arrives as a situation, and both accepting and refusing it carry pros and cons. Refusing while the driving pressure remains brings storylets of rising stakes, until a split happens or the pressure eases. A forced split at a threshold is rare: in general it comes from refusing again and again while the pressure mounts. Chosen as a mix of always-a-situation and threshold events.
- Split pressure reuses 6SL.3's pull: each avenue is a pull on the band that builds while its source persists, halves once it has gone and surfaces as a split situation. A refusal sends it back weakened; it rebuilds while the source lasts, and each resurfacing climbs a tier of higher-stakes storylets, the top tier being the forced split. Chosen over a separate split meter.
- Split pulls combine. If an unrelated split pull surfaces while a refused one is still rebuilding, the situation that arises draws on every live split pull at its own tier (for example numbers at tier 2 with hunger at tier 1), never one avenue alone.

## Standing

- Standing is stored per band: each other band's regard for this one, read from its dated knowledge (2k, 2s), so a stale picture gives a stale regard. The aggregate that prestige (4SD.5) needs is derived on read, never stored. The leaders' reputation within their own band is not standing; it waits as a later strand by circumstance and is the natural source of the quarrel avenue. Chosen over an aggregate alone and over modelling both now.
- Four sources move it: storylet answers, size beside the band doing the regarding, being its parent band and shared customs (2v resemblance).
- A storylet answer that moves standing always names the bands whose regard changes. One or several may be named, never none; an answer that moves standing without naming a band is an error. Chosen over spreading every deed to all bands in contact, and over scaling by closeness of contact.
- The standing split avenue as first worded (high regard draws followers away, low standing drives the shamed out) leaned on internal reputation, which standing no longer means. It is deferred to the later internal strand. Chosen over rewording it as being drawn to admirers (too close to absorption, 2t) and over folding regard into open land.
- The strands and split avenues settled so far are not a closed list. More may be added before this task ships.

## Storylet vocabulary

- The `{ prosperity: n }` consequence and condition give way to generic forms keyed by strand id: `{ strand: 'food', by: -1 }` and `{ strand: { id, below, above } }`. A strand that arises by circumstance then needs no new code. Chosen over a named case per strand. The existing answers get a table mapping each to a strand, for Jason's review.

## Death

- Death is diegetic: no `prosperity <= 0` check, but a route through strands, each shown as events in the fiction. A route reads one strand or a combination of strands (the 6SL.5 condition language), and a combination can kill where neither strand alone would.
- The usual route is a ladder, as with splits: lower tiers are situations the player can answer, each answer with pros and cons, and refusing or failing while the strands stay low climbs to a tier whose outcome is the band's end. Sudden one-off storylets that can kill (raid, plague, massacre) are deferred to a later task.
- Four routes are in scope, each a ladder: famine (adequacy stays below need after the buffer is spent), attrition (numbers fall below what the band can keep going, whatever the food), starved and shunned (food with standing) and small and shunned (numbers with standing, ending in absorption (2t) or extinction). Further routes stay later storylets.

## Food and numbers

- Food is relative, not an absolute level: the question is whether there is enough food for the population. Death and split conditions on food must therefore read food against numbers, never food alone.
- Code check: no population exists in the sim today. `prosperityStep` (`engine.ts:399`) moves prosperity by 1.1, minus 5 times the share of food-source values that fight the terrain, plus a flat terrain richness, plus 1.5 per consolidation, minus 1 after a move, clamped to [-2, 2.5]. Today's "food" is what the land and livelihood customs yield, with no reference to mouths, and prosperity mixes yield, headcount and morale.
- Food is a yield (land, terrain richness, fit of the livelihood customs) set against numbers (the headcount). Adequacy is yield against what the numbers need. Chosen over a food stock eaten down and replenished.
- A surplus carries between steps as a buffer, capped by the type of food: how well it can be preserved. A lean step spends the buffer before it becomes famine.
- Yield depends on population and on the nature of the livelihood. All four parts are in scope: a ceiling per source (yield rises with numbers up to it, then flattens, so food per head falls as numbers outgrow it), a labour floor (too few hands and a source yields under its ceiling), overuse depletion (above the ceiling, herds, the hunt and the catch lower their next ceiling for a while) and the labour custom (who works a source changes how many hands count).
- A source interacts with the land: the ceiling is set by terrain fit and richness, so a plough in forest has a far lower ceiling than a plough on open ground. The corpus already carries this as each value's terrain affinities (`strong`, `favours`, `resists`, `excludes`), which the ceiling reads.
- The surplus buffer's cap depends on preservability and on lifestyle together: a granary implies a settled band, so grain stored by a wandering band is capped far lower than the same grain stored by a settled one. Settledness is not built yet (4SD.11 territory, 6SL.15 display), so this task stands in a counter of steps spent on the current seat, with the buffer cap rising as it grows and a move resetting it. Chosen over a fixed multiplier hook and over inferring settledness from the crops held. 4SD.11's note now says to replace the counter with the real settledness custom and revisit the cap curve.
- Preservability lives as a field on each livelihood value in the corpus (for example `keeps: 'high' | 'low' | 'none'`), so a new livelihood value must say how it keeps. Chosen over deriving it from `about` tags, where an edit for another reason would silently change storage.

## Surplus storylets

- In scope: storylets that deal with the notion of surplus at its moments: the band beginning to draw on the buffer, a surplus building, the cap being reached, and so on. Four moments are in scope: surplus building, drawing on the buffer, the buffer nearly spent (where famine's ladder begins) and the cap reached. Loss of the buffer (stores rot, are raided, the herd sickens) is a sudden event and waits for a later task, consistent with the deferral of sudden routes under Death. What each moment offers is open.
- Rationing, an answer under drawing on the buffer, implies a health and/or morale track. That is a candidate new strand arising by circumstance (5e), so strands are not just food, numbers and standing.
- Health and morale are two new, separate strands. Health is the band's physical state: hunger lowers it, good feeding restores it, and it feeds attrition and the famine ladder. Morale is cohesion and willingness to bear hardship: hardship, harsh rationing and quarrels lower it, feasts and good years raise it, and it feeds the quarrel and hunger split avenues. Rationing hurts health and saves stores; a feast lifts morale and spends them. Chosen over either alone and over neither.
- Health and morale always exist, from era 0, with a starting level: they are properties inherent to a band of people. Only their display and the storylets that read them appear by circumstance. This qualifies 5e's "new strands arise according to circumstance": strands that belong to any band of people are always present, and a strand an event brings into being (a later task's) may still be created on first touch. Chosen over creating health and morale on first touch, and over strands that fade.

## Numbers

- Numbers is a hidden headcount with named size tiers over it. Conditions and storylets read the tiers, and the player meets them only as prose, which keeps diegesis (5f) while giving later features concrete numbers (inter-band conflict, daughter band splitting). Food ceilings, labour floors, births and deaths per step and the 'too few to go on' test all work on the headcount. Chosen over a bare headcount and over an abstract 0 to 10 scale. The tier names and boundaries are open.
- A split shares the heads by its reason (4g). Hunger sends out those the land cannot feed, a larger share that leaves the parent with what it can feed. A quarrel sends out a faction, its share set by the quarrel's strength. Open land sends a small party of settlers. The daughter starts with that reason's health and morale: a hunger split is thin, a settler party bold. Chosen over a fixed share and over the player choosing the share.

## Move and consolidate

- A move no longer subtracts 1 from prosperity. It cuts the food buffer (stores do not travel: grain is mostly left behind, herds come with the band) and resets the seat counter that stands in for settledness. The other costs, morale and heads lost on the road, depend on why the band moves: a forced move (hunger, the loser of a quarrel leaving) costs morale and heads, a chosen move (the player's own, or open land) costs little, and a daughter band's settlers pay costs set by the split's reason (11b). This holds for whole-band moves and split daughters alike. The rest of the move costs stay for 4SD.11.
- Consolidate has no special effect. A cautious answer names the strand it improves, through the generic `{ strand: id, by: n }` consequence, and the unused `consolidations` parameter of `prosperityStep` goes. Chosen over a fixed health-and-morale bundle and over a kept consolidate effect.

## Scope

- The decisions above exceed one task. 6SL.6 splits into five tasks: the strands core, death ladders, split ladders, standing and surplus storylets. The dependencies between them are analysed against the roadmap graph and the code before any task is written, because under-wired links between tasks cause large refactors later.

## Felt

- The numeric prosperity bar goes. A strand is shown only when it stands out, as a line of prose (for example "The herds are thin" when food is low); in ordinary times the panel stays quiet. Chosen over a word per strand always shown (a ladder the player learns as a number) and over nothing on screen.
