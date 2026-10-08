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
