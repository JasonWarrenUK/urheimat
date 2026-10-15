# 6SL.6 remap table

Every existing `{ prosperity: n }` consequence in the corpus (`src/lib/sim/storylets.ts`), with the strand Claude proposes it moves instead. The proposals are Claude's reading of each answer's own text and are for Jason to correct; nothing in the corpus is edited until this table is approved.

## Reading the table

- **Change** is the old amount on the 0 to 10 prosperity scale. The new strands' scales are open, so no converted amounts are proposed here.
- **Proposed strand** is the factor the answer really moves: morale (cohesion and willingness to bear hardship), buffer (stores and goods), numbers (heads), health, or standing. Food cannot be written, so a hunger answer names the buffer, numbers or health.
- A **standing** row must name the bands whose regard changes (decision 7b); the proposal names the group, here the bands in contact.
- Several answers could carry two strands (a gift of goods to a neighbour spends the buffer and raises standing). The table proposes one each; adding a second is a corpus decision.
- The stud keeps a legacy shim that maps every `{ prosperity }` consequence to morale, so the game runs until this table is approved. It is deleted with the remap.

## Table

55 consequences, 0 unmapped. Proposed totals: morale 26, buffer 18, numbers 8, standing 2, health 1.

| Storylet | Answer | Change | What it does | Log line | Proposed strand |
|---|---|---|---|---|---|
| new-leader-doubts | yield | +0.5 | Let the elders have their way | The elders keep the old ways, and the band is the calmer for it. | morale |
| elders-resist | force | -1 | Take it by force | {leader} takes the rite, and the band remembers how. | morale |
| old-leader-lingers | name | +0.5 | Name the heir now | The heir is named, and the band settles, knowing. | morale |
| old-leader-lingers | (lie) | -0.5 | let it lie | The talk goes on in corners, and the band frays a little. | morale |
| kinsman-takes-over | gifts | -1 | Buy their loyalty with gifts | Herds and goods go to the old families, and they are quiet for it. | buffer |
| old-families | face | -1 | Face them down | The old families are faced down, and some of them do not forget it. | morale |
| old-families | (lie) | -0.5 | let it lie | Two bands under one name, and the name wears thin. | morale |
| sisters-child-inherits | honour | +0.5 | Honour the mothers | The mothers are honoured, and the band is glad of its own rule. | morale |
| sisters-child-inherits | feast | -0.5 | Keep the peace with a feast | A feast is given, and what is offered is shared from now. | buffer |
| sisters-child-inherits | (lie) | -0.5 | let it lie | The old leader's own children sulk, and take some of the band's goodwill with them. | morale |
| heirs-contest-the-seat | (lie) | -1 | let it lie | The quarrel festers, and the band pays for it. | morale |
| blood-price-unpaid | herds | -1 | Pay it from the leader's own herds | {leader} pays the blood-price, and the band is the poorer for it. | buffer |
| blood-price-unpaid | (lie) | -0.5 | let it lie | Nothing is paid, and bad blood runs between the families. | morale |
| wives-quarrel-over-heirs | (lie) | -0.5 | let it lie | The quarrel runs on through the household and out of it. | morale |
| ordeal-drowns-the-innocent | appease | -0.5 | Keep the ordeal and appease the gods with a whole offering | A whole offering goes to the gods, and the ordeal stands. | buffer |
| ordeal-drowns-the-innocent | (lie) | -0.5 | let it lie | The drowned man's kin do not forget, and the band is a little less whole. | morale |
| feud-bleeds-the-band | (lie) | -1 | let it lie | The feud runs on, and the band buries more of its own. | numbers |
| oath-breaker | (lie) | -0.5 | let it lie | Nothing follows, and every oath weighs a little less. | morale |
| kin-keep-the-old-way | teach | -0.5 | Send elders to teach them your way | Elders go across the hills; some come back, and the kin keep their pyres. | numbers |
| kin-keep-the-old-way | (lie) | -0.5 | let it lie | Nothing is said of it, and the two ways drift further apart. | standing, of contacts |
| strangers-who-were-kin | (lie) | -0.5 | let it lie | They camp a season on the ridge and move on, unrecognised. | standing, of contacts |
| kin-turned-away | gifts | -1 | Make amends with gifts | Gifts go over the ridge after them, and the ancestors are quiet. | buffer |
| kin-turned-away | (lie) | -0.5 | let it lie | The elders mutter about the ancestors, and the band half believes them. | morale |
| the-marsh-takes-the-dead | carry | -0.5 | Carry them to dry ground | The dead are carried a day to dry ground, every time. | morale |
| the-marsh-takes-the-dead | (lie) | -0.5 | let it lie | The dead keep rising, and the living keep seeing them. | morale |
| no-wood-for-the-pyre | trade | -1 | Trade for wood | Wood is bought dear from far off, and the pyres burn. | buffer |
| no-wood-for-the-pyre | dung | -0.5 | Burn dung and bone, and make do | The pyres burn low on dung and bone, and the dead are burnt badly but burnt. | morale |
| no-wood-for-the-pyre | (lie) | -0.5 | let it lie | The dead wait for wood that does not come. | morale |
| the-river-takes-the-fields | offer | -0.5 | Offer the first of the harvest to the river | The first of the harvest goes to the river, and the river is asked to be kind. | buffer |
| the-river-takes-the-fields | uphill | -1 | Move the fields uphill | New fields are cut above the flood line, at a cost. | buffer |
| the-river-takes-the-fields | (lie) | -1 | let it lie | The fields are lost for the year, and the band goes hungry. | buffer |
| sea-god-far-from-the-sea | seek | -1 | Send the young to find the sea | Young people go to find the sea; some come back, with a jar of it. | numbers |
| sea-god-far-from-the-sea | (lie) | -0.5 | let it lie | The prayers go on to a Sea nobody can picture, and mean a little less each year. | morale |
| no-wine-on-this-land | trade | -1 | Trade for it dear | Wine comes from far off at a price, and the rite keeps its taste. | buffer |
| no-wine-on-this-land | (lie) | -0.5 | let it lie | The rite goes on with less wine each year, then with none. | morale |
| herds-sicken-in-the-marsh | drive | -1 | Drive the herds to drier ground each season | The herds are driven out and back each year, and the band with them. | health |
| herds-sicken-in-the-marsh | drown | -0.5 | Drown a beast for the marsh | A beast is given to the marsh, and the marsh is asked to spare the rest. | buffer |
| herds-sicken-in-the-marsh | (lie) | -1 | let it lie | The herds dwindle, and the band with them. | buffer |
| the-young-come-back-changed | return | -1 | Give the herds back | The herds go back over the hills, with apologies. | buffer |
| the-young-come-back-changed | feast | -0.5 | Make a feast of the return | The return is feasted, and what is offered is shared from now. | buffer |
| the-young-come-back-changed | (lie) | -0.5 | let it lie | The young keep their new ways, and the old look away. | morale |
| no-one-saw-the-first-homeland | seek | -1 | Send a party back to find it | A party goes back along the old road; what they find is not what the elders said. | numbers |
| no-one-saw-the-first-homeland | (lie) | -0.5 | let it lie | The first homeland becomes a word, and then a word that needs explaining. | morale |
| no-one-to-marry-out-to | far | -1 | Send the young far to find spouses | The young go far for spouses, and not all of them come back. | numbers |
| no-one-to-marry-out-to | wait | -0.5 | Wait a generation | A generation goes unwed, and the band is smaller for it. | numbers |
| no-one-to-marry-out-to | (lie) | -0.5 | let it lie | The custom stands and nobody marries, which the custom did not intend. | numbers |
| strangers-eat-the-band-out | own | -1 | Feed them from the leader's own | {leader} feeds the strangers from their own stores, and goes short. | buffer |
| strangers-eat-the-band-out | (lie) | -1 | let it lie | The strangers eat, and the band goes hungry before the spring. | buffer |
| a-kind-of-person-without-a-name | away | -0.5 | Send them away | They go, and the band is poorer by one and by more than one. | numbers |
| a-kind-of-person-without-a-name | (lie) | -0.5 | let it lie | Nobody says what they are, and the rites go on around them. | morale |
| brothers-share-a-wife | (lie) | -0.5 | let it lie | The brothers quarrel on, and the sons grow up listening. | morale |
| a-poet-dies-half-taught | two | -0.5 | Train two poets for every one | Two are trained for every poet, and the band feeds them. | buffer |
| a-poet-dies-half-taught | (lie) | -0.5 | let it lie | The half-taught lineage is sung wrong from now, and nobody knows it. | morale |
| two-powers-one-hearth | both | -0.5 | Keep both and feed both | Both powers are fed, and the band feeds them. | buffer |
| two-powers-one-hearth | (lie) | -0.5 | let it lie | The question goes unanswered, and the priest asks it again at every meal. | morale |
