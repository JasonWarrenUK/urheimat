import type { AffLevel, Affinity, FeatureDef, Reading, SlotDef, TraitValue, Terrain, Transition, ValueTags } from '$lib/types';
import type { Noun, Verb } from './vocabulary';

export const LAND: Terrain[] = ['coast', 'marsh', 'river', 'forest', 'steppe', 'desert', 'mountain'];

export const AFF_WEIGHT: Record<AffLevel, number> = { strong: 3, favours: 1.5, allows: 1, resists: 0.5, excludes: 0 };

// Legacy tables: numbers, and every terrain left out strains. Converted so the meaning is unchanged;
// the tagging task restates each one in named levels as it revisits the value.
type LegacyAff = Partial<Record<Terrain, number>>;
const legacyLevel = (n: number): AffLevel => (n >= 3 ? 'strong' : n >= 1.5 ? 'favours' : 'excludes');
const legacyAff = (a: LegacyAff): Affinity => Object.fromEntries(LAND.map((t) => [t, a[t] ? legacyLevel(a[t]) : 'excludes']));
const V = (name: string, aff?: LegacyAff, tags?: ValueTags): TraitValue => ({ name, aff: aff && legacyAff(aff), ...tags });
const ST: LegacyAff = { steppe: 3 };

// A value with an id naming its concept, named affinity levels and tags. The name is provisional
// display text; rendering transforms it downstream.
const N = (id: string, name: string, aff?: Affinity, tags?: ValueTags): TraitValue => ({ id, name, aff, ...tags });

// One row of a value's reading grid: a verb and object, with each target it can be aimed at
// (null = no target). Every value carries its full grid; cells left out were struck deliberately.
const R = (verb: Verb, object: Noun, ...targets: (Noun | null)[]): Reading[] =>
	targets.map((target) => (target === null ? { verb, object } : { verb, object, target }));
// Readings that hold only for certain material in hand.
const when = (readings: Reading[], ...material: Noun[]): Reading[] => readings.map((r) => ({ ...r, when: material }));
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

export const RICHNESS: Record<Terrain, number> = {
	coast: 0.3,
	marsh: -0.2,
	river: 0.5,
	forest: 0.2,
	steppe: 0,
	desert: -0.5,
	mountain: -0.3
};

// A custom is a small structure: each slot has features, each feature a set of values.
// A value's affinity: 3 = the terrain strongly favours it, 1.5 = favours, 0 = strains.
// A value with no affinity table is neutral: no terrain pulls on it and none strains against it.
export const SLOTS: SlotDef[] = [
	{
		id: 'highGod',
		domain: 'Cosmology',
		name: 'The greatest power',
		features: [
			{
				id: 'domain',
				label: 'domain',
				values: [
					V('Sky', { steppe: 3, mountain: 1.5, desert: 1.5 }),
					V('Storm', { mountain: 3, forest: 1.5 }),
					V('Sun', { desert: 3, steppe: 1.5 }),
					V('Earth', { river: 3, forest: 1.5 }),
					V('Sea', { coast: 3, marsh: 1.5 }),
					V('Fire', { mountain: 1.5, forest: 3 })
				]
			},
			{ id: 'role', label: 'person', values: [V('Father'), V('Mother'), V('Elder'), V('Lord')] },
			{
				id: 'consort',
				label: 'consort',
				values: [
					V('wedded to the Earth', { river: 1.5, forest: 1.5, steppe: 1.5 }),
					V('wedded to the Sea', { coast: 3, marsh: 1.5 }),
					V('unwed', { desert: 3, mountain: 1.5 }),
					V('wedded to the Dawn', { steppe: 3, desert: 1.5 })
				]
			}
		],
		render: (n) => `The ${n[0]} ${n[1]}, ${n[2]}`
	},
	{
		id: 'hero',
		domain: 'Cosmology',
		name: 'The founding tale',
		features: [
			{
				id: 'kind',
				label: 'the hero',
				values: [V('A twin pair'), V('An orphan'), V("A king's youngest son"), V('A woman')]
			},
			{
				id: 'deed',
				label: 'deed',
				values: [
					V('slew the serpent that held the waters', { river: 3, mountain: 1.5 }),
					V('raided the cattle of the gods', { steppe: 3, desert: 1.5 }),
					V('built the first house', { river: 1.5, forest: 1.5, coast: 1.5 }),
					V('returned from the drowned lands', { coast: 3, marsh: 1.5 }),
					V('cut the first furrow', { river: 3, forest: 1.5 }),
					V('stole fire from the heights', { mountain: 3, forest: 1.5 })
				]
			},
			{
				id: 'companion',
				label: 'helper',
				values: [
					V('nursed by wolves', { forest: 3, mountain: 1.5 }),
					V('guided by a horse', { steppe: 3 }),
					V('carried by a boat', { coast: 3, river: 1.5 }),
					V('helped by a bee', { forest: 1.5, river: 1.5, marsh: 1.5 }),
					V('alone', { desert: 3, mountain: 1.5 })
				]
			}
		],
		render: (n) => `${n[0]} who ${n[1]}, ${n[2]}`
	},
	{
		id: 'afterlife',
		domain: 'Cosmology',
		name: 'Where the dead go',
		features: [
			{
				id: 'dest',
				label: 'destination',
				values: [
					V('the pasture of the ancestors', { steppe: 3, desert: 1.5 }),
					V('beneath the mountain', { mountain: 3, desert: 1.5 }),
					V('down into the sea', { coast: 3 }),
					V('across the river', { river: 3, coast: 1.5 }),
					V('the winds', { desert: 3, steppe: 1.5 }),
					V('the grandchildren, to be born again', { forest: 1.5, river: 1.5, marsh: 1.5 })
				]
			},
			{
				id: 'passage',
				label: 'passage',
				values: [
					V('ferried', { river: 1.5, coast: 1.5, marsh: 1.5 }),
					V('on horseback', { steppe: 3, desert: 1.5 }),
					V('led by a hound', { forest: 3, mountain: 1.5 }),
					V('on their own feet', { mountain: 1.5, desert: 1.5 })
				]
			},
			{
				id: 'judge',
				label: 'judgement',
				values: [V('judged at a gate'), V('unjudged'), V('sorted by manner of death')]
			}
		],
		render: (n) => `To ${n[0]}, ${n[1]}, ${n[2]}`
	},
	{
		id: 'cult',
		domain: 'Cosmology',
		name: 'The daily cult',
		features: [
			{
				id: 'figure',
				label: 'figure',
				values: [
					V('The Dawn', { steppe: 3, desert: 1.5 }),
					V('The Moon', { desert: 3, steppe: 1.5 }),
					V('The Hearth-fire', { forest: 3, mountain: 1.5 }),
					V('The River', { river: 3, marsh: 1.5 }),
					V('The Tide', { coast: 3, marsh: 1.5 })
				]
			},
			{
				id: 'when',
				label: 'timing',
				values: [V('at dawn'), V('at dusk'), V('at each new moon'), V('before every meal')]
			},
			{
				id: 'who',
				label: 'officiant',
				values: [V('the eldest woman'), V('the household head'), V('a priest'), V('the children')]
			}
		],
		render: (n) => `${n[0]}, honoured ${n[1]} by ${n[2]}`
	},
	{
		id: 'sacrifice',
		domain: 'Rite',
		name: 'What is offered',
		features: [
			{
				id: 'victim',
				label: 'offering',
				values: [
					V('A horse', ST),
					V('Cattle', { steppe: 1.5, river: 1.5, forest: 1.5 }),
					V('First fruits', { river: 3, forest: 1.5 }),
					V('Fish and fowl', { coast: 3, marsh: 3 }),
					V('The hunted deer', { forest: 3, mountain: 1.5 }),
					V('Drink poured out', { desert: 1.5, mountain: 1.5 })
				]
			},
			{
				id: 'manner',
				label: 'manner',
				values: [
					V('burnt', { forest: 1.5, steppe: 1.5, mountain: 1.5 }),
					V('drowned', { coast: 1.5, river: 1.5, marsh: 1.5 }),
					V('buried', { river: 1.5, steppe: 1.5, desert: 1.5 }),
					V('shared in a feast')
				]
			},
			{
				id: 'occasion',
				label: 'occasion',
				values: [
					V('midwinter'),
					V('midsummer'),
					V('the first grass', { steppe: 1.5, river: 1.5, forest: 1.5 }),
					V('the first catch', { coast: 1.5, marsh: 1.5, river: 1.5 })
				]
			}
		],
		render: (n) => `${n[0]}, ${n[1]}, at ${n[2]}`
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
							...R('destroy', 'body', null),
							...R('destroy', 'spirit', null),
							...R('destroy', 'memory', null),
							...R('sanctify', 'body', null, 'beyond/otherworld', 'ancestors', 'gods'),
							...R('sanctify', 'spirit', null, 'beyond/otherworld', 'ancestors', 'gods'),
							...R('sanctify', 'memory', null),
							...R('release', 'body', 'beyond/otherworld', 'ancestors', 'gods'),
							...R('release', 'spirit', null, 'beyond/otherworld', 'ancestors', 'gods'),
							...R('release', 'memory', null),
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
								...R('destroy', 'body', null),
								...R('destroy', 'spirit', null),
								...R('destroy', 'memory', null),
								...R('sanctify', 'body', null, 'beyond/otherworld', 'ancestors', 'gods'),
								...R('sanctify', 'spirit', null, 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'body', 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'spirit', null, 'beyond/otherworld', 'ancestors', 'gods'),
								...R('release', 'memory', null),
								...R('transform', 'body', null, 'ancestors', 'gods'),
								...R('transform', 'spirit', null, 'ancestors', 'gods')
							]
						}
					),
					N('scatter', 'scattered', { steppe: 'favours', mountain: 'favours', coast: 'favours' }, {
						about: ['wind', 'sky', 'dispersal', 'lightness', 'freedom'],
						material: [T('ash', 'nothing'), T('dust', 'nothing'), T('bone', 'bone')],
						readings: [
							...when(R('destroy', 'body', null), 'ash', 'dust'), // bones scattered are bones still
							...R('destroy', 'spirit', null),
							...R('destroy', 'memory', null),
							...R('sanctify', 'body', null, 'beyond/sky', 'ancestors', 'gods'),
							...R('sanctify', 'spirit', null, 'beyond/sky', 'ancestors', 'gods'),
							...R('release', 'body', 'beyond/sky', 'beyond/stars', 'beyond/otherworld', 'ancestors', 'gods'),
							...R('release', 'spirit', null, 'beyond/sky', 'beyond/stars', 'beyond/otherworld', 'ancestors', 'gods'),
							...R('release', 'memory', null),
							...R('transform', 'body', null, 'beyond/sky', 'beyond/stars', 'ancestors'),
							...R('transform', 'spirit', null, 'beyond/sky', 'beyond/stars', 'ancestors')
						]
					}),
					N('keep', 'kept among the living', { marsh: 'resists' }, {
						about: ['presence', 'permanence', 'hearth', 'guardianship', 'nearness'],
						material: PASS,
						readings: [
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
							...R('destroy', 'spirit', null),
							...R('destroy', 'memory', null),
							...R('sanctify', 'body', null, 'ancestors', 'gods'),
							...R('release', 'spirit', null, 'beyond/otherworld', 'ancestors'),
							...R('transform', 'body', null, 'ancestors', 'gods'),
							...R('transform', 'spirit', 'ancestors')
						]
					}),
					N('pulverise', 'ground to dust', undefined, {
						about: ['dust', 'labour', 'intimacy', 'completion'],
						material: [T('bone', 'dust')],
						readings: [
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
							...R('return', 'remains', 'earth')
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
							...R('return', 'remains', 'earth', 'water')
						]
					}),
					N('water/open', 'in open water', { coast: 'strong', river: 'favours', marsh: 'favours', steppe: 'resists', mountain: 'resists', desert: 'excludes' }, {
						about: ['water', 'depth', 'passage', 'distance', 'cold', 'freedom'],
						readings: [...R('hide', 'remains', null), ...R('offer', 'remains', 'gods', 'water'), ...R('return', 'remains', 'ancestors', 'water')]
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
		id: 'drink',
		domain: 'Rite',
		name: 'The sacred drink',
		features: [
			{
				id: 'base',
				label: 'drink',
				values: [
					V('Mead', { forest: 3, steppe: 1.5 }),
					V("Fermented mare's milk", ST),
					V('Barley beer', { river: 3, coast: 1.5 }),
					V('Wine', { coast: 1.5, desert: 1.5, mountain: 1.5 }),
					V('No drink, but smoke', { mountain: 1.5, marsh: 3 })
				]
			},
			{
				id: 'sharing',
				label: 'sharing',
				values: [
					V('passed in one cup'),
					V('poured to the gods first'),
					V('taken by the chief alone'),
					V('taken by all together')
				]
			}
		],
		render: (n) => `${n[0]}, ${n[1]}`
	},
	{
		id: 'place',
		domain: 'Rite',
		name: 'The holy place',
		features: [
			{
				id: 'site',
				label: 'site',
				values: [
					V('An open-air fire altar', { steppe: 3, desert: 1.5 }),
					V('A grove', { forest: 3 }),
					V('A hilltop', { mountain: 3 }),
					V('A spring', { river: 1.5, marsh: 1.5, forest: 1.5 }),
					V('A headland', { coast: 3 })
				]
			},
			{
				id: 'image',
				label: 'image',
				values: [
					V('an unshaped stone', { mountain: 1.5, desert: 1.5, steppe: 1.5 }),
					V('a carved post', { forest: 1.5, river: 1.5, coast: 1.5 }),
					V('no image', { desert: 1.5, steppe: 1.5, marsh: 1.5 }),
					V('a painted hide', { steppe: 1.5, forest: 1.5 })
				]
			},
			{
				id: 'access',
				label: 'access',
				values: [V('open to all'), V('men only'), V('priests only'), V('women only')]
			}
		],
		render: (n) => `${n[0]} with ${n[1]}, ${n[2]}`
	},
	{
		id: 'descent',
		domain: 'Kinship',
		name: 'Descent and the household',
		features: [
			{
				id: 'line',
				label: 'line',
				values: [
					V('the father', { steppe: 3, desert: 1.5, mountain: 1.5 }),
					V('the mother', { forest: 1.5, marsh: 1.5, coast: 1.5 }),
					V('the house', { river: 1.5, coast: 1.5 })
				]
			},
			{
				id: 'residence',
				label: 'residence',
				values: [
					V("with the husband's kin", { steppe: 1.5, desert: 1.5, mountain: 1.5 }),
					V("with the wife's kin", { forest: 1.5, marsh: 1.5 }),
					V('at a new hearth', { river: 1.5, coast: 1.5 })
				]
			},
			{
				id: 'inherit',
				label: 'inheritance',
				values: [V('to the eldest'), V('divided equally'), V('to the youngest'), V("to the sister's son")]
			}
		],
		render: (n) => `Through ${n[0]}; couples live ${n[1]}; the estate passes ${n[2]}`
	},
	{
		id: 'rule',
		domain: 'Kinship',
		name: 'Who rules',
		features: [
			{
				id: 'ruler',
				label: 'ruler',
				values: [
					V('A sacral king', { river: 3, desert: 1.5 }),
					V('An elected war-chief', ST),
					V('A council of elders', { forest: 3, marsh: 1.5 }),
					V('The ship-lords', { coast: 3 }),
					V('A priest-judge', { mountain: 1.5, desert: 1.5 })
				]
			},
			{
				id: 'tenure',
				label: 'tenure',
				values: [V('for life'), V('until defeated'), V('chosen each year'), V('chosen by lot')]
			},
			{
				id: 'duty',
				label: 'sacred duty',
				values: [
					V('keeps the fire'),
					V('speaks with the ancestors'),
					V('wards the herds', { steppe: 1.5, desert: 1.5 }),
					V('reads the waters', { coast: 1.5, river: 1.5, marsh: 1.5 })
				]
			}
		],
		render: (n) => `${n[0]}, ${n[1]}, who ${n[2]}`
	},
	{
		id: 'youth',
		domain: 'Kinship',
		name: 'How the young are made adult',
		features: [
			{
				id: 'rite',
				label: 'rite',
				values: [
					V('Wolf-bands raiding abroad', { steppe: 3, forest: 1.5 }),
					V('Apprenticed to a craft', { river: 3, coast: 1.5 }),
					V('A vision-fast', { mountain: 3, desert: 1.5 }),
					V('Early marriage', { marsh: 1.5, river: 1.5 })
				]
			},
			{
				id: 'age',
				label: 'age',
				values: [V('at twelve'), V('at first beard or blood'), V('at sixteen')]
			},
			{
				id: 'mark',
				label: 'mark',
				values: [V('then scarred'), V('then tattooed'), V('then given a new name'), V('then shorn')]
			}
		],
		render: (n) => `${n[0]}, ${n[1]}, ${n[2]}`
	},
	{
		id: 'guest',
		domain: 'Kinship',
		name: 'The stranger at the door',
		features: [
			{
				id: 'rule',
				label: 'rule',
				values: [
					V('Sacred guest-right', { steppe: 3, desert: 3 }),
					V('Feast-gift rivalry', { coast: 3, forest: 1.5, river: 1.5 }),
					V('Exchange of hostages', { mountain: 1.5 }),
					V('Strangers barred', { marsh: 3, mountain: 1.5 })
				]
			},
			{
				id: 'token',
				label: 'token',
				values: [V('salt'), V('bread'), V('a ring'), V('water', { desert: 3, steppe: 1.5 })]
			},
			{
				id: 'span',
				label: 'duration',
				values: [V('three nights'), V('as long as the guest chooses'), V('one meal')]
			}
		],
		render: (n) =>
			n[0] === 'Strangers barred'
				? `Strangers barred unless they bring ${n[1]}; then shelter for ${n[2]}`
				: `${n[0]}: ${n[1]} shared, shelter for ${n[2]}`
	},
	{
		id: 'marriage',
		domain: 'Kinship',
		name: 'Marriage',
		features: [
			{
				id: 'payment',
				label: 'payment',
				values: [
					V('Bride-price in cattle', ST),
					V('Dowry in land', { river: 3 }),
					V('Exchange of sisters', { forest: 1.5, marsh: 1.5 }),
					V('Bride-service', { coast: 1.5, mountain: 1.5, desert: 1.5 })
				]
			},
			{
				id: 'partner',
				label: 'partner',
				values: [V('from another clan'), V('within the clan'), V('from another people'), V('a cousin')]
			},
			{
				id: 'form',
				label: 'form',
				values: [V('one spouse'), V('many wives'), V('brothers sharing a wife', { mountain: 1.5, desert: 1.5 })]
			}
		],
		render: (n) => `${n[0]}, ${n[1]}, ${n[2]}`
	},
	{
		id: 'justice',
		domain: 'Law',
		name: 'Justice for a killing',
		features: [
			{
				id: 'remedy',
				label: 'remedy',
				values: [
					V('Blood-price', { steppe: 3, forest: 1.5 }),
					V('Ordeal by water', { river: 1.5, marsh: 3, coast: 1.5 }),
					V('Exile', { mountain: 3, desert: 1.5 }),
					V("The assembly's judgement", { forest: 1.5, coast: 1.5 })
				]
			},
			{
				id: 'payer',
				label: 'who answers',
				values: [V('the killer alone'), V("the killer's kin"), V("the killer's chief")]
			},
			{
				id: 'cleansing',
				label: 'cleansing',
				values: [
					V('purified by fire', { mountain: 1.5, desert: 1.5, steppe: 1.5 }),
					V('purified by water', { river: 1.5, coast: 1.5, marsh: 1.5 }),
					V("purified by a year's silence"),
					V('never clean again')
				]
			}
		],
		render: (n) => `${n[0]}, answered by ${n[1]}, ${n[2]}`
	},
	{
		id: 'oath',
		domain: 'Law',
		name: 'The oath',
		features: [
			{
				id: 'on',
				label: 'sworn on',
				values: [
					V('Fire', { mountain: 1.5, desert: 1.5, steppe: 1.5 }),
					V('Water', { river: 3, coast: 1.5, marsh: 1.5 }),
					V("The ancestors' bones", { forest: 1.5, mountain: 1.5 }),
					V('Weapons', ST)
				]
			},
			{
				id: 'witness',
				label: 'witness',
				values: [V('before the assembly'), V('before the chief'), V('before the god alone')]
			},
			{
				id: 'breach',
				label: 'breach',
				values: [
					V('the breaker outlawed'),
					V('the breaker struck by the god'),
					V('the breaker fined'),
					V('the breaker cursed by the poets')
				]
			}
		],
		render: (n) => `${n[0]}, ${n[1]}; ${n[2]}`
	},
	{
		id: 'memory',
		domain: 'Law',
		name: 'How the past is kept',
		features: [
			{
				id: 'keeper',
				label: 'keepers',
				values: [
					V('Poets of praise and blame', { steppe: 1.5, forest: 1.5 }),
					V('Carved stones', { mountain: 3, desert: 1.5 }),
					V('Sung genealogies', { coast: 1.5, river: 1.5 }),
					V('Masked dancers', { marsh: 3, forest: 1.5 })
				]
			},
			{
				id: 'what',
				label: 'matter',
				values: [
					V('the lineages of chiefs'),
					V('the deeds of heroes'),
					V('the boundaries of the land', { river: 1.5, coast: 1.5 }),
					V('the names of the dead')
				]
			},
			{
				id: 'when',
				label: 'occasion',
				values: [V('at funerals'), V('at midwinter'), V('at the assembly')]
			}
		],
		render: (n) => `${n[0]}, keeping ${n[1]}, ${n[2]}`
	}
];

export const FEATURE_COUNT = SLOTS.reduce((a, s) => a + s.features.length, 0);
