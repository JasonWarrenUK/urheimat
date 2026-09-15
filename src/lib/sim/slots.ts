import type { SlotDef, TraitValue, Terrain } from '$lib/types';

const V = (name: string, aff?: Partial<Record<Terrain, number>>): TraitValue => ({ name, aff });
const ST: Partial<Record<Terrain, number>> = { steppe: 3 };

export const LAND: Terrain[] = ['coast', 'marsh', 'river', 'forest', 'steppe', 'desert', 'mountain'];

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
		features: [
			{
				id: 'disposal',
				label: 'disposal',
				values: [
					V('Mound burial', { steppe: 3, river: 1.5 }),
					V('Cremation', { forest: 3, river: 1.5 }),
					V('Sky exposure', { mountain: 3, desert: 1.5 }),
					V('Boat burial', { coast: 3 }),
					V('Bog offering', { marsh: 3 }),
					V('Cave interment', { mountain: 1.5, desert: 3 })
				]
			},
			{
				id: 'goods',
				label: 'grave goods',
				values: [
					V('weapons', { steppe: 1.5, forest: 1.5, mountain: 1.5 }),
					V('food and drink'),
					V('nothing', { desert: 1.5, marsh: 1.5 }),
					V('the tools of their trade', { river: 1.5, coast: 1.5 })
				]
			},
			{
				id: 'facing',
				label: 'orientation',
				values: [
					V('facing the dawn'),
					V('facing the water', { coast: 1.5, river: 1.5, marsh: 1.5 }),
					V('facing the homeland'),
					V('face down')
				]
			}
		],
		render: (n) => `${n[0]}, with ${n[1]}, ${n[2]}`
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
