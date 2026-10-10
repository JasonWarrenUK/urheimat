import type { AffLevel, Affinity, FeatureDef, Predicate, Reading, SlotDef, TraitValue, Terrain, Transition, ValueTags } from '$lib/types';
import type { Noun, Verb } from './vocabulary';

export const LAND: Terrain[] = ['coast', 'marsh', 'river', 'forest', 'steppe', 'desert', 'mountain'];

export const AFF_WEIGHT: Record<AffLevel, number> = { strong: 3, favours: 1.5, allows: 1, resists: 0.5, excludes: 0 };

// A value with an id naming its concept, named affinity levels and tags. The name is provisional
// display text; rendering transforms it downstream.
const N = (id: string, name: string, aff?: Affinity, tags?: ValueTags): TraitValue => ({ id, name, aff, ...tags });

// One row of a value's reading grid: a verb and object, with each target it can be aimed at
// (null = no target). Every value carries its full grid; cells left out were struck deliberately.
const R = (verb: Verb, object: Noun, ...targets: (Noun | null)[]): Reading[] =>
	targets.map((target) => (target === null ? { verb, object } : { verb, object, target }));
// Readings that hold only for certain material in hand.
const when = (readings: Reading[], ...material: Noun[]): Reading[] => readings.map((r) => ({ ...r, when: material }));
// Readings that count only when someone besides their target takes (see Reading.others).
const others = (readings: Reading[]): Reading[] => readings.map((r) => ({ ...r, others: true as const }));
// Material transitions: what an act accepts and what it leaves.
const T = (accepts: Transition['accepts'], yields: Transition['yields']): Transition => ({ accepts, yields });
const PASS: Transition[] = [T('any', 'same')];

// A custom of up to `count` stages sharing one schema of axes, expanded to flat parts
// (s1.act, s1.place, … s3.posture). A band uses one to `count` stages; a later stage lies dormant
// once nothing is left in hand for it.
const staged = (count: number, axes: FeatureDef[]): FeatureDef[] =>
	Array.from({ length: count }, (_, i) =>
		axes.map((a) => {
			const own = a.applies === undefined ? [] : Array.isArray(a.applies) ? a.applies : [a.applies];
			const applies = i > 0 ? [{ inHand: 'some' as const }, ...own] : own;
			return { ...a, id: `s${i + 1}.${a.id}`, stage: i + 1, applies: applies.length ? applies : undefined };
		})
	).flat();

// A custom of up to `count` rounds of one set-valued axis. Round one is never empty; a later round
// applies only if the one before it holds someone, so an empty round ends the sequence.
const sequence = (count: number, axes: FeatureDef[]): FeatureDef[] =>
	Array.from({ length: count }, (_, i) =>
		axes.map((a) => ({
			...a,
			id: `s${i + 1}.${a.id}`,
			stage: i + 1,
			size: i === 0 ? a.size : ([0, a.size![1]] as const),
			applies: i > 0 ? { part: a.id, stage: 'previous' as const, has: 'anyMember' as const } : undefined
		}))
	).flat();

// What any way of taking the substance may be believed to do; struck only where incoherent, and no
// manner needs a strike. The manners differ by what they are about.
const MANNER_READINGS: Reading[] = [
	...R('commune', 'spirit', 'gods', 'ancestors', 'beyond/otherworld'),
	...R('bind', 'takers', 'takers'),
	...R('cleanse', 'body', null),
	...R('cleanse', 'spirit', null),
	...R('inspire', 'spirit', null),
	...R('heal', 'body', null)
];

// Every daily figure can be read as the greatest power (or an aspect of it) or as a power of its own.
const HONOUR: Reading[] = [...R('honour', 'power/greatest', null), ...R('honour', 'power/own', null)];

// The greatest power may be spoken of as female or male; a band may hold either, both or neither.
const ADDRESS: Reading[] = [...R('address', 'power/greatest', 'female', 'male')];

// Where the dead go was a custom of its own; it is belief, so it lives on the acts as readings. A
// reckoning at the threshold, or a sorting by manner of death; a band holding neither is unjudged.
const JUDGE: Reading[] = R('judge', 'spirit', null, 'death');

// The founding figure may be spoken of as female or male; a band may hold either, both or neither.
const HERO_SEX: Reading[] = R('address', 'hero', 'female', 'male');

// Up to `count` members of a sequence, each a set-valued lead part with the parts that go with it
// (a hero's helper and its aid; a livelihood source and who works it). A later member applies only
// after the one before has a lead; whether the first may be empty is the lead's own size.
const each = (count: number, axes: FeatureDef[]): FeatureDef[] =>
	Array.from({ length: count }, (_, i) =>
		axes.map((a) => {
			const lead = a === axes[0];
			const own = a.applies === undefined ? [] : Array.isArray(a.applies) ? a.applies : [a.applies];
			const before = i > 0 && lead ? [{ part: a.id, stage: 'previous' as const, has: 'anyMember' as const }] : [];
			const applies = [...before, ...own];
			const size = lead && a.size && i > 0 ? ([0, a.size[1]] as const) : a.size;
			const distinct = lead && a.size ? (true as const) : undefined;
			return { ...a, id: `s${i + 1}.${a.id}`, stage: i + 1, size, distinct, applies: applies.length ? applies : undefined };
		})
	).flat();

// The stranger at the door: everything past the stance applies only when the stance shelters.
const SHELTERED: Predicate = { part: 'stance', has: { verb: 'shelter' } };
// What may pass between stranger and host, either way.
const TOKENS: TraitValue[] = [
	N('mineral/salt', 'salt', undefined, { about: ['salt', 'permanence', 'trust'], readings: R('bind', 'stranger', 'living') }),
	N('food/grain', 'bread', undefined, { about: ['grain', 'nourishment', 'hearth'], readings: [...R('provide', 'stranger', 'nourishment'), ...R('bind', 'stranger', 'living')] }),
	N('wealth/metal', 'a ring', undefined, { about: ['wealth', 'permanence', 'hierarchy'], readings: [...R('bind', 'stranger', 'living'), ...R('provide', 'stranger', 'wealth')] }),
	N('drink/water', 'water', { desert: 'strong', steppe: 'favours' }, { about: ['water', 'cleansing', 'nourishment'], readings: [...R('provide', 'stranger', 'nourishment'), ...R('cleanse', 'stranger', null)] })
];

// What one side of a marriage may give the other.
const DOWRY: TraitValue[] = [
	N('herds', 'herds', { steppe: 'strong' }, { about: ['herds', 'wealth', 'hierarchy'], readings: [...R('bind', 'living', 'kinship'), ...R('provide', 'living', 'wealth')] }),
	N('land', 'land', { river: 'strong' }, { about: ['land', 'permanence', 'continuity'], readings: [...R('bind', 'living', 'kinship'), ...R('provide', 'living', 'continuity')] }),
	N('labour', 'labour', { coast: 'favours', mountain: 'favours', desert: 'favours' }, { about: ['labour', 'patience', 'trust'], readings: [...R('bind', 'living', 'kinship'), ...R('provide', 'living', 'nourishment')] }),
	N('kin', 'a sister or daughter', { forest: 'favours', marsh: 'favours' }, { about: ['kinship', 'equality', 'belonging'], readings: R('bind', 'living', 'kinship') })
];

export const RICHNESS: Record<Terrain, number> = {
	coast: 0.3,
	marsh: -0.2,
	river: 0.5,
	forest: 0.2,
	steppe: 0,
	desert: -0.5,
	mountain: -0.3
};

// A custom is a small structure: each slot has features, each feature a set of values. Every value
// has an id, named affinity levels (a terrain left out allows) and tags; a value with no affinity
// table is neutral: no terrain pulls on it and none strains against it.
export const SLOTS: SlotDef[] = [
	{
		id: 'highGod',
		domain: 'Cosmology',
		name: 'The greatest power',
		// Contract: for a band that has this custom, every value assumes one power stands above the
		// others and is spoken of as a person; it assumes nothing about that power's domain, its kind
		// of person, or whether it has a consort. Its sex is a belief: every kin value can be read as
		// addressing a female or a male power, and a band may hold either, both or neither.
		features: [
			{
				id: 'domain',
				label: 'domain',
				values: [
					N('sky', 'Sky', { steppe: 'strong', mountain: 'favours', desert: 'favours', forest: 'resists' }, {
						about: ['sky', 'light', 'openness', 'height'],
						readings: [...R('rule', 'sky', null), ...R('rule', 'living', null), ...R('guard', 'living', null), ...R('judge', 'living', 'justice')]
					}),
					N('storm', 'Storm', { mountain: 'strong', forest: 'favours', desert: 'resists' }, {
						about: ['storm', 'sky', 'violence', 'water'],
						readings: [...R('rule', 'sky', null), ...R('judge', 'living', 'justice'), ...R('guard', 'living', null), ...R('provide', 'land', 'renewal')]
					}),
					N('sun', 'Sun', { desert: 'strong', steppe: 'favours', forest: 'resists', marsh: 'resists' }, {
						about: ['sun', 'light', 'warmth', 'cycle'],
						readings: [...R('rule', 'sky', null), ...R('create', 'living', null), ...R('provide', 'land', 'plenty'), ...R('guard', 'living', null)]
					}),
					N('earth', 'Earth', { river: 'strong', forest: 'favours', desert: 'resists' }, {
						about: ['earth', 'growth', 'plenty', 'depth'],
						readings: [...R('create', 'living', null), ...R('provide', 'living', 'plenty'), ...R('rule', 'land', null), ...R('guard', 'dead', null)]
					}),
					N('sea', 'Sea', { coast: 'strong', marsh: 'favours', mountain: 'resists', steppe: 'resists', desert: 'excludes' }, {
						about: ['sea', 'water', 'depth', 'distance'],
						readings: [...R('rule', 'water', null), ...R('provide', 'living', 'plenty'), ...R('judge', 'living', 'justice'), ...R('guard', 'dead', null)]
					}),
					N('fire', 'Fire', { forest: 'strong', mountain: 'favours', marsh: 'resists' }, {
						about: ['fire', 'warmth', 'light', 'hearth'],
						readings: [...R('rule', 'fire', null), ...R('create', 'living', null), ...R('guard', 'living', null), ...R('provide', 'living', 'warmth')]
					}),
					N('moon', 'Moon', { desert: 'strong', steppe: 'favours', forest: 'resists', marsh: 'resists' }, {
						about: ['sky', 'darkness', 'cycle', 'stillness'],
						readings: [...R('rule', 'sky', null), ...R('judge', 'living', 'justice'), ...R('provide', 'land', 'renewal'), ...R('guard', 'dead', null)]
					}),
					N('beasts', 'Master of beasts', { forest: 'strong', mountain: 'favours', steppe: 'favours', river: 'resists', desert: 'resists' }, {
						about: ['wild', 'chase', 'herds', 'strength'],
						readings: [...R('rule', 'wild', null), ...R('guard', 'wild', null), ...R('provide', 'living', 'plenty'), ...R('judge', 'living', 'justice')]
					}),
					N('river', 'River', { river: 'strong', marsh: 'favours', mountain: 'resists', desert: 'excludes' }, {
						about: ['water', 'growth', 'passage', 'plenty'],
						readings: [...R('rule', 'water', null), ...R('create', 'living', null), ...R('provide', 'living', 'plenty'), ...R('guard', 'land', null)]
					}),
					N('wind', 'Wind', { steppe: 'strong', coast: 'favours', mountain: 'favours', forest: 'resists' }, {
						about: ['air', 'breath', 'sky', 'freedom'],
						readings: [...R('rule', 'sky', null), ...R('create', 'living', null), ...R('provide', 'land', 'renewal'), ...R('guard', 'living', null)]
					}),
					N('death', 'Death', { mountain: 'favours', marsh: 'favours', desert: 'favours', river: 'resists' }, {
						about: ['death', 'darkness', 'depth', 'boundary'],
						readings: [...R('rule', 'dead', null), ...R('guard', 'dead', null), ...R('judge', 'dead', 'justice'), ...R('judge', 'living', 'justice')]
					})
				]
			},
			{
				id: 'kin',
				label: 'person',
				values: [
					N('parent', 'Parent', undefined, {
						about: ['kinship', 'origin', 'continuity'],
						readings: [...ADDRESS, ...R('create', 'living', null), ...R('guard', 'living', null), ...R('provide', 'living', 'plenty')]
					}),
					N('elder', 'Elder', undefined, {
						about: ['age', 'memory', 'custom'],
						readings: [...ADDRESS, ...R('judge', 'living', 'justice'), ...R('rule', 'living', null), ...R('guard', 'custom', null)]
					}),
					N('lord', 'Lord', undefined, {
						about: ['authority', 'hierarchy', 'wealth'],
						readings: [...ADDRESS, ...R('rule', 'living', null), ...R('judge', 'living', 'justice'), ...R('guard', 'land', null)]
					})
				]
			},
			{
				id: 'consort',
				label: 'consort',
				// An empty set is an unwed power. The old unwed value favoured desert and mountain; an empty
				// set carries no affinity, so that pull waits for the pressure system to weigh absence.
				size: [0, 2],
				values: [
					N('earth', 'wedded to the Earth', { river: 'favours', forest: 'favours', steppe: 'favours' }, {
						about: ['earth', 'growth', 'kinship'],
						readings: [...R('bind', 'power/greatest', 'earth'), ...R('create', 'living', null), ...R('renew', 'land', 'renewal')]
					}),
					N('sea', 'wedded to the Sea', { coast: 'strong', marsh: 'favours' }, {
						about: ['sea', 'water', 'distance'],
						readings: [...R('bind', 'power/greatest', 'sea'), ...R('provide', 'living', 'plenty')]
					}),
					N('dawn', 'wedded to the Dawn', { steppe: 'strong', desert: 'favours' }, {
						about: ['sky', 'light', 'renewal'],
						readings: [...R('bind', 'power/greatest', 'sky'), ...R('renew', 'land', 'renewal')]
					})
				]
			}
		],
		render: (n) => `The ${n[0]} ${n[1]}${n[2] ? `, ${n[2]}` : ''}`
	},
	{
		id: 'hero',
		domain: 'Cosmology',
		name: 'The founding tale',
		// Contract: for a band that has this custom, every value assumes the people tell of one founding
		// figure whose deed made them a people; it assumes nothing about who the figure was, what the
		// deed was, or who helped. The hero's sex is a belief (address readings on every birth). Up to
		// two companions, each a helper with its own aid; an empty first helper is a hero alone.
		features: [
			{
				id: 'number',
				label: 'number',
				values: [
					N('one', 'One founder', undefined, { about: ['identity', 'authority'], readings: R('found', 'living', null) }),
					N('twins', 'A twin pair', undefined, { about: ['kinship', 'division', 'equality'], readings: [...R('found', 'living', null), ...R('bind', 'living', 'kinship')] }),
					N('company', 'A company', undefined, { about: ['belonging', 'equality', 'kinship'], readings: [...R('found', 'living', null), ...R('bind', 'living', 'belonging')] })
				]
			},
			{
				id: 'birth',
				label: 'birth',
				values: [
					N('orphan', 'an orphan', undefined, { about: ['abandonment', 'origin', 'wild'], readings: [...HERO_SEX, ...R('found', 'living', null), ...R('defy', 'gods', null)] }),
					N('youngest', "a ruler's youngest", undefined, { about: ['lineage', 'hierarchy', 'trust'], readings: [...HERO_SEX, ...R('found', 'living', null), ...R('win', 'land', 'living')] }),
					N('lowborn', 'of no house', undefined, { about: ['plainness', 'labour', 'equality'], readings: [...HERO_SEX, ...R('found', 'living', null), ...R('defy', 'hierarchy', null)] })
				]
			},
			{
				id: 'act',
				label: 'deed',
				values: [
					N('slew', 'slew', undefined, { about: ['violence', 'strength', 'ending'], readings: [...R('defy', 'gods', null), ...R('guard', 'living', null)] }),
					N('raided', 'raided', undefined, { about: ['chase', 'theft', 'wealth'], readings: [...R('defy', 'gods', null), ...R('win', 'wealth', 'living')] }),
					N('built', 'built', undefined, { about: ['craft', 'permanence', 'hearth'], readings: [...R('found', 'living', 'land'), ...R('create', 'hearth', null)] }),
					N('returned', 'returned from', undefined, { about: ['passage', 'memory', 'loss'], readings: [...R('return', 'living', null), ...R('found', 'living', 'land')] }),
					N('cut', 'cut', undefined, { about: ['labour', 'earth', 'growth'], readings: [...R('create', 'grain', null), ...R('found', 'living', 'land')] }),
					N('stole', 'stole', undefined, { about: ['theft', 'haste', 'light'], readings: [...R('defy', 'gods', null), ...R('win', 'light', 'living')] })
				]
			},
			{
				id: 'object',
				label: 'object',
				values: [
					N('monster', 'the serpent', { river: 'favours', marsh: 'favours' }, { about: ['violence', 'water', 'boundary', 'fear'], readings: [...R('guard', 'living', null), ...R('defy', 'gods', null)] }),
					N('herds', 'the cattle of the gods', { steppe: 'favours' }, { about: ['herds', 'wealth'], readings: R('provide', 'living', 'plenty') }),
					N('dwelling', 'the first house', undefined, { about: ['hearth', 'enclosure', 'permanence'], readings: [...R('guard', 'living', null), ...R('found', 'living', 'land')] }),
					N('homeland/lost', 'the drowned lands', { coast: 'favours' }, { about: ['sea', 'loss', 'memory'], readings: [...R('return', 'living', null), ...R('found', 'living', 'land')] }),
					N('field', 'the first furrow', { river: 'favours' }, { about: ['earth', 'grain', 'labour'], readings: [...R('create', 'grain', null), ...R('provide', 'living', 'plenty')] }),
					N('fire', 'fire from the heights', { mountain: 'favours' }, { about: ['fire', 'light', 'warmth'], readings: [...R('create', 'hearth', null), ...R('provide', 'living', 'warmth')] })
				]
			},
			{
				id: 'stake',
				label: 'and so won',
				values: [
					N('waters', 'the waters', { river: 'strong', mountain: 'favours', desert: 'resists' }, { about: ['water', 'plenty', 'renewal'], readings: [...R('win', 'water', 'living'), ...R('provide', 'living', 'plenty')] }),
					N('herds', 'the herds', { steppe: 'strong', desert: 'favours', marsh: 'resists' }, { about: ['herds', 'wealth'], readings: R('win', 'herds', 'living') }),
					N('shelter', 'shelter', { river: 'favours', forest: 'favours', coast: 'favours', steppe: 'resists' }, { about: ['enclosure', 'hearth', 'guardianship'], readings: [...R('found', 'living', 'land'), ...R('guard', 'living', null)] }),
					N('homeland', 'a homeland', { coast: 'strong', marsh: 'favours', desert: 'excludes', mountain: 'resists' }, { about: ['land', 'origin', 'memory'], readings: [...R('found', 'living', 'land'), ...R('return', 'living', null)] }),
					N('grain', 'grain', { river: 'strong', forest: 'favours', desert: 'resists', mountain: 'resists' }, { about: ['grain', 'growth', 'labour'], readings: [...R('win', 'grain', 'living'), ...R('create', 'grain', null)] }),
					N('fire', 'fire', { mountain: 'strong', forest: 'favours', marsh: 'resists' }, { about: ['fire', 'light', 'warmth'], readings: [...R('win', 'fire', 'living'), ...R('create', 'hearth', null)] })
				]
			},
			...each(2, [
				{
					id: 'helper',
					label: 'helped by',
					size: [0, 1],
					values: [
						N('wild', 'wolves', { forest: 'strong', mountain: 'favours', desert: 'resists' }, { about: ['wild', 'strength', 'kinship'], readings: [...R('guard', 'hero', null), ...R('bind', 'hero', 'wild')] }),
						N('mount', 'a horse', { steppe: 'strong', forest: 'resists', marsh: 'resists' }, { about: ['herds', 'speed', 'guidance'], readings: [...R('guard', 'hero', null), ...R('convey', 'hero', 'land')] }),
						N('vessel', 'a boat', { coast: 'strong', river: 'favours', desert: 'excludes', mountain: 'resists' }, { about: ['water', 'passage', 'craft'], readings: [...R('convey', 'hero', 'land'), ...R('guard', 'hero', null)] }),
						N('creature', 'a bee', { forest: 'favours', river: 'favours', marsh: 'favours' }, { about: ['smallness', 'sweetness', 'guidance'], readings: [...R('guard', 'hero', null), ...R('provide', 'hero', 'plenty')] })
					]
				},
				{
					id: 'aid',
					label: 'who',
					applies: { part: 'helper', stage: 'same', has: 'anyMember' },
					values: [
						N('nursed', 'nursed them', undefined, { about: ['nourishment', 'kinship', 'youth'], readings: [...R('guard', 'hero', null), ...R('provide', 'hero', 'nourishment')] }),
						N('guided', 'guided them', undefined, { about: ['guidance', 'passage'], readings: R('convey', 'hero', 'land') }),
						N('carried', 'carried them', undefined, { about: ['passage', 'distance'], readings: R('convey', 'hero', 'land') }),
						N('helped', 'helped them', undefined, { about: ['trust', 'smallness'], readings: [...R('provide', 'hero', 'plenty'), ...R('guard', 'hero', null)] })
					]
				}
			])
		],
		render: (n) => {
			const who = [n[5] && `${n[5]} ${n[6]}`, n[7] && `${n[7]} ${n[8]}`].filter(Boolean).join(' and ');
			return `${n[0]}, ${n[1]}, ${n[2]} ${n[3]} and so won ${n[4]}${who ? `; ${who}` : ''}`;
		}
	},
	{
		id: 'cult',
		domain: 'Rite',
		name: 'The daily cult',
		// Contract: for a band that has this custom, every value assumes a power is honoured by a small
		// repeated act at household scale; it assumes nothing about which power, when, or who performs
		// it. Every figure can be read as the greatest power (or an aspect of it) or as a power of its
		// own; while a band reads it as the greatest power, the cult shadows highGod.
		features: [
			{
				id: 'figure',
				label: 'figure',
				values: [
					N('dawn', 'The Dawn', { steppe: 'strong', desert: 'favours', forest: 'resists' }, {
						about: ['sky', 'light', 'renewal', 'origin'],
						readings: [...HONOUR, ...R('petition', 'gods', 'renewal'), ...R('thank', 'gods', 'light')]
					}),
					N('moon', 'The Moon', { desert: 'strong', steppe: 'favours', forest: 'resists' }, {
						about: ['sky', 'darkness', 'cycle', 'stillness'],
						readings: [...HONOUR, ...R('petition', 'gods', 'renewal'), ...R('appease', 'gods', null)]
					}),
					N('hearth', 'The Hearth-fire', { forest: 'strong', mountain: 'favours', desert: 'resists', steppe: 'resists' }, {
						about: ['fire', 'hearth', 'warmth', 'kinship'],
						readings: [...HONOUR, ...R('feed', 'gods', null), ...R('bind', 'living', 'kinship'), ...R('petition', 'gods', 'guardianship')]
					}),
					N('river', 'The River', { river: 'strong', marsh: 'favours', steppe: 'resists', desert: 'excludes' }, {
						about: ['water', 'growth', 'plenty', 'passage'],
						readings: [...HONOUR, ...R('thank', 'gods', 'plenty'), ...R('petition', 'gods', 'plenty'), ...R('appease', 'gods', null)]
					}),
					N('tide', 'The Tide', { coast: 'strong', marsh: 'favours', steppe: 'resists', desert: 'excludes', mountain: 'excludes' }, {
						about: ['water', 'cycle', 'distance', 'passage'],
						readings: [...HONOUR, ...R('appease', 'gods', null), ...R('petition', 'gods', 'guardianship'), ...R('renew', 'land', 'renewal')]
					})
				]
			},
			{
				id: 'timing',
				label: 'timing',
				values: [
					N('dawn', 'at dawn', undefined, {
						about: ['light', 'renewal', 'origin'],
						readings: [...R('honour', 'gods', null), ...R('thank', 'gods', 'light'), ...R('petition', 'gods', 'renewal')]
					}),
					N('dusk', 'at dusk', undefined, {
						about: ['darkness', 'rest', 'ending', 'guardianship'],
						readings: [...R('honour', 'gods', null), ...R('petition', 'gods', 'guardianship'), ...R('appease', 'gods', null)]
					}),
					N('new-moon', 'at each new moon', undefined, {
						about: ['cycle', 'darkness', 'renewal'],
						readings: [...R('honour', 'gods', null), ...R('renew', 'land', 'renewal'), ...R('petition', 'gods', 'renewal')]
					}),
					N('before-meals', 'before every meal', undefined, {
						about: ['nourishment', 'thrift', 'hearth', 'custom'],
						readings: [...R('honour', 'gods', null), ...R('thank', 'gods', 'plenty'), ...R('feed', 'gods', null), ...R('bind', 'living', 'kinship')]
					})
				]
			},
			{
				id: 'officiant',
				label: 'officiant',
				values: [
					N('elder-woman', 'the eldest woman', undefined, {
						about: ['age', 'kinship', 'memory', 'continuity'],
						readings: [...R('honour', 'gods', null), ...R('bind', 'living', 'continuity'), ...R('commune', 'spirit', 'ancestors')]
					}),
					N('household-head', 'the household head', undefined, {
						about: ['authority', 'hearth', 'kinship'],
						readings: [...R('honour', 'gods', null), ...R('bind', 'living', 'kinship'), ...R('petition', 'gods', 'guardianship')]
					}),
					N('priest', 'a priest', undefined, {
						about: ['priest/self', 'mediation'],
						readings: [...R('honour', 'gods', null), ...R('commune', 'spirit', 'gods'), ...R('petition', 'gods', 'guardianship'), ...R('cleanse', 'spirit', null)]
					}),
					N('children', 'the children', undefined, {
						about: ['youth', 'innocence', 'renewal', 'continuity'],
						readings: [...R('honour', 'gods', null), ...R('petition', 'gods', 'renewal'), ...R('bind', 'living', 'continuity')]
					})
				]
			}
		],
		// While the band reads its figure as the greatest power, the daily cult is that power's
		// household honouring and hides behind highGod. Reading it as a power of its own unhides it.
		shadows: [{ custom: 'highGod', when: [{ part: 'figure', has: { object: 'power/greatest' } }], holds: [{ part: 'domain' }] }],
		render: (n) => `${n[0]}, honoured ${n[1]} by ${n[2]}`
	},
	{
		id: 'sacrifice',
		domain: 'Rite',
		name: 'What is offered',
		// Contract: for a band that has this custom, every value assumes something is deliberately given
		// to a power on a set occasion; it assumes nothing about what is given, how, or whether the
		// people consume part of it (that case shadows substance).
		features: [
			{
				id: 'offering',
				label: 'offering',
				values: [
					N('animal/mount', 'A horse', { steppe: 'strong', river: 'favours', forest: 'resists', marsh: 'resists', mountain: 'resists' }, {
						about: ['flesh', 'speed', 'strength', 'herds', 'wealth'],
						readings: [...R('feed', 'gods', null), ...R('appease', 'gods', null), ...R('petition', 'gods', 'guardianship')]
					}),
					N('animal/herd', 'Cattle', { steppe: 'favours', river: 'favours', forest: 'favours', desert: 'resists', marsh: 'resists' }, {
						about: ['flesh', 'herds', 'wealth', 'nourishment'],
						readings: [...R('feed', 'gods', null), ...R('feed', 'ancestors', null), ...R('appease', 'gods', null), ...R('thank', 'gods', 'plenty'), ...R('petition', 'gods', 'plenty')]
					}),
					N('animal/wild', 'Hunted game', { forest: 'strong', mountain: 'favours', desert: 'resists' }, {
						about: ['flesh', 'wild', 'chase', 'strength', 'blood'],
						readings: [...R('thank', 'gods', 'plenty'), ...R('appease', 'land', null), ...R('feed', 'land', null)]
					}),
					N('animal/water', 'Fish and fowl', { coast: 'strong', marsh: 'strong', river: 'favours', mountain: 'resists', desert: 'excludes' }, {
						about: ['flesh', 'water', 'plenty', 'wild'],
						readings: [...R('thank', 'land', 'plenty'), ...R('appease', 'gods', null), ...R('renew', 'land', 'renewal')]
					}),
					N('harvest', 'Grain and fruit', { river: 'strong', forest: 'favours', steppe: 'resists', desert: 'resists' }, {
						about: ['grain', 'growth', 'plenty'],
						readings: [...R('thank', 'land', 'plenty'), ...R('renew', 'land', 'renewal'), ...R('feed', 'land', null), ...R('feed', 'ancestors', null)]
					}),
					N('liquid', 'A drink', { desert: 'favours', mountain: 'favours' }, {
						about: ['liquid', 'water', 'lightness'],
						readings: [...R('feed', 'land', null), ...R('feed', 'ancestors', null), ...R('appease', 'gods', null), ...R('thank', 'land', 'plenty')]
					})
				]
			},
			{
				id: 'share',
				label: 'share',
				values: [
					N('whole', 'all of it', undefined, {
						about: ['completion', 'cost', 'giving'],
						readings: [...R('feed', 'gods', null), ...R('feed', 'ancestors', null), ...R('appease', 'gods', null), ...R('bind', 'gods', 'guardianship')]
					}),
					N('first', 'the first of it', undefined, {
						about: ['first', 'thrift', 'trust'],
						readings: [...R('thank', 'gods', 'plenty'), ...R('thank', 'land', 'plenty'), ...R('petition', 'gods', 'plenty'), ...R('petition', 'land', 'plenty')]
					})
				]
			},
			{
				id: 'manner',
				label: 'manner',
				values: [
					N('burnt', 'burnt', { forest: 'favours', steppe: 'favours', mountain: 'favours', marsh: 'resists' }, {
						about: ['fire', 'smoke', 'ascent', 'light'],
						readings: [...R('feed', 'gods', null), ...R('appease', 'gods', null), ...R('thank', 'gods', 'plenty'), ...R('petition', 'gods', 'plenty')]
					}),
					N('drowned', 'drowned', { coast: 'favours', river: 'favours', marsh: 'favours', desert: 'resists' }, {
						about: ['water', 'depth', 'hiddenness'],
						readings: [...R('feed', 'gods', null), ...R('appease', 'gods', null), ...R('renew', 'land', 'renewal')]
					}),
					N('buried', 'buried', { river: 'favours', steppe: 'favours', desert: 'favours' }, {
						about: ['earth', 'darkness', 'deposit'],
						readings: [...R('feed', 'ancestors', null), ...R('feed', 'land', null), ...R('renew', 'land', 'renewal'), ...R('thank', 'land', 'plenty')]
					}),
					N('poured', 'poured out', undefined, {
						about: ['liquid', 'earth', 'offering'],
						readings: [...R('feed', 'ancestors', null), ...R('feed', 'land', null), ...R('thank', 'land', 'plenty'), ...R('appease', 'gods', null)]
					}),
					N('feast', 'shared in a feast', undefined, {
						about: ['festivity', 'consumption', 'belonging'],
						readings: [...R('bind', 'gods', 'guardianship'), ...R('thank', 'gods', 'plenty'), ...R('feed', 'ancestors', null)]
					})
				]
			},
			{
				id: 'occasion',
				label: 'occasion',
				values: [
					N('midwinter', 'midwinter', undefined, {
						about: ['cold', 'darkness', 'renewal', 'endurance'],
						readings: [...R('renew', 'land', 'renewal'), ...R('petition', 'gods', 'renewal'), ...R('appease', 'gods', null)]
					}),
					N('midsummer', 'midsummer', undefined, {
						about: ['light', 'warmth', 'plenty'],
						readings: [...R('thank', 'gods', 'plenty'), ...R('thank', 'land', 'plenty'), ...R('bind', 'gods', 'guardianship')]
					}),
					N('first-grass', 'the first grass', { steppe: 'favours', river: 'favours', forest: 'favours', desert: 'resists' }, {
						about: ['growth', 'herds', 'first'],
						readings: [...R('petition', 'land', 'plenty'), ...R('renew', 'land', 'renewal'), ...R('thank', 'land', 'plenty')]
					}),
					N('first-catch', 'the first catch', { coast: 'favours', marsh: 'favours', river: 'favours', steppe: 'resists', desert: 'resists', mountain: 'resists' }, {
						about: ['water', 'first', 'wild'],
						readings: [...R('thank', 'land', 'plenty'), ...R('petition', 'gods', 'plenty'), ...R('appease', 'gods', null)]
					}),
					N('first-harvest', 'the first harvest', { river: 'favours', forest: 'favours', desert: 'resists', steppe: 'resists' }, {
						about: ['grain', 'growth', 'plenty', 'first'],
						readings: [...R('thank', 'land', 'plenty'), ...R('renew', 'land', 'renewal'), ...R('petition', 'gods', 'plenty')]
					})
				]
			}
		],
		// A feast of an animal is meat eaten; a feast of a drink is a drink drunk. Either way the people
		// consume it, which is substance's business, so sacrifice reads as substance while that holds.
		shadows: [
			{
				custom: 'substance',
				when: [{ part: 'manner', about: 'consumption' }, { part: 'offering', about: 'flesh' }],
				holds: [{ part: 'kind', about: 'flesh' }, { part: 'manner', about: 'chewing' }, { part: 'taker', not: 'gods' }]
			},
			{
				custom: 'substance',
				when: [{ part: 'manner', about: 'consumption' }, { part: 'offering', about: 'liquid' }],
				holds: [{ part: 'kind', about: 'liquid' }, { part: 'manner', about: 'swallowing' }, { part: 'taker', not: 'gods' }]
			}
		],
		render: (n) => `${n[0]}, ${n[1]}, ${n[2]}, at ${n[3]}`
	},
	{
		id: 'funeral',
		domain: 'Rite',
		name: 'Treatment of the dead',
		// Contract: every people deals with its dead in some deliberate way. Up to three stages, each
		// an act on the remains with its own place, vessel, goods, orientation and posture. Values are
		// rules a people follows, never instances. Affinities record the land only, never band state.
		features: staged(3, [
			{
				id: 'act',
				label: 'act',
				values: [
					// No readings by design: that keeps place, vessel and goods off, and ends the chain.
					N('none', 'left as they are', undefined, { about: ['abandonment', 'indifference'], material: [T('any', 'nothing')] }),
					N(
						'burn',
						'burnt',
						{ forest: 'strong', river: 'favours', marsh: 'resists', steppe: 'resists', desert: 'excludes' },
						{
							about: ['fire', 'warmth', 'light', 'smoke', 'ash', 'haste', 'purity'],
							material: [T('body', 'ash'), T('bone', 'ash'), T('parts', 'ash')],
							readings: [
								...JUDGE,
								...R('destroy', 'body', null),
								...R('destroy', 'spirit', null),
								...R('destroy', 'memory', null),
								...R('sanctify', 'body', null, 'beyond/otherworld', 'ancestors', 'gods'),
								...R('sanctify', 'spirit', null, 'beyond/sky', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('sanctify', 'memory', null),
								...R('release', 'body', 'beyond/sky', 'beyond/stars', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'spirit', null, 'beyond/sky', 'beyond/stars', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'memory', null),
								...R('transform', 'body', null, 'beyond/sky', 'beyond/stars', 'ancestors', 'gods'),
								...R('transform', 'spirit', null, 'beyond/sky', 'beyond/stars', 'ancestors', 'gods')
							]
						}
					),
					N(
						'expose',
						'exposed',
						{ mountain: 'strong', desert: 'favours', steppe: 'favours', marsh: 'excludes' },
						{
							about: ['sky', 'birds', 'wind', 'bone', 'patience', 'openness'],
							material: [T('body', 'bone'), T('parts', 'bone')],
							readings: [
								...JUDGE,
								...R('destroy', 'body', null),
								...R('sanctify', 'body', null, 'beyond/sky', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('sanctify', 'spirit', null, 'beyond/sky', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'body', 'beyond/sky', 'beyond/stars', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'spirit', null, 'beyond/sky', 'beyond/stars', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'memory', null),
								...R('transform', 'body', null, 'beyond/sky', 'ancestors'),
								...R('transform', 'spirit', null, 'beyond/sky', 'beyond/stars', 'ancestors', 'gods')
							]
						}
					),
					N(
						'preserve',
						'preserved',
						{ desert: 'strong', mountain: 'favours', marsh: 'resists', coast: 'resists', river: 'resists' },
						{
							about: ['permanence', 'dryness', 'salt', 'smoke', 'presence', 'wholeness'],
							material: [T('body', 'body')],
							readings: [
								...JUDGE,
								...R('sanctify', 'body', null, 'beyond/otherworld', 'ancestors', 'gods'),
								...R('sanctify', 'spirit', null, 'beyond/otherworld', 'ancestors'),
								...R('sanctify', 'memory', null),
								...R('release', 'body', 'beyond/otherworld'),
								...R('release', 'spirit', 'beyond/otherworld', 'ancestors'),
								...R('transform', 'body', null, 'ancestors', 'gods'),
								...R('transform', 'spirit', null, 'ancestors', 'gods')
							]
						}
					),
					N('inter', 'buried', undefined, {
						about: ['earth', 'darkness', 'depth', 'decay', 'rest', 'boundary'],
						material: PASS,
						readings: [
							...JUDGE,
							...R('destroy', 'body', null),
							...R('destroy', 'spirit', null),
							...R('destroy', 'memory', null),
							...R('sanctify', 'body', null, 'beyond/otherworld', 'ancestors', 'gods'),
							...R('sanctify', 'spirit', null, 'beyond/otherworld', 'ancestors', 'gods'),
							...R('sanctify', 'memory', null),
							...R('release', 'body', 'beyond/otherworld', 'ancestors', 'gods'),
							...R('release', 'spirit', null, 'beyond/otherworld', 'beyond/below', 'ancestors', 'gods'),
							...R('release', 'memory', null),
							...R('return', 'spirit', 'living'),
							...R('transform', 'body', null, 'ancestors', 'gods'),
							...R('transform', 'spirit', null, 'ancestors', 'gods')
						]
					}),
					N(
						'sink',
						'given to the water',
						{ coast: 'strong', river: 'strong', marsh: 'favours', steppe: 'resists', mountain: 'resists', desert: 'excludes' },
						{
							about: ['water', 'depth', 'passage', 'cleansing', 'cold', 'hiddenness'],
							material: [T('any', 'nothing')],
							readings: [
								...JUDGE,
								...R('destroy', 'body', null),
								...R('destroy', 'spirit', null),
								...R('destroy', 'memory', null),
								...R('sanctify', 'body', null, 'beyond/otherworld', 'ancestors', 'gods'),
								...R('sanctify', 'spirit', null, 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'body', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'spirit', null, 'beyond/otherworld', 'beyond/below', 'ancestors', 'gods'),
								...R('release', 'memory', null),
								...R('return', 'spirit', 'living'),
								...R('transform', 'body', null, 'ancestors', 'gods'),
								...R('transform', 'spirit', null, 'ancestors', 'gods')
							]
						}
					),
					N('scatter', 'scattered', { steppe: 'favours', mountain: 'favours', coast: 'favours' }, {
						about: ['wind', 'sky', 'dispersal', 'lightness', 'freedom'],
						material: [T('ash', 'nothing'), T('dust', 'nothing'), T('bone', 'bone')],
						readings: [
							...JUDGE,
							...when(R('destroy', 'body', null), 'ash', 'dust'), // bones scattered are bones still
							...R('destroy', 'spirit', null),
							...R('destroy', 'memory', null),
							...R('sanctify', 'body', null, 'beyond/sky', 'ancestors', 'gods'),
							...R('sanctify', 'spirit', null, 'beyond/sky', 'ancestors', 'gods'),
							...R('release', 'body', 'beyond/sky', 'beyond/stars', 'beyond/otherworld', 'ancestors', 'gods'),
							...R('release', 'spirit', null, 'beyond/sky', 'beyond/stars', 'beyond/otherworld', 'ancestors', 'gods'),
							...R('release', 'memory', null),
							...R('return', 'spirit', 'living'),
							...R('transform', 'body', null, 'beyond/sky', 'beyond/stars', 'ancestors'),
							...R('transform', 'spirit', null, 'beyond/sky', 'beyond/stars', 'ancestors')
						]
					}),
					N('keep', 'kept among the living', { marsh: 'resists' }, {
						about: ['presence', 'permanence', 'hearth', 'guardianship', 'nearness'],
						material: PASS,
						readings: [
							...JUDGE,
							...R('sanctify', 'body', null, 'ancestors', 'gods'),
							...R('sanctify', 'spirit', null, 'ancestors'),
							...R('sanctify', 'memory', null),
							...R('release', 'spirit', 'ancestors'),
							...R('transform', 'body', null, 'ancestors', 'gods'),
							...R('transform', 'spirit', null, 'ancestors', 'gods')
						]
					}),
					N('dismember', 'cut apart', undefined, {
						about: ['violence', 'division', 'fear', 'labour'],
						material: [T('body', 'parts')],
						readings: [
							...JUDGE,
							...R('destroy', 'body', null),
							...R('destroy', 'spirit', null),
							...R('destroy', 'memory', null),
							...R('sanctify', 'body', 'ancestors', 'gods'),
							...R('release', 'spirit', null, 'beyond/otherworld'),
							...R('transform', 'body', null, 'ancestors', 'gods')
						]
					}),
					N('decapitate', 'beheaded', undefined, {
						about: ['violence', 'fear', 'guardianship', 'identity'],
						material: [T('body', 'body')],
						readings: [
							...JUDGE,
							...R('destroy', 'spirit', null),
							...R('destroy', 'memory', null),
							...R('sanctify', 'body', null, 'ancestors', 'gods'),
							...R('release', 'spirit', null, 'beyond/otherworld', 'ancestors'),
							...R('transform', 'body', null, 'ancestors', 'gods'),
							...R('transform', 'spirit', 'ancestors')
						]
					}),
					N('deflesh', 'stripped to the bone', undefined, {
						about: ['bone', 'cleansing', 'labour', 'intimacy', 'permanence'],
						material: [T('body', 'bone'), T('parts', 'bone')],
						readings: [
							...JUDGE,
							...R('destroy', 'body', null),
							...R('sanctify', 'body', null, 'ancestors', 'gods'),
							...R('sanctify', 'spirit', null),
							...R('release', 'spirit', null, 'beyond/otherworld', 'ancestors'),
							...R('transform', 'body', null, 'ancestors')
						]
					}),
					N('pulverise', 'ground to dust', undefined, {
						about: ['dust', 'labour', 'intimacy', 'completion'],
						material: [T('bone', 'dust')],
						readings: [
							...JUDGE,
							...R('destroy', 'body', null),
							...R('destroy', 'spirit', null),
							...R('destroy', 'memory', null),
							...R('sanctify', 'body', null, 'ancestors', 'gods'),
							...R('sanctify', 'spirit', null, 'ancestors'),
							...R('release', 'body', 'ancestors'),
							...R('release', 'spirit', null, 'beyond/otherworld', 'ancestors'),
							...R('release', 'memory', null),
							...R('transform', 'body', null, 'ancestors', 'gods'),
							...R('transform', 'spirit', null, 'ancestors')
						]
					})
				]
			},
			{
				id: 'place',
				label: 'place',
				applies: { part: 'act', stage: 'same', has: 'anyReading' },
				values: [
					N('ground', 'on open ground', undefined, {
						about: ['earth', 'plainness', 'anonymity', 'hiddenness'],
						readings: [...R('hide', 'remains', null), ...R('offer', 'remains', 'earth'), ...R('return', 'remains', null, 'earth')]
					}),
					// A natural eminence and a built platform are two values: they leave different traces (4SD.14).
					N('height/crag', 'on a crag', { mountain: 'strong', marsh: 'excludes' }, {
						about: ['height', 'sky', 'openness', 'wind', 'distance'],
						readings: [...R('mark', 'remains', null, 'living', 'land'), ...R('offer', 'remains', 'gods', 'beyond/sky'), ...R('return', 'remains', 'beyond/sky')]
					}),
					N('height/tower', 'on a raised platform', { mountain: 'strong', steppe: 'resists', desert: 'resists', marsh: 'excludes' }, {
						about: ['height', 'sky', 'openness', 'wind', 'distance', 'labour'],
						readings: [...R('mark', 'remains', null, 'living', 'land'), ...R('offer', 'remains', 'gods', 'beyond/sky'), ...R('return', 'remains', 'beyond/sky')]
					}),
					N('house', 'in the house', undefined, {
						about: ['hearth', 'nearness', 'presence', 'guardianship', 'enclosure'],
						readings: [...R('hide', 'remains', null), ...R('hold', 'remains', null, 'living', 'ancestors'), ...R('offer', 'remains', 'gods')]
					}),
					N('grove', 'in a grove', { forest: 'strong', river: 'favours', steppe: 'resists', desert: 'excludes' }, {
						about: ['trees', 'shade', 'growth', 'hiddenness', 'sanctuary'],
						readings: [
							...R('mark', 'remains', 'ancestors', 'land'),
							...R('hide', 'remains', null),
							...R('hold', 'remains', 'ancestors'),
							...R('offer', 'remains', 'gods', 'earth'),
							...R('return', 'remains', 'earth')
						]
					}),
					N('mound', 'under a mound', { steppe: 'strong', river: 'favours', desert: 'resists', mountain: 'resists', marsh: 'excludes' }, {
						about: ['earth', 'height', 'openness', 'boundary', 'permanence', 'labour'],
						readings: [
							...R('mark', 'remains', null, 'living', 'ancestors', 'land'),
							...R('hold', 'remains', null, 'living'),
							...R('offer', 'remains', 'gods', 'earth'),
							...R('return', 'remains', 'earth')
						]
					}),
					N('cave', 'in a cave', { mountain: 'strong', desert: 'favours', steppe: 'resists', marsh: 'excludes' }, {
						about: ['earth', 'darkness', 'depth', 'hiddenness', 'permanence', 'enclosure'],
						readings: [
							...R('mark', 'remains', 'ancestors', 'land'),
							...R('hide', 'remains', null, 'living'),
							...R('hold', 'remains', null, 'ancestors'),
							...R('offer', 'remains', 'gods', 'earth'),
							...R('return', 'remains', 'earth', 'beyond/below')
						]
					}),
					N('water/edge', "at the water's edge", { coast: 'strong', river: 'strong', marsh: 'favours', desert: 'resists' }, {
						about: ['water', 'boundary', 'passage', 'threshold'],
						readings: [
							...R('mark', 'remains', null, 'living', 'land'),
							...R('hold', 'remains', 'living'),
							...R('offer', 'remains', 'gods', 'water'),
							...R('return', 'remains', 'water')
						]
					}),
					N('water/bog', 'in the bog', { marsh: 'strong', steppe: 'resists', mountain: 'resists', desert: 'excludes' }, {
						about: ['water', 'earth', 'depth', 'hiddenness', 'stillness', 'permanence'],
						readings: [
							...R('hide', 'remains', null, 'living'),
							...R('hold', 'remains', null),
							...R('offer', 'remains', 'gods', 'earth', 'water'),
							...R('return', 'remains', 'earth', 'water', 'beyond/below')
						]
					}),
					N('water/open', 'in open water', { coast: 'strong', river: 'favours', marsh: 'favours', steppe: 'resists', mountain: 'resists', desert: 'excludes' }, {
						about: ['water', 'depth', 'passage', 'distance', 'cold', 'freedom'],
						readings: [...R('hide', 'remains', null), ...R('offer', 'remains', 'gods', 'water'), ...R('return', 'remains', 'ancestors', 'water', 'beyond/below')]
					})
				]
			},
			{
				id: 'vessel',
				label: 'vessel',
				applies: { part: 'act', stage: 'same', has: 'anyReading' },
				values: [
					// Vessels pass the remains through unchanged; their transitions only gate what they can hold.
					N('none', 'with no vessel', undefined, { about: ['plainness', 'bareness', 'directness'], material: PASS }),
					N('boat', 'in a boat', { coast: 'strong', river: 'favours', marsh: 'favours', mountain: 'resists', steppe: 'excludes', desert: 'excludes' }, {
						about: ['water', 'passage', 'wealth', 'labour', 'craft'],
						material: PASS,
						readings: [
							...R('enclose', 'remains', null),
							...R('convey', 'remains', 'ancestors', 'gods', 'water', 'beyond/otherworld'),
							...R('protect', 'remains', null),
							...R('display', 'remains', 'living'),
							...R('provide', 'remains', null)
						]
					}),
					N('bier', 'on a bier', undefined, {
						about: ['openness', 'craft', 'lightness', 'visibility'],
						material: PASS,
						readings: [...R('convey', 'remains', null, 'beyond/sky'), ...R('display', 'remains', null, 'living')]
					}),
					N('pit', 'in a pit', { mountain: 'resists', marsh: 'resists' }, {
						about: ['earth', 'depth', 'plainness', 'darkness'],
						material: PASS,
						readings: [...R('enclose', 'remains', null, 'earth'), ...R('convey', 'remains', 'earth')]
					}),
					N('chamber', 'in a chamber', { mountain: 'favours', desert: 'favours', marsh: 'excludes' }, {
						about: ['enclosure', 'permanence', 'labour', 'wealth', 'stone'],
						material: PASS,
						readings: [
							...R('enclose', 'remains', null, 'ancestors'),
							...R('protect', 'remains', null, 'living'),
							...R('display', 'remains', 'living'),
							...R('provide', 'remains', null, 'beyond/otherworld')
						]
					}),
					N('urn', 'in an urn', { river: 'favours', coast: 'favours', steppe: 'resists' }, {
						about: ['enclosure', 'craft', 'smallness', 'hearth'],
						material: [T('ash', 'same'), T('dust', 'same')],
						readings: [...R('enclose', 'remains', null), ...R('convey', 'remains', 'living', 'beyond/otherworld'), ...R('protect', 'remains', null)]
					}),
					N('shroud', 'in a shroud', undefined, {
						about: ['enclosure', 'intimacy', 'cloth', 'hiddenness'],
						material: [T('body', 'same'), T('bone', 'same')],
						readings: [
							...R('enclose', 'remains', null),
							...R('convey', 'remains', 'beyond/otherworld'),
							...R('protect', 'remains', null, 'living'),
							...R('provide', 'remains', null)
						]
					})
				]
			},
			{
				id: 'goods',
				label: 'goods',
				applies: { part: 'act', stage: 'same', has: 'anyReading' },
				values: [
					// Targets are recipients: the goods go to the dead, so that they fare well wherever they go.
					N('kit', 'with the common kit', undefined, {
						about: ['equality', 'custom', 'provision'],
						readings: [...R('provide', 'goods', 'dead'), ...R('display', 'goods', 'living'), ...R('offer', 'goods', 'gods')]
					}),
					N('role', 'with the tools of their trade', undefined, {
						about: ['identity', 'craft', 'labour', 'continuity'],
						readings: [...R('provide', 'goods', 'dead'), ...R('display', 'goods', 'living'), ...R('return', 'goods', 'dead')]
					}),
					N('standing', 'with the wealth of their standing', undefined, {
						about: ['wealth', 'hierarchy', 'visibility', 'permanence'],
						readings: [...R('provide', 'goods', 'dead'), ...R('display', 'goods', 'living', 'ancestors'), ...R('offer', 'goods', 'gods'), ...R('return', 'goods', 'dead')]
					}),
					N('nothing', 'with nothing', { desert: 'favours', marsh: 'favours', mountain: 'favours' }, {
						about: ['plainness', 'thrift', 'equality'],
						readings: [...R('withhold', 'goods', 'living')]
					})
				]
			},
			{
				id: 'orientation',
				label: 'orientation',
				// An urn can be oriented, so any act with a reading will do.
				applies: { part: 'act', stage: 'same', has: 'anyReading' },
				// Deictic values (water/*, homeland/*, settlement, height, holy-place) are rules the engine
				// resolves against band state and the map at the time; the corpus holds only the rule.
				// holy-place is the first cross-custom reference (the band's own holy place): recorded for
				// the tagging task, since it needs a predicate for when that custom is absent.
				values: [
					N('dawn', 'facing the dawn', undefined, { about: ['sky', 'light', 'renewal'], readings: R('face', 'dead', 'beyond/sky', 'gods') }),
					N('water/nearest', 'facing the water', { coast: 'favours', river: 'favours', marsh: 'favours' }, { about: ['water', 'passage'], readings: R('face', 'dead', 'water') }),
					N('water/sea', 'facing the sea', { coast: 'strong' }, { about: ['water', 'distance', 'memory'], readings: R('face', 'dead', 'water', 'ancestors') }),
					N('homeland/first', 'facing the first homeland', undefined, { about: ['memory', 'origin', 'distance'], readings: R('face', 'dead', 'land', 'ancestors') }),
					N('homeland/split', 'facing the homeland they left', undefined, { about: ['memory', 'kinship', 'distance'], readings: R('face', 'dead', 'land', 'living') }),
					N('homeland/last-seat', 'facing the last seat', undefined, { about: ['memory', 'nearness'], readings: R('face', 'dead', 'land') }),
					N('none', 'with no set direction', undefined, { about: ['indifference', 'plainness'] }),
					N('dusk', 'facing the dusk', undefined, { about: ['darkness', 'passage', 'ending'], readings: R('face', 'dead', 'beyond/otherworld', 'ancestors') }),
					N('pole', 'facing the still star', undefined, { about: ['sky', 'stillness', 'permanence'], readings: R('face', 'dead', 'beyond/stars', 'gods') }),
					N('settlement', 'facing the settlement', undefined, { about: ['nearness', 'guardianship', 'presence'], readings: R('face', 'dead', 'living') }),
					N('holy-place', 'facing the holy place', undefined, { about: ['sanctuary', 'continuity'], readings: R('face', 'dead', 'gods', 'shrine') }),
					N('height', 'facing the mountain', undefined, { about: ['height', 'distance'], readings: R('face', 'dead', 'beyond/sky', 'gods', 'land') })
				]
			},
			{
				id: 'posture',
				label: 'posture',
				// Only a whole body has a posture.
				applies: [{ part: 'act', stage: 'same', has: 'anyReading' }, { inHand: 'body' }],
				values: [
					N('supine', 'laid on the back', undefined, {
						about: ['rest', 'openness', 'visibility'],
						readings: [...R('rest', 'dead', null), ...R('display', 'dead', 'living')]
					}),
					N('prone', 'laid face down', undefined, {
						about: ['hiddenness', 'fear', 'shame'],
						readings: [...R('hide', 'dead', null), ...R('protect', 'living', null), ...R('destroy', 'spirit', null)]
					}),
					N('flexed', 'drawn up', undefined, {
						about: ['renewal', 'smallness', 'enclosure'],
						readings: [...R('return', 'dead', 'earth'), ...R('rest', 'dead', null), ...R('enclose', 'dead', null)]
					}),
					N('seated', 'seated', undefined, {
						about: ['presence', 'guardianship', 'visibility', 'hierarchy'],
						readings: [...R('display', 'dead', 'living'), ...R('protect', 'dead', 'living'), ...R('hold', 'dead', 'living')]
					}),
					N('side', 'laid on the side', undefined, {
						about: ['rest', 'intimacy'],
						readings: [...R('rest', 'dead', null), ...R('return', 'dead', 'earth')]
					}),
					N('standing', 'set upright', undefined, {
						about: ['guardianship', 'visibility', 'boundary'],
						readings: [...R('protect', 'dead', 'living'), ...R('display', 'dead', 'living')]
					}),
					N('bound', 'bound', undefined, {
						about: ['fear', 'enclosure', 'hiddenness'],
						readings: [...R('protect', 'living', null), ...R('destroy', 'spirit', null), ...R('enclose', 'dead', null)]
					})
				]
			}
		]),
		// Provisional: one clause per stage in use, until rendering is designed downstream.
		// Dormant parts arrive as '' and are dropped; a stage whose act is dormant or 'none' is skipped.
		render: (n) => {
			const stages = [0, 1, 2].map((k) => n.slice(k * 6, k * 6 + 6)).filter((s) => s[0] && s[0] !== 'left as they are');
			if (!stages.length) return 'The dead are left where they fall';
			const text = stages.map((s) => [s.slice(0, 3).filter(Boolean).join(' '), ...s.slice(3).filter(Boolean)].join(', ')).join('; then ');
			return text[0].toUpperCase() + text.slice(1);
		}
	},
	{
		id: 'substance',
		domain: 'Rite',
		name: 'The sacred substance',
		// Contract: for a band that has this custom, every value assumes a substance is taken into or
		// onto the body in the rite, and nothing about what it is, its form or any vessel. The custom is
		// an authored category, not a finding; whether it describes anything real is open. The takers
		// are a sequence of up to three rounds, each a set of groups; an empty round ends it.
		features: [
			{
				id: 'kind',
				label: 'substance',
				values: [
					N('drink/mead', 'Mead', { forest: 'strong', steppe: 'favours', desert: 'resists' }, {
						about: ['liquid', 'honey', 'sweetness', 'festivity', 'fire'],
						readings: [
							...R('commune', 'spirit', 'gods', 'ancestors'),
							...R('bind', 'takers', 'takers'),
							...others(R('bind', 'takers', 'chief/self')),
							...R('inspire', 'spirit', null)
						]
					}),
					N('drink/mare-milk', "Fermented mare's milk", { steppe: 'strong', forest: 'resists', marsh: 'resists', mountain: 'resists' }, {
						about: ['liquid', 'herds', 'nourishment', 'kinship'],
						readings: [...R('bind', 'takers', 'takers', 'ancestors'), ...R('heal', 'body', null), ...R('commune', 'spirit', 'ancestors')]
					}),
					N('drink/beer', 'Barley beer', { river: 'strong', coast: 'favours', desert: 'resists', mountain: 'resists' }, {
						about: ['liquid', 'grain', 'plenty', 'labour', 'festivity'],
						readings: [...R('bind', 'takers', 'takers'), ...R('heal', 'body', null), ...R('commune', 'spirit', 'gods')]
					}),
					N('drink/wine', 'Wine', { coast: 'favours', desert: 'favours', mountain: 'favours', steppe: 'resists', marsh: 'resists', forest: 'resists' }, {
						about: ['liquid', 'blood', 'vine', 'wealth', 'light'],
						readings: [
							...R('commune', 'spirit', 'gods', 'beyond/otherworld'),
							...R('cleanse', 'spirit', null),
							...R('inspire', 'spirit', null),
							...R('heal', 'body', null)
						]
					}),
					N('plant/herb', 'Herb', { marsh: 'strong', mountain: 'favours', desert: 'resists' }, {
						about: ['plants', 'vision', 'smoke'],
						readings: [
							...R('inspire', 'spirit', null),
							...R('commune', 'spirit', 'beyond/otherworld', 'ancestors'),
							...R('cleanse', 'body', null),
							...R('cleanse', 'spirit', null),
							...R('heal', 'body', null)
						]
					}),
					N('plant/resin', 'Resin', { forest: 'strong', mountain: 'favours', desert: 'favours', marsh: 'resists' }, {
						about: ['sap', 'fragrance', 'smoke', 'permanence'],
						readings: [
							...R('cleanse', 'body', null),
							...R('cleanse', 'spirit', null),
							...R('commune', 'spirit', 'gods', 'beyond/otherworld'),
							...R('heal', 'body', null)
						]
					}),
					N('plant/fungus', 'Fungus', { forest: 'strong', marsh: 'favours', mountain: 'favours', desert: 'resists', steppe: 'resists' }, {
						about: ['fungus', 'vision', 'decay', 'darkness'],
						readings: [
							...R('inspire', 'spirit', null),
							...R('commune', 'spirit', 'beyond/otherworld', 'ancestors'),
							...R('cleanse', 'spirit', null),
							...R('heal', 'body', null)
						]
					}),
					N('animal/meat', 'Meat', { steppe: 'strong', forest: 'favours', river: 'favours', coast: 'favours', desert: 'resists', mountain: 'resists' }, {
						about: ['flesh', 'herds', 'blood', 'strength'],
						readings: [...R('bind', 'takers', 'takers', 'ancestors'), ...R('commune', 'spirit', 'gods', 'ancestors'), ...R('heal', 'body', null)]
					})
				]
			},
			{
				id: 'manner',
				label: 'taken',
				values: [
					N('drunk', 'drunk', undefined, { about: ['liquid', 'swallowing', 'inside'], readings: MANNER_READINGS }),
					N('eaten', 'eaten', undefined, { about: ['chewing', 'nourishment', 'inside'], readings: MANNER_READINGS }),
					N('inhaled', 'inhaled', undefined, { about: ['breath', 'air', 'inside'], readings: MANNER_READINGS }),
					N('smeared', 'smeared', undefined, { about: ['skin', 'marking', 'outside'], readings: MANNER_READINGS })
				]
			},
			...sequence(3, [
				{
					id: 'taker',
					label: 'taken by',
					size: [1, 3],
					values: [
						// A taker's `about` names its group, so readings can point at who else takes.
						N('gods', 'the gods', undefined, {
							about: ['gods', 'offering'],
							readings: [...R('commune', 'spirit', 'gods'), ...others(R('bind', 'takers', 'gods'))]
						}),
						N('chief', 'the chief', undefined, {
							about: ['chief/self', 'authority'],
							readings: [...R('inspire', 'spirit', null), ...others(R('bind', 'takers', 'chief/self'))]
						}),
						N('chief/family', "the chief's family", undefined, {
							about: ['chief/family', 'lineage'],
							readings: [...others(R('bind', 'takers', 'chief/family')), ...R('commune', 'spirit', 'ancestors')]
						}),
						N('priest', 'the priest or shaman', undefined, {
							about: ['priest/self', 'mediation'],
							readings: [...R('commune', 'spirit', 'gods', 'ancestors', 'beyond/otherworld'), ...R('inspire', 'spirit', null), ...R('cleanse', 'spirit', null)]
						}),
						N('priest/family', "the priest or shaman's family", undefined, {
							about: ['priest/family', 'calling'],
							readings: [...others(R('bind', 'takers', 'priest/family')), ...R('commune', 'spirit', 'ancestors')]
						}),
						N('tribe/rest', 'the rest of the tribe', undefined, {
							about: ['tribe/rest', 'belonging'],
							readings: [...R('bind', 'takers', 'takers'), ...R('heal', 'body', null)]
						})
					]
				}
			])
		],
		render: (n) => `${n[0]}, ${n[1]}: ${n.slice(2).filter(Boolean).join('; then ')}`
	},
	{
		id: 'place',
		domain: 'Rite',
		name: 'The holy place',
		// Contract: for a band that has this custom, every value assumes the band keeps one place set
		// apart for its powers; it assumes nothing about where, what stands there, or who may enter.
		// The sites are deictic rules (the nearest spring, the hill above the seat) for the engine to
		// resolve against the land round the seat; only the altar is built. Funeral's orientation
		// holy-place points here; a band without this custom is custom-level absence (4SD.11).
		features: [
			{
				id: 'site',
				label: 'site',
				values: [
					N('altar', 'An open-air fire altar', { steppe: 'strong', desert: 'favours' }, { about: ['fire', 'openness', 'craft'], readings: [...R('sanctify', 'land', null), ...R('honour', 'gods', null), ...R('commune', 'spirit', 'gods')] }),
					N('grove', 'A grove', { forest: 'strong' }, { about: ['trees', 'shade', 'sanctuary', 'hiddenness'], readings: [...R('sanctify', 'land', null), ...R('commune', 'spirit', 'gods', 'ancestors')] }),
					N('hilltop', 'A hilltop', { mountain: 'strong' }, { about: ['height', 'sky', 'openness', 'visibility'], readings: [...R('sanctify', 'land', null), ...R('commune', 'spirit', 'gods', 'beyond/sky')] }),
					N('spring', 'A spring', { river: 'favours', marsh: 'favours', forest: 'favours' }, { about: ['water', 'cleansing', 'growth'], readings: [...R('sanctify', 'land', null), ...R('cleanse', 'spirit', null), ...R('commune', 'spirit', 'gods')] }),
					N('headland', 'A headland', { coast: 'strong' }, { about: ['sea', 'distance', 'boundary', 'visibility'], readings: [...R('sanctify', 'land', null), ...R('mark', 'land', null), ...R('commune', 'spirit', 'gods', 'beyond/otherworld')] })
				]
			},
			{
				id: 'image',
				label: 'with',
				// An empty set is no image. The old no-image value favoured desert, steppe and marsh; an
				// empty set carries no affinity (parked with the other absence pulls).
				size: [0, 1],
				values: [
					N('stone', 'an unshaped stone', { mountain: 'favours', desert: 'favours', steppe: 'favours' }, { about: ['stone', 'permanence', 'plainness'], readings: [...R('mark', 'land', null), ...R('honour', 'gods', null)] }),
					N('post', 'a carved post', { forest: 'favours', river: 'favours', coast: 'favours' }, { about: ['craft', 'trees', 'visibility'], readings: [...R('mark', 'land', null), ...R('honour', 'gods', null)] }),
					N('hide', 'a painted hide', { steppe: 'favours', forest: 'favours' }, { about: ['craft', 'visibility', 'herds'], readings: [...R('mark', 'land', null), ...R('honour', 'gods', null)] })
				]
			},
			{
				id: 'access/sex',
				label: 'open to',
				// Empty is no restriction by sex.
				size: [0, 2],
				values: [N('male', 'men', undefined, { about: ['male', 'sanctuary'] }), N('female', 'women', undefined, { about: ['female', 'sanctuary'] })]
			},
			{
				id: 'access/role',
				label: 'open to',
				size: [1, 5],
				values: [
					N('chief', 'the chief', undefined, { about: ['chief/self', 'sanctuary'] }),
					N('chief/family', "the chief's family", undefined, { about: ['chief/family', 'sanctuary'] }),
					N('priest', 'the priest or shaman', undefined, { about: ['priest/self', 'sanctuary'] }),
					N('priest/family', "the priest or shaman's family", undefined, { about: ['priest/family', 'sanctuary'] }),
					N('tribe/rest', 'the rest of the tribe', undefined, { about: ['tribe/rest', 'sanctuary'] })
				]
			}
		],
		render: (n) => `${n[0]}${n[1] ? ` with ${n[1]}` : ''}, open to ${n[3]}${n[2] ? ` (${n[2]})` : ''}`
	},
	{
		id: 'gender',
		domain: 'Kinship',
		name: 'The kinds of people',
		// Contract: for a band that has this custom, every value assumes the people sort themselves by
		// sex in some way; it assumes nothing about which expressions are recognised. Every other custom
		// that names a sex draws on these four nouns; keeping them consistent with what a band
		// recognises is a cross-custom constraint for 6SL.5. How gender is assigned waits for 4SD.10.
		features: [
			{
				id: 'kinds',
				label: 'recognised',
				size: [1, 4],
				values: [
					N('male', 'men', undefined, { about: ['male'] }),
					N('female', 'women', undefined, { about: ['female'] }),
					N('both', 'those who are both', undefined, { about: ['sex/both'] }),
					N('neither', 'those who are neither', undefined, { about: ['sex/neither'] })
				]
			}
		],
		render: (n) => `Recognised: ${n[0]}`
	},
	{
		id: 'livelihood',
		domain: 'Land',
		name: 'How they are fed',
		// Contract: for a band that has this custom, every value assumes the band draws its food from
		// the land by a rule; it assumes nothing about which sources, how many, or who does the work.
		// Up to three sources, each with its own labour. Strain here is hunger: it hits prosperity.
		strain: 'food',
		features: each(3, [
			{
				id: 'source',
				label: 'fed by',
				size: [1, 1],
				values: [
					N('herds/large', 'cattle and horses', { steppe: 'strong', desert: 'favours', mountain: 'favours', forest: 'resists', marsh: 'resists' }, { about: ['herds', 'wealth', 'hierarchy', 'male'], readings: [...R('provide', 'living', 'plenty'), ...R('guard', 'herds', null)] }),
					N('herds/small', 'sheep and goats', { mountain: 'strong', desert: 'favours', steppe: 'favours', marsh: 'resists' }, { about: ['herds', 'thrift', 'patience'], readings: [...R('provide', 'living', 'nourishment'), ...R('guard', 'herds', null)] }),
					N('crop/hoe', 'hoe crops', { forest: 'strong', marsh: 'favours', river: 'favours', desert: 'resists', steppe: 'resists' }, { about: ['grain', 'growth', 'labour', 'female'], readings: [...R('provide', 'living', 'nourishment'), ...R('create', 'grain', null)] }),
					N('crop/plough', 'plough crops', { river: 'strong', coast: 'favours', forest: 'resists', mountain: 'resists', marsh: 'resists', desert: 'resists' }, { about: ['grain', 'plenty', 'labour', 'permanence'], readings: [...R('provide', 'living', 'plenty'), ...R('create', 'grain', null)] }),
					N('catch', 'the catch', { coast: 'strong', river: 'strong', marsh: 'strong', steppe: 'resists', desert: 'excludes' }, { about: ['water', 'wild', 'plenty'], readings: R('provide', 'living', 'nourishment') }),
					N('hunt', 'the hunt', { forest: 'strong', mountain: 'favours', steppe: 'favours' }, { about: ['wild', 'chase', 'strength'], readings: [...R('provide', 'living', 'nourishment'), ...R('guard', 'wild', null)] }),
					N('gather', 'gathering', { forest: 'favours', marsh: 'favours', coast: 'favours' }, { about: ['plants', 'patience', 'thrift'], readings: R('provide', 'living', 'nourishment') })
				]
			},
			{
				id: 'labour',
				label: 'worked by',
				applies: { part: 'source', stage: 'same', has: 'anyMember' },
				values: [
					N('male', 'the men', undefined, { about: ['male', 'strength', 'hierarchy'], readings: R('provide', 'living', 'nourishment') }),
					N('female', 'the women', undefined, { about: ['female', 'growth', 'nourishment'], readings: R('provide', 'living', 'nourishment') }),
					N('shared', 'all together', undefined, { about: ['equality', 'belonging'], readings: R('provide', 'living', 'nourishment') })
				]
			}
		]),
		render: (n) => [n[0] && `${n[0]} (${n[1]})`, n[2] && `${n[2]} (${n[3]})`, n[4] && `${n[4]} (${n[5]})`].filter(Boolean).join(', ')
	},
	{
		id: 'descent',
		domain: 'Kinship',
		name: 'Descent and the household',
		// Contract: for a band that has this custom, every value assumes belonging and property pass
		// between generations by a rule; it assumes nothing about which line, where a couple lives, or
		// who inherits. The affinities here are a terrain proxy for livelihood (herds pull towards the
		// father's line and the husband's kin, hoe crops towards the mother's); 6SL.3 should read
		// livelihood's tags instead and retire them.
		features: [
			{
				id: 'line',
				label: 'line',
				values: [
					N('father', "the father's line", { steppe: 'strong', desert: 'favours', mountain: 'favours' }, { about: ['lineage', 'male', 'kinship', 'hierarchy'], readings: [...R('bind', 'living', 'lineage'), ...R('guard', 'lineage', null)] }),
					N('mother', "the mother's line", { forest: 'favours', marsh: 'favours', coast: 'favours' }, { about: ['lineage', 'female', 'kinship'], readings: [...R('bind', 'living', 'lineage'), ...R('guard', 'lineage', null)] }),
					N('house', 'the house', { river: 'favours', coast: 'favours' }, { about: ['hearth', 'enclosure', 'continuity'], readings: [...R('bind', 'living', 'hearth'), ...R('guard', 'hearth', null)] }),
					N('both', 'both parents', undefined, { about: ['kinship', 'equality', 'belonging'], readings: R('bind', 'living', 'kinship') })
				]
			},
			{
				id: 'residence',
				label: 'couples live',
				values: [
					N('husband', "with the husband's kin", { steppe: 'favours', desert: 'favours', mountain: 'favours' }, { about: ['male', 'kinship', 'hierarchy'], readings: [...R('guard', 'hearth', null), ...R('bind', 'living', 'kinship')] }),
					N('wife', "with the wife's kin", { forest: 'favours', marsh: 'favours' }, { about: ['female', 'kinship', 'hearth'], readings: [...R('guard', 'hearth', null), ...R('bind', 'living', 'kinship')] }),
					N('new', 'at a new hearth', { river: 'favours', coast: 'favours' }, { about: ['hearth', 'origin', 'freedom'], readings: R('create', 'hearth', null) })
				]
			},
			{
				id: 'heirs',
				label: 'the estate passes to',
				values: [
					N('children', 'the children', undefined, { about: ['lineage', 'continuity', 'kinship'], readings: R('provide', 'living', 'continuity') }),
					N('sister-children', "the sister's children", undefined, { about: ['kinship', 'female', 'lineage'], readings: [...R('provide', 'living', 'continuity'), ...R('bind', 'living', 'kinship')] })
				]
			},
			{
				id: 'share',
				label: 'shared',
				values: [
					N('eldest', 'to the eldest', { river: 'favours', mountain: 'favours' }, { about: ['age', 'hierarchy', 'permanence'], readings: R('bind', 'living', 'hierarchy') }),
					N('youngest', 'to the youngest', { steppe: 'favours', desert: 'favours' }, { about: ['youth', 'hearth', 'continuity'], readings: R('guard', 'hearth', null) }),
					N('equal', 'equally', undefined, { about: ['equality', 'division', 'thrift'], readings: R('bind', 'living', 'equality') })
				]
			}
		],
		render: (n) => `Through ${n[0]}; couples live ${n[1]}; the estate passes to ${n[2]}, ${n[3]}`
	},
	{
		id: 'rule',
		domain: 'Kinship',
		name: 'Who rules',
		// Contract: for a band that has this custom, every value assumes someone holds authority over
		// the band; it assumes nothing about who, how they are chosen, how long they hold it, or what
		// sacred duty goes with it.
		features: [
			{
				id: 'seat',
				label: 'seat',
				values: [
					N('one', 'One ruler', undefined, { about: ['authority', 'identity', 'hierarchy'], readings: [...R('rule', 'living', null), ...R('judge', 'living', 'justice')] }),
					N('council', 'A council', undefined, { about: ['belonging', 'custom', 'equality'], readings: [...R('rule', 'living', null), ...R('judge', 'living', 'justice'), ...R('bind', 'living', 'custom')] })
				]
			},
			{
				id: 'source',
				label: 'by right of',
				values: [
					N('sacred', 'sanctity', { river: 'favours', desert: 'favours' }, { about: ['mediation', 'sanctuary', 'authority'], readings: [...R('rule', 'living', null), ...R('commune', 'spirit', 'gods'), ...R('honour', 'gods', null)] }),
					N('war', 'war', { steppe: 'strong' }, { about: ['violence', 'strength', 'guardianship'], readings: [...R('rule', 'living', null), ...R('guard', 'living', null), ...R('win', 'land', 'living')] }),
					N('age', 'age', { forest: 'strong', marsh: 'favours' }, { about: ['age', 'memory', 'custom'], readings: [...R('rule', 'living', null), ...R('judge', 'living', 'justice'), ...R('guard', 'custom', null)] }),
					N('wealth', 'wealth', { coast: 'strong' }, { about: ['wealth', 'hierarchy', 'craft'], readings: [...R('rule', 'living', null), ...R('provide', 'living', 'plenty')] }),
					N('law', 'law', { mountain: 'favours', desert: 'favours' }, { about: ['justice', 'custom', 'mediation'], readings: [...R('rule', 'living', null), ...R('judge', 'living', 'justice'), ...R('guard', 'custom', null)] })
				]
			},
			{
				id: 'tenure',
				label: 'tenure',
				values: [
					N('life', 'for life', undefined, { about: ['permanence', 'continuity'], readings: R('bind', 'living', 'continuity') }),
					N('until-defeated', 'until defeated', undefined, { about: ['violence', 'strength', 'endurance'], readings: R('guard', 'living', null) }),
					N('yearly', 'for a year', undefined, { about: ['cycle', 'renewal', 'equality'], readings: R('renew', 'living', 'renewal') })
				]
			},
			{
				id: 'chosen',
				label: 'chosen by',
				values: [
					N('birth', 'birth', undefined, { about: ['lineage', 'continuity', 'hierarchy'], readings: R('bind', 'living', 'lineage') }),
					N('election', 'election', undefined, { about: ['equality', 'trust', 'belonging'], readings: R('bind', 'living', 'trust') }),
					N('lot', 'lot', undefined, { about: ['chance', 'equality', 'gods'], readings: R('bind', 'living', 'gods') })
				]
			},
			{
				id: 'duty',
				label: 'sacred duty',
				values: [
					N('fire', 'keeps the fire', undefined, { about: ['fire', 'hearth', 'guardianship'], readings: [...R('guard', 'fire', null), ...R('honour', 'gods', null)] }),
					N('ancestors', 'speaks with the ancestors', undefined, { about: ['ancestors', 'memory', 'mediation'], readings: [...R('commune', 'spirit', 'ancestors'), ...R('honour', 'ancestors', null)] }),
					N('herds', 'wards the herds', { steppe: 'favours', desert: 'favours' }, { about: ['herds', 'wealth', 'guardianship'], readings: [...R('guard', 'herds', null), ...R('provide', 'living', 'plenty')] }),
					N('waters', 'reads the waters', { coast: 'favours', river: 'favours', marsh: 'favours' }, { about: ['water', 'cycle', 'plenty'], readings: [...R('provide', 'living', 'plenty'), ...R('honour', 'gods', null)] })
				]
			}
		],
		render: (n) => `${n[0]} by right of ${n[1]}, ${n[2]}, chosen by ${n[3]}, who ${n[4]}`
	},
	{
		id: 'youth',
		domain: 'Kinship',
		name: 'How the young are made adult',
		// Contract: for a band that has this custom, every value assumes the young pass into adulthood
		// by a rite; it assumes nothing about the trial, when, or the mark it leaves. Up to two rites,
		// each for a set of the kinds of people: one rite for {men} is one sex only, one for {men, women}
		// is shared, two rites are different rites.
		features: each(2, [
			{
				id: 'for',
				label: 'for',
				size: [1, 4],
				values: [
					N('male', 'men', undefined, { about: ['male', 'youth'] }),
					N('female', 'women', undefined, { about: ['female', 'youth'] }),
					N('both', 'those who are both', undefined, { about: ['sex/both', 'youth'] }),
					N('neither', 'those who are neither', undefined, { about: ['sex/neither', 'youth'] })
				]
			},
			{
				id: 'rite',
				label: 'rite',
				applies: { part: 'for', stage: 'same', has: 'anyMember' },
				values: [
					N('raid', 'wolf-bands raiding abroad', { steppe: 'strong', forest: 'favours' }, { about: ['violence', 'wild', 'strength', 'youth'], readings: [...R('win', 'wealth', 'living'), ...R('guard', 'living', null), ...R('bind', 'living', 'belonging')] }),
					N('craft', 'apprenticed to a craft', { river: 'strong', coast: 'favours' }, { about: ['craft', 'labour', 'patience'], readings: [...R('provide', 'living', 'plenty'), ...R('bind', 'living', 'custom')] }),
					N('fast', 'a vision-fast', { mountain: 'strong', desert: 'favours' }, { about: ['vision', 'patience', 'hiddenness'], readings: [...R('commune', 'spirit', 'gods', 'beyond/otherworld'), ...R('inspire', 'spirit', null)] }),
					N('wed', 'early marriage', { marsh: 'favours', river: 'favours' }, { about: ['kinship', 'continuity', 'youth'], readings: R('bind', 'living', 'kinship') })
				]
			},
			{
				id: 'age',
				label: 'at',
				applies: { part: 'for', stage: 'same', has: 'anyMember' },
				values: [
					N('fixed/twelve', 'twelve', undefined, { about: ['youth', 'custom'] }),
					N('fixed/sixteen', 'sixteen', undefined, { about: ['youth', 'strength', 'custom'] }),
					N('sign', 'first beard or blood', undefined, { about: ['renewal', 'growth', 'blood'] })
				]
			},
			{
				id: 'mark',
				label: 'then',
				applies: { part: 'for', stage: 'same', has: 'anyMember' },
				size: [1, 2],
				values: [
					N('scar', 'scarred', undefined, { about: ['marking', 'skin', 'permanence'], readings: R('bind', 'living', 'belonging') }),
					N('tattoo', 'tattooed', undefined, { about: ['marking', 'skin', 'identity', 'craft'], readings: R('bind', 'living', 'identity') }),
					N('name', 'given a new name', undefined, { about: ['identity', 'voice', 'renewal'], readings: R('bind', 'living', 'identity') }),
					N('shorn', 'shorn', undefined, { about: ['marking', 'renewal', 'plainness'], readings: R('bind', 'living', 'belonging') })
				]
			}
		]),
		render: (n) => [0, 4].map((k) => n[k] && `${n[k]}: ${n[k + 1]}, at ${n[k + 2]}, then ${n[k + 3]}`).filter(Boolean).join('; ')
	},
	{
		id: 'guest',
		domain: 'Kinship',
		name: 'The stranger at the door',
		// Contract: for a band that has this custom, every value assumes a stranger who arrives is dealt
		// with by a rule; it assumes nothing about whether they are taken in, what token passes, or for
		// how long. Everything past the stance applies only when the stance shelters: nothing passes
		// and no span runs for a stranger turned away.
		features: [
			{
				id: 'stance',
				label: 'stance',
				values: [
					N('welcome', 'Strangers taken in', undefined, { about: ['sanctuary', 'threshold', 'trust'], readings: [...R('shelter', 'stranger', null), ...R('guard', 'stranger', null), ...R('bind', 'stranger', 'living')] }),
					N('bar', 'Strangers barred', { marsh: 'strong', mountain: 'favours', steppe: 'resists', desert: 'resists', coast: 'resists' }, { about: ['boundary', 'fear', 'enclosure'], readings: R('guard', 'living', null) })
				]
			},
			{
				id: 'basis',
				label: 'by',
				applies: SHELTERED,
				values: [
					N('sacred', 'sacred guest-right', { steppe: 'strong', desert: 'strong' }, { about: ['sanctuary', 'mediation', 'gods'], readings: [...R('honour', 'gods', null), ...R('bind', 'stranger', 'gods')] }),
					N('gift', 'feast-gift rivalry', { coast: 'strong', forest: 'favours', river: 'favours' }, { about: ['wealth', 'festivity', 'hierarchy'], readings: [...R('provide', 'stranger', 'plenty'), ...R('bind', 'stranger', 'living')] }),
					N('hostage', 'exchange of hostages', { mountain: 'favours' }, { about: ['trust', 'kinship', 'boundary'], readings: [...R('bind', 'stranger', 'living'), ...R('guard', 'living', null)] })
				]
			},
			{ id: 'gift/stranger', label: 'the stranger brings', applies: SHELTERED, size: [0, 1], values: TOKENS },
			{ id: 'gift/host', label: 'the host gives', applies: SHELTERED, size: [0, 1], values: TOKENS },
			{
				id: 'unit',
				label: 'shelter for',
				applies: SHELTERED,
				values: [
					N('meals', 'meals', undefined, { about: ['nourishment', 'thrift'], readings: R('shelter', 'stranger', null) }),
					N('nights', 'nights', undefined, { about: ['rest', 'hearth'], readings: R('shelter', 'stranger', null) }),
					// No readings by design: an open stay takes no number.
					N('open', 'as long as they choose', undefined, { about: ['freedom', 'trust'] })
				]
			},
			{
				id: 'count',
				label: 'how many',
				applies: [SHELTERED, { part: 'unit', has: 'anyReading' }],
				values: [N('one', 'one', undefined, { about: ['thrift', 'boundary'] }), N('three', 'three', undefined, { about: ['custom', 'boundary'] })]
			}
		],
		render: (n) => {
			if (!n[1]) return n[0];
			const gifts = [n[2] && `the stranger brings ${n[2]}`, n[3] && `the host gives ${n[3]}`].filter(Boolean).join(', ');
			return `${n[0]} by ${n[1]}${gifts ? `; ${gifts}` : ''}; shelter for ${n[5] ? `${n[5]} ` : ''}${n[4]}`;
		}
	},
	{
		id: 'marriage',
		domain: 'Kinship',
		name: 'Marriage',
		// Contract: for a band that has this custom, every value assumes a union between households is
		// made by a rule; it assumes nothing about what passes between them, who may be taken, or how
		// many. Who may be taken is deictic: the engine resolves it against the band tree (kin distance
		// in splits, with a threshold for `band/kin`) and against which bands are in contact; a rule
		// with no one in reach is pressure for 6SL.3.
		features: [
			{ id: 'gift/groom', label: "the groom's side gives", size: [0, 1], values: DOWRY },
			{ id: 'gift/bride', label: "the bride's side gives", size: [0, 1], values: DOWRY },
			{
				id: 'people',
				label: 'taken from',
				values: [
					N('own', 'this people', undefined, { about: ['belonging', 'kinship'], readings: R('bind', 'living', 'belonging') }),
					N('other', 'another people', undefined, { about: ['distance', 'stranger', 'wealth'], readings: R('bind', 'living', 'stranger') })
				]
			},
			{
				id: 'band',
				label: 'from',
				applies: { part: 'people', has: { target: 'belonging' } },
				values: [
					N('own', 'within the band', undefined, { about: ['belonging', 'kinship', 'nearness'], readings: R('bind', 'living', 'kinship') }),
					N('kin', 'a kindred band', undefined, { about: ['kinship', 'lineage', 'trust'], readings: R('bind', 'living', 'lineage') }),
					N('any', 'any band', undefined, { about: ['distance', 'belonging', 'trust'], readings: R('bind', 'living', 'belonging') })
				]
			},
			{
				id: 'degree',
				label: 'degree',
				values: [
					N('cousin', 'a cousin', undefined, { about: ['kinship', 'nearness', 'lineage'], readings: R('bind', 'living', 'lineage') }),
					N('distant', 'no close kin', undefined, { about: ['distance', 'boundary', 'trust'], readings: R('bind', 'living', 'belonging') })
				]
			},
			{
				id: 'count',
				label: 'spouses',
				values: [
					// No readings by design: one spouse takes no plural.
					N('one', 'one spouse', undefined, { about: ['equality', 'intimacy'] }),
					N('many', 'many', undefined, { about: ['hierarchy', 'wealth', 'plenty'], readings: R('bind', 'living', 'kinship') })
				]
			},
			{
				id: 'plural',
				label: 'many',
				applies: { part: 'count', has: 'anyReading' },
				values: [
					N('wives', 'wives', undefined, { about: ['female', 'wealth', 'hierarchy'], readings: R('provide', 'living', 'continuity') }),
					N('husbands', 'husbands, brothers sharing a wife', { mountain: 'favours', desert: 'favours' }, { about: ['male', 'thrift', 'kinship'], readings: R('guard', 'hearth', null) })
				]
			}
		],
		render: (n) => {
			const gifts = [n[0] && `the groom's side gives ${n[0]}`, n[1] && `the bride's side gives ${n[1]}`].filter(Boolean).join(', ');
			return `Taken from ${n[2]}${n[3] ? `, ${n[3]}` : ''}, ${n[4]}; ${n[6] ? `many ${n[6]}` : n[5]}${gifts ? `; ${gifts}` : ''}`;
		}
	},
	{
		id: 'justice',
		domain: 'Law',
		name: 'Justice for a killing',
		// Contract: for a band that has this custom, every value assumes a killing among them is
		// answered by a rule; it assumes nothing about how guilt is found, what the remedy is, who
		// answers for it, or whether the killer is made clean. A chief answering for a killer belongs
		// to killings between bands, which wait for a cross-band relationship system.
		features: [
			{
				id: 'finding',
				label: 'guilt found by',
				values: [
					N('ordeal/water', 'ordeal by water', { marsh: 'strong', river: 'favours', coast: 'favours', desert: 'excludes' }, { about: ['water', 'chance', 'cleansing'], readings: [...R('judge', 'killer', 'justice'), ...R('appease', 'gods', null)] }),
					N('assembly', "the assembly's judgement", { forest: 'favours', coast: 'favours' }, { about: ['belonging', 'custom', 'justice'], readings: [...R('judge', 'killer', 'justice'), ...R('bind', 'living', 'custom')] }),
					N('oath', 'sworn oath', undefined, { about: ['trust', 'gods', 'voice'], readings: [...R('judge', 'killer', 'justice'), ...R('bind', 'killer', 'gods')] })
				]
			},
			{
				id: 'remedy',
				label: 'remedy',
				values: [
					N('price', 'blood-price', { steppe: 'strong', forest: 'favours' }, { about: ['wealth', 'thrift', 'kinship'], readings: [...R('atone', 'killer', 'living'), ...R('bind', 'killer', 'living')] }),
					N('exile', 'exile', { mountain: 'strong', desert: 'favours' }, { about: ['boundary', 'abandonment', 'distance'], readings: [...R('atone', 'killer', 'living'), ...R('guard', 'living', null)] }),
					N('feud', 'feud', { steppe: 'favours', mountain: 'favours' }, { about: ['violence', 'kinship', 'blood'], readings: [...R('atone', 'killer', 'dead'), ...R('appease', 'dead', null), ...R('guard', 'living', null)] })
				]
			},
			{
				id: 'answerer',
				label: 'answered by',
				values: [
					N('killer', 'the killer alone', undefined, { about: ['identity', 'guilt'], readings: R('atone', 'killer', 'living') }),
					N('kin', "the killer's kin", undefined, { about: ['kinship', 'lineage', 'belonging'], readings: [...R('atone', 'killer', 'living'), ...R('bind', 'living', 'kinship')] })
				]
			},
			{
				id: 'cleansing',
				label: 'made clean by',
				// An empty set is a killer never clean again.
				size: [0, 2],
				values: [
					N('fire', 'fire', { mountain: 'favours', desert: 'favours', steppe: 'favours' }, { about: ['fire', 'purity', 'cleansing'], readings: [...R('cleanse', 'killer', null), ...R('appease', 'gods', null)] }),
					N('water', 'water', { river: 'favours', coast: 'favours', marsh: 'favours' }, { about: ['water', 'purity', 'cleansing'], readings: [...R('cleanse', 'killer', null), ...R('appease', 'gods', null)] }),
					N('silence', "a year's silence", undefined, { about: ['stillness', 'patience', 'shame'], readings: [...R('cleanse', 'killer', null), ...R('atone', 'killer', 'living')] })
				]
			}
		],
		render: (n) => `Guilt found by ${n[0]}; ${n[1]}, answered by ${n[2]}; ${n[3] ? `made clean by ${n[3]}` : 'never clean again'}`
	},
	{
		id: 'oath',
		domain: 'Law',
		name: 'The oath',
		// Contract: for a band that has this custom, every value assumes a promise is bound by something
		// beyond the one who makes it; it assumes nothing about what it is sworn on, who witnesses it,
		// or what a breach brings.
		features: [
			{
				id: 'on',
				label: 'sworn on',
				values: [
					N('fire', 'fire', { mountain: 'favours', desert: 'favours', steppe: 'favours' }, { about: ['fire', 'purity', 'light'], readings: [...R('bind', 'living', 'gods'), ...R('honour', 'gods', null)] }),
					N('water', 'water', { river: 'strong', coast: 'favours', marsh: 'favours' }, { about: ['water', 'cleansing', 'depth'], readings: [...R('bind', 'living', 'gods'), ...R('honour', 'gods', null)] }),
					N('bones', "the ancestors' bones", { forest: 'favours', mountain: 'favours' }, { about: ['ancestors', 'bone', 'memory'], readings: [...R('bind', 'living', 'ancestors'), ...R('honour', 'ancestors', null)] }),
					N('weapons', 'weapons', { steppe: 'strong' }, { about: ['violence', 'strength', 'authority'], readings: [...R('bind', 'living', 'custom'), ...R('guard', 'living', null)] })
				]
			},
			{
				id: 'witness',
				label: 'before',
				size: [1, 3],
				values: [
					N('assembly', 'the assembly', undefined, { about: ['belonging', 'custom'], readings: R('bind', 'living', 'custom') }),
					N('chief', 'the chief', undefined, { about: ['authority', 'chief/self'], readings: R('bind', 'living', 'chief/self') }),
					N('gods', 'the gods', undefined, { about: ['gods', 'mediation'], readings: R('bind', 'living', 'gods') })
				]
			},
			{
				id: 'penalty',
				label: 'a breaker suffers',
				size: [1, 2],
				values: [
					N('outlawry', 'outlawry', undefined, { about: ['abandonment', 'boundary', 'distance'], readings: [...R('judge', 'breaker', 'justice'), ...R('guard', 'living', null)] }),
					N('death', 'death', undefined, { about: ['ending', 'violence', 'fear'], readings: R('judge', 'breaker', 'justice') }),
					N('fine', 'a fine', undefined, { about: ['wealth', 'thrift'], readings: R('atone', 'breaker', 'living') }),
					N('curse', 'a curse', undefined, { about: ['shame', 'voice', 'memory'], readings: R('judge', 'breaker', 'shame') })
				]
			},
			{
				id: 'imposer',
				label: 'imposed by',
				values: [
					N('assembly', 'the assembly', undefined, { about: ['belonging', 'custom', 'justice'], readings: R('judge', 'breaker', 'justice') }),
					N('chief', 'the chief', undefined, { about: ['authority', 'chief/self'], readings: R('judge', 'breaker', 'justice') }),
					N('gods', 'the gods', undefined, { about: ['gods', 'fear', 'mediation'], readings: [...R('judge', 'breaker', 'justice'), ...R('appease', 'gods', null)] }),
					N('poets', 'the poets', undefined, { about: ['voice', 'memory', 'shame'], readings: R('judge', 'breaker', 'shame') })
				]
			}
		],
		render: (n) => `Sworn on ${n[0]} before ${n[1]}; a breaker suffers ${n[2]}, imposed by ${n[3]}`
	},
	{
		id: 'memory',
		domain: 'Law',
		name: 'How the past is kept',
		// Contract: for a band that has this custom, every value assumes the past is kept deliberately
		// by someone; it assumes nothing about the medium, the matter kept, or the occasion. A people
		// keeps several matters on several occasions, so both are sets.
		features: [
			{
				id: 'medium',
				label: 'medium',
				values: [
					N('voice/verse', 'Poets of praise and blame', { steppe: 'favours', forest: 'favours' }, { about: ['voice', 'memory', 'authority'], readings: [...R('hold', 'memory', null), ...R('judge', 'living', 'justice'), ...R('honour', 'ancestors', null)] }),
					N('voice/song', 'Singers', { coast: 'favours', river: 'favours' }, { about: ['voice', 'memory', 'kinship'], readings: [...R('hold', 'memory', null), ...R('bind', 'living', 'kinship'), ...R('honour', 'ancestors', null)] }),
					N('stone', 'Carved stones', { mountain: 'strong', desert: 'favours' }, { about: ['stone', 'permanence', 'memory', 'visibility'], readings: [...R('hold', 'memory', null), ...R('mark', 'land', null), ...R('honour', 'ancestors', null)] }),
					N('dance', 'Masked dancers', { marsh: 'strong', forest: 'favours' }, { about: ['festivity', 'memory', 'presence'], readings: [...R('hold', 'memory', null), ...R('commune', 'spirit', 'ancestors'), ...R('honour', 'ancestors', null)] })
				]
			},
			{
				id: 'what',
				label: 'matter',
				size: [1, 4],
				values: [
					N('lineages', 'the lineages of chiefs', undefined, { about: ['lineage', 'kinship', 'hierarchy'], readings: [...R('hold', 'memory', null), ...R('bind', 'living', 'lineage')] }),
					N('deeds', 'the deeds of heroes', undefined, { about: ['hero', 'origin', 'identity'], readings: [...R('hold', 'memory', null), ...R('honour', 'hero', null)] }),
					N('boundaries', 'the boundaries of the land', { river: 'favours', coast: 'favours' }, { about: ['land', 'boundary', 'custom'], readings: [...R('hold', 'memory', null), ...R('mark', 'land', null), ...R('guard', 'land', null)] }),
					N('dead', 'the names of the dead', undefined, { about: ['dead', 'memory', 'continuity'], readings: [...R('hold', 'memory', null), ...R('honour', 'ancestors', null), ...R('commune', 'spirit', 'ancestors')] })
				]
			},
			{
				id: 'when',
				label: 'occasion',
				size: [1, 3],
				values: [
					N('funerals', 'at funerals', undefined, { about: ['dead', 'ending', 'memory'], readings: R('honour', 'ancestors', null) }),
					N('midwinter', 'at midwinter', undefined, { about: ['cold', 'darkness', 'renewal'], readings: [...R('honour', 'ancestors', null), ...R('renew', 'memory', 'renewal')] }),
					N('assembly', 'at the assembly', undefined, { about: ['belonging', 'custom', 'justice'], readings: [...R('bind', 'living', 'custom'), ...R('judge', 'living', 'justice')] })
				]
			}
		],
		render: (n) => `${n[0]}, keeping ${n[1]}, ${n[2]}`
	}
];

export const FEATURE_COUNT = SLOTS.reduce((a, s) => a + s.features.length, 0);
