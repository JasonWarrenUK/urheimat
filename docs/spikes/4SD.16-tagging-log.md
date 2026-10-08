# 4SD.16 tagging log

Decisions made with Jason while tagging the corpus, one round per custom. Each entry records what he decided.

## Round 1: drink becomes substance

### Contract

- The custom keeps the id `substance` and is a conditional authored category. For a band that has it, every value assumes a substance is taken in the rite. Nothing in the corpus asserts that every people has one.
- "Taken" means into or onto the body (drunk, eaten, smoked, inhaled, anointed, smeared). Burnt offerings stay with sacrifice.
- Whether the category describes anything real stays open to the trace work (4SD.14).

### Ids

- Custom `drink` becomes `substance`; part `base` becomes `kind`.
- Value ids may be paths: `drink/mead`, `drink/mare-milk`, `drink/beer`, `drink/wine`, `smoke`. Path siblings earn similarity credit only on tag terms, never on value ids.

### Manner is its own part

- The manner of taking (drunk, eaten, inhaled, smeared) is a separate part from `kind`, so no value bundles a substance with how it is taken. `smoke` bundles both today. Wine stops implying drinking.
- `kind` keeps mead, mare-milk, beer and wine and gains a substance for what `smoke` came from. Odd combinations (wine inhaled) are allowed; affinity and the lens make them rare.
- `manner` values: drunk, eaten, inhaled, smeared.
- `smoke` is replaced in `kind` by `plant/herb` and `plant/resin`.

### Sharing becomes a sequence of takers

- `sharing` becomes a staged part, like funeral's stages, with one axis, `taker`, per stage.
- Takers are disjoint groups: gods, chief, chief's family, priest/shaman, priest/shaman's family, the rest of the tribe. The chief is not the chief's family.
- A stage holds a set of groups. Complements (non-chiefs, not chief's family) are derived from the sets, not authored.
- Stage predicates control which later stages apply and which groups remain eligible.
- At most 3 stages. The sequence may end early: stages 2 and 3 may hold an empty set (size range from 0), stage 1 never does, and a later stage is dormant when the previous one is empty. A group named in no stage never partakes, which covers exclusionary rites.
- `manner` ids are flat: `drunk`, `eaten`, `inhaled`, `smeared`.
- Parked for the sacrifice round: sacrifice's value "Drink poured out" overlaps substance.

### Set-valued parts (engine change, inside feat/tag-corpus)

Breaking: saved runs change shape.

1. Storage is uniform: every part holds a `number[]`, length 1 for ordinary parts.
2. Terrain strain is per member; the strain count and its denominator count held values.
3. Drift and reform skip set-valued parts. 6SL.3 and 6SL.4 define how a set changes. The base game may stay broken until then.
4. Set similarity is `meanBest` over the part's value table.
5. A predicate over a set is true if some member matches.
6. The corpus declares which parts are sets and their size range; generation draws a size, then that many distinct members by the usual weighting.
7. Reconstruction scores a set part correct only on an exact set; the UI lists members. Richer credit belongs to 5RC.5 and 5RC.8.

### Substance readings

- New verbs: `commune`, `bind`, `cleanse`, `inspire`, `heal`. Objects: `body`, `spirit` and `takers`. Targets include the taker groups as nouns: `gods`, `chief/self`, `chief/family`, `priest/self`, `priest/family`, `tribe/rest`. The `/self` nouns make each person and their family path siblings for similarity. Taker value ids are unchanged; each taker value's `about` names its group noun.
- Struck from every `kind` value on purpose: funeral's verbs (destroy, sanctify, release, transform) and `memory` as an object.
- A reading that names a group may carry `others: true`: it counts only when that group takes in some round and a different group takes in the same round or a later one. A binding goes to a target in the same or an earlier round, never a later one. Predicates and display honour it; the similarity table ignores it and reads the full reading. Only `bind(takers to chief/self)` on mead carries it so far.
- Open: `bind(takers to takers)` is also vacuous when one person takes alone; not modelled yet.

### Substance manner, and two more kinds

- Principle: a grid loses a cell only when the cell is incoherent. All four manners therefore share the same readings: commune(spirit to gods, ancestors, beyond/otherworld), bind(takers to takers), cleanse(body), cleanse(spirit), inspire(spirit), heal(body). They differ by `about`: drunk (liquid, swallowing, inside), eaten (chewing, nourishment, inside), inhaled (breath, air, inside), smeared (skin, marking, outside). Inside against outside is an eighth opposite pair.
- `heal` is believed healing, a belief and no claim about medicine; it stays.
- Eaten can take fungus, herbs and meat, so `kind` gains `plant/fungus` and `animal/meat` this round instead of waiting for 4SD.10. Struck on purpose: fungus has no bind and no cleanse(body); meat has no cleanse and no inspire.
- Cost to watch: with identical readings the manners differ in similarity only through `about`.

### Substance takers

- Each taker group carries its own noun plus one meaning word in `about`: gods `offering`, chief `authority`, chief/family `lineage`, priest/shaman `mediation`, priest/shaman's family `calling`, rest of the tribe `belonging`.
- Readings: gods commune(spirit to gods) and bind(takers to gods); chief inspire(spirit) and bind(takers to chief/self); chief/family bind(takers to chief/family) and commune(spirit to ancestors); priest/shaman commune(spirit to gods, ancestors, beyond/otherworld), inspire(spirit) and cleanse(spirit); priest/shaman's family bind(takers to priest/family) and commune(spirit to ancestors); rest of the tribe bind(takers to takers) and heal(body). Group-targeted bindings carry `others`.

### Contract check

Every kind reads with every manner and every taker set; odd pairings (resin drunk, meat inhaled) are allowed by the contract and left to affinity and the lens. Nothing in the custom names a vessel, a liquid or a form. Known residue: `bind(takers to takers)` is vacuous for a lone taker.

## Round 2: sacrifice

### Boundary with substance

- Sacrifice may be a shadow of substance. When a band's sacrifice conforms to a shape substance already describes (cattle shared in a feast is meat eaten by the tribe), sacrifice is hidden and reads as substance. If either custom moves so that the match fails, sacrifice is unhidden and shows as its own custom. Either custom can start the split: sacrifice by taking a concrete value outside the rule, substance by moving away from what the rule needs.
- The link lives at custom level: sacrifice declares `shadows substance` as a pair of tag predicates, one over its own values and one over substance's. Values are not pointers one by one, because the match is a combination of offering and manner.
- Scope in this task: the declaration and a pure helper `isShadowed(slot, traits)` with tests. Hiding in the notebook UI and excluding a shadowed custom from reconstruction scoring wait for a later task.

### Sacrifice structure

- Contract: for a band that has this custom, every value assumes something is deliberately given to a power on a set occasion; it assumes nothing about what is given, how, or whether the people consume part of it (that case shadows substance).
- `victim` becomes `offering` with rules, not instances: `animal/mount`, `animal/herd`, `animal/wild`, `animal/water`, `harvest`, `liquid`. First fruits is a harvest given as a first share.
- A new part `share` separates the whole beast, crop or vessel (`whole`) from the first portion of what was taken for food or use (`first`).
- `manner` gains `poured` (lifted out of "Drink poured out") and `feast` replaces "shared in a feast"; `occasion` ids are `midwinter`, `midsummer`, `first-grass`, `first-catch`.
- Affinities restated in named levels; unlisted terrains allow.

### Sacrifice readings

- New verbs: `feed`, `appease`, `thank`, `petition`, `renew`; `bind` is reused. Objects: `gods`, `ancestors`, `land`, `living`. Targets: `plenty`, `renewal`, `guardianship`. Funeral's and substance's verbs are struck.
- All six offerings, both shares, five manners and four occasions carry `about` tags and a grid; the grids are in `slots.ts`.
- Parked idea: the reading targets (plenty, renewal, guardianship) could inform terrain affinity. Today an affinity records only what the land does to a value; deriving it from meaning tags would be a separate decision.
- A fifth occasion, `first-harvest`, was added after the grids were approved: river and forest favour it, desert and steppe resist it; about grain, growth, plenty, first; thank(land to plenty), renew(land to renewal), petition(gods to plenty).

### The shadow rule

- Two rules on sacrifice, each a pair of tag conditions. An animal feast (manner about `consumption`, offering about `flesh`) shadows substance when its kind is about `flesh`, its manner about `chewing` and some taker is not about `gods`. A drink feast (offering about `liquid`) shadows it when the kind is about `liquid`, the manner about `swallowing` and some taker is not about `gods`. A harvest feast has no counterpart (no grain kind), so it stays visible.
- Any human group counts as a consumer; a chief-only meal shadows.
- Tags added for the rules: `flesh` on the four animal offerings, `liquid` on the four drink kinds.
- `isShadowed(traits, si)` in `predicates.ts` is a pure helper with tests. Display and scoring do not use it yet.

## Round 3: cult

- Contract: for a band that has this custom, every value assumes a power is honoured by a small repeated act at household scale; it assumes nothing about which power, when, or who performs it. Domain moves from Cosmology to Rite.
- Cult shadows highGod, and cult is the one hidden. The match is sameness of the revered being, not shared theme words: every figure carries two readings, honour(power/greatest) (the greatest power, or an aspect of it) and honour(power/own) (a power of its own). The rule fires on the first; the band's belief moving to the second is the divergence. A shadow condition can now match a reading (`has` on a PartTag). Until 4SD.17 every band holds the full grid, so every cult is shadowed; 4SD.17 makes it a band choice, and belief leaves no trace.
- The Dawn as an aspect of a Sea god is allowed by free combination; no consistency check against highGod's domain. highGod stays untagged until its own round.
- Ids: figure `dawn`, `moon`, `hearth`, `river`, `tide`; timing `dawn`, `dusk`, `new-moon`, `before-meals`; officiant `elder-woman`, `household-head`, `priest`, `children`. The priest shares substance's noun `priest/self`.
- New verb `honour`; new nouns `power/greatest`, `power/own`, `cycle`, `age`, `youth`, `innocence`. Grids and affinities are in `slots.ts` as approved.

## Round 4: highGod

- Contract: for a band that has this custom, every value assumes one power stands above the others and is spoken of as a person; it assumes nothing about that power's domain, its kind of person, or whether it has a consort. Cult's `power/greatest` resolves against it.
- `role` splits. `kin` (`parent`, `elder`, `lord`) is a part. Sex is a belief, not a part: every kin value carries address(power/greatest to female) and address(power/greatest to male); a band may hold either, both or neither once 4SD.17 lands. Nothing about sex stays in practice, so it leaves no trace. Jason flagged the female/male tags as uneasy ground politically; they record what the imagined people believed, and moving them to readings was his preferred answer.
- `consort` is set-valued, size [0, 2]: an empty set is unwed, and two consorts are expressible. The old `unwed` value favoured desert and mountain; an empty set carries no affinity, so that pull waits for the pressure system. Parked for 6SL.3: weighing absence.
- Domain gains five values that the record shows as greatest powers: `moon`, `beasts` (master of animals), `river`, `wind`, `death`. Their grids and affinities are in `slots.ts` as approved.
- New verbs `rule`, `create`, `guard`, `judge`, `address`; new nouns `storm`, `sun`, `sea`, `death`, `justice`, `female`, `male`.
