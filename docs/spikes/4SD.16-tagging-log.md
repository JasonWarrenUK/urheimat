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

## Round 5: afterlife, dissolved

- Where the dead go is belief with no practice behind it, and funeral's readings already carried it. Jason chose to dissolve the custom rather than keep it as a shadow of funeral or as an independent custom. The corpus's customs are authored categories; this one described nothing a trace could find.
- Destinations become funeral reading targets. New noun `beyond/below` (beneath the mountain, down into the sea) on inter, sink and the enclosed places (cave, bog, open water); rebirth is `return(spirit to living)` on inter, sink and scatter; the winds and the river crossing were already `beyond/sky` and `beyond/otherworld`.
- Judgement is a reading on every act that has readings: `judge(spirit)` is a reckoning at the threshold, `judge(spirit to death)` a sorting by manner of death; holding neither is unjudged, so no absence value.
- Passage (ferried, on horseback, led by a hound, on foot) is dropped: mythic detail with no practice behind it and nouns that would be instances. 4SD.10 may bring it back as a reading family if a verb for it appears.
- Engine: `retention` found the rule and memory customs by hard-coded index; it now finds them by id.

## Round 6: hero

- Contract: for a band that has this custom, every value assumes the people tell of one founding figure whose deed made them a people; it assumes nothing about who the figure was, what the deed was, or who helped. Kept as an independent custom: one of its functions is to be set down in writing by some cultures, which lets the scholars compare tales (writing is a later mechanism).
- `kind` splits three ways: `number` (`one`, `twins`, `company`), `birth` (`orphan`, `youngest`, `lowborn`) and the hero's sex as address readings on every birth value, as on highGod.
- `deed` splits into `act` (slew, raided, built, returned, cut, stole), `object` (monster, herds, dwelling, homeland/lost, field, fire) and `stake` (waters, herds, shelter, homeland, grain, fire), Jason's `<slew> <serpent> <held-waters>`. Odd combinations are allowed by contract and left to the lens; `herds` and `fire` sit in both object and stake, the cost of three axes.
- `companion` becomes up to two companions, each a `helper` set (size [0, 1]: wild, mount, vessel, creature) with its own `aid` (nursed, guided, carried, helped) applying only when that helper is held; the second applies only after the first. An empty first helper is a hero alone; the old `alone` affinity (desert, mountain) is lost like `unwed`.
- New verbs `found`, `win`, `defy`; new nouns `hero`, `loss`, `theft`, `guidance`. Grids and affinities as approved.

## Round 7: rule

- Contract: for a band that has this custom, every value assumes someone holds authority over the band; it assumes nothing about who, how they are chosen, how long they hold it, or what sacred duty goes with it.
- `ruler` splits into `seat` (`one`, `council`) and `source` of authority (`sacred`, `war`, `age`, `wealth`, `law`); the five old values become combinations. `tenure` splits into `tenure` (`life`, `until-defeated`, `yearly`) and `chosen` (`birth`, `election`, `lot`). `duty` keeps its four values with ids `fire`, `ancestors`, `herds`, `waters`. New noun `chance`.
- Engine: `retention` matched the ruler's display text; it now reads the held `source` by tag (+1.5 when about `justice`, +1 when about `mediation`) through a new helper `heldAbout`. The memory custom's matches wait for its round.
- Test maintenance: the funeral-stage test asserted the recovery never shows more stages than the truth; a wrongly recovered act can imply a later stage, so it now asserts that rendered stages equal the stages live in the recovery and that no run of lost parts appears.

## Round 8: memory

- Contract: for a band that has this custom, every value assumes the past is kept deliberately by someone; it assumes nothing about the medium, the matter kept, or the occasion.
- `keeper` becomes `medium` (`voice/verse`, `voice/song`, `stone`, `dance`); the matter it bundled (sung genealogies) stays in `what`. Carved stone is where writing attaches later (6SL.5).
- `what` (`lineages`, `deeds`, `boundaries`, `dead`) and `when` (`funerals`, `midwinter`, `assembly`) are sets, size [1, 4] and [1, 3]: a people keeps several matters on several occasions.
- Engine: `retention` read the keeper's display text; it now reads the held `medium` by tag (+1 when about `stone`, +0.5 when about `voice`). No display-text matches remain in the engine.
- New noun `voice`. Grids and affinities as approved.

## Round 9: guest

- Contract: for a band that has this custom, every value assumes a stranger who arrives is dealt with by a rule; it assumes nothing about whether they are taken in, what token passes, or for how long.
- The render breach is gone. `rule` splits into `stance` (`welcome`, `bar`) and `basis` (`sacred`, `gift`, `hostage`). Everything past the stance applies only when the held stance carries a `shelter` reading (new verb), so nothing passes and no span runs for a stranger turned away; `bar` has no shelter reading.
- Tokens are two parts, `gift/stranger` and `gift/host`, each a set of size [0, 1] over the same four kinds (`mineral/salt`, `food/grain`, `wealth/metal`, `drink/water`): asymmetric exchange, a one-way gift, or none.
- Span is `count` (`one`, `three`) and `unit` (`meals`, `nights`, `open`); `open` carries no readings and so takes no count, the way funeral's "left as they are" ends a chain.
- New noun `stranger`. Grids and affinities as approved.
- `bar` resists steppe, desert and coast: open, travelled land where a refused traveller may die. Jason asked what the record shows for strangers against biome; no direct cross-cultural test was found, and the best-supported mechanism is risk buffering (Pisor and Gurven 2016), which this follows. Marsh and mountain favouring `bar` is inherited authoring with no evidence either way.

## Round 10: justice

- Contract: for a band that has this custom, every value assumes a killing among them is answered by a rule; it assumes nothing about how guilt is found, what the remedy is, who answers for it, or whether the killer is made clean.
- `remedy` bundled three axes. It splits into `finding` (`ordeal/water`, `assembly`, plus `oath`, which ties to the oath custom) and `remedy` (`price`, `exile`, plus `feud`).
- `payer` becomes `answerer` (`killer`, `kin`). The chief answering for a killer belongs to killings between bands; parked until a cross-band relationship system exists.
- `cleansing` is a set, size [0, 2] (`fire`, `water`, `silence`); empty is never clean again.
- New verb `atone`; new nouns `killer`, `guilt`. Grids and affinities as approved.

## Round 11: oath

- Contract: for a band that has this custom, every value assumes a promise is bound by something beyond the one who makes it; it assumes nothing about what it is sworn on, who witnesses it, or what a breach brings.
- `on` stays single-valued (`fire`, `water`, `bones`, `weapons`). `witness` is a set, size [1, 3] (`assembly`, `chief`, `gods`); the gods alone is a set of one.
- `breach` separates the consequence from who imposes it: `penalty`, a set of size [1, 2] (`outlawry`, `death`, `fine`, `curse`), and `imposer` (`assembly`, `chief`, `gods`, `poets`).
- New noun `breaker`. Grids and affinities as approved.

## Round 12: descent, and a livelihood custom

- Contract for descent: for a band that has this custom, every value assumes belonging and property pass between generations by a rule; it assumes nothing about which line, where a couple lives, or who inherits.
- `line` is `father`, `mother`, `house`, plus `both` (kin through both parents). `residence` is `husband`, `wife`, `new`. `inherit` splits into `heirs` (`children`, `sister-children`) and `share` (`eldest`, `youngest`, `equal`).
- Jason asked for the historical rationale behind the affinities. The record ties descent and residence to subsistence and warfare, not terrain: large livestock predicts patriliny (Aberle 1961; Holden and Mace 2003) and patrilocality (Ember and Ember 1971); horticulture predicts matriliny; primogeniture goes with land that cannot be split; ultimogeniture with herding expansion (the Mongol otchigin). Terrain is a poor proxy for livestock culture, so:
- A `livelihood` custom is added (domain Land): up to three sources (`herds/large`, `herds/small`, `crop/hoe`, `crop/plough`, `catch`, `hunt`, `gather`), each with its own `labour` (`male`, `female`, `shared`), built with the sequence helper `each` that hero's companions use. Its affinities are the land's.
- Descent's affinities stay as a documented terrain proxy for livelihood; 6SL.3 should pull descent and residence from livelihood's tags and retire them. Warfare (internal versus external) is band state for the cross-band relationship system; `rule/source: war` and `justice/remedy: feud` are the interim tag signals.
- Engine: a custom may declare `strain: 'food'`. Food strain is hunger and feeds prosperity; custom strain no longer does, and becomes pressure for 6SL.3 to carry. Livelihood is the first food custom.
- Engine: a later member of a sequence never repeats what an earlier one holds (no band fed by hoe crops twice), and later sequence stages start at size 0.
