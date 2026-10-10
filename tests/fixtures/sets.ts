import type { SlotDef } from '../../src/lib/types';

// A two-stage custom with one set-valued part per stage: who takes in each round. Values: 0 gods,
// 1 chief, 2 the rest. Stage one is never empty; stage two may be, which ends the sequence.
export const takers: SlotDef = {
	id: 'takers',
	domain: 'Rite',
	name: 'Takers',
	features: [
		{
			id: 's1.taker',
			label: 'first round',
			stage: 1,
			size: [1, 2],
			values: [
				{ id: 'gods', name: 'the gods', readings: [{ verb: 'offer', object: 'goods', target: 'gods' }] },
				{ id: 'chief', name: 'the chief' },
				{ id: 'rest', name: 'the rest' }
			]
		},
		{
			id: 's2.taker',
			label: 'second round',
			stage: 2,
			size: [0, 2],
			applies: { part: 'taker', stage: 'previous', has: 'anyMember' },
			values: [{ id: 'gods', name: 'the gods' }, { id: 'chief', name: 'the chief' }, { id: 'rest', name: 'the rest' }]
		},
		{
			id: 's3.taker',
			label: 'third round',
			stage: 3,
			size: [0, 2],
			applies: { part: 'taker', stage: 'previous', has: 'anyMember' },
			values: [{ id: 'gods', name: 'the gods' }, { id: 'chief', name: 'the chief' }, { id: 'rest', name: 'the rest' }]
		}
	],
	render: (n) => n.filter(Boolean).join('; then ')
};

// A custom with a kind whose reading binds the takers to the chief only when someone else takes, and
// two takers' rounds. Taker values: 0 chief, 1 priest (their `about` names the group).
export const bindsToChief: SlotDef = {
	id: 'binds',
	domain: 'Rite',
	name: 'Binds',
	features: [
		{
			id: 'kind',
			label: 'kind',
			values: [{ id: 'mead', name: 'mead', readings: [{ verb: 'bind', object: 'takers', target: 'chief/self', others: true }, { verb: 'commune', object: 'spirit', target: 'gods' }] }]
		},
		{
			id: 's1.taker',
			label: 'round one',
			stage: 1,
			size: [1, 2],
			values: [{ id: 'chief', name: 'chief', about: ['chief/self'] }, { id: 'priest', name: 'priest', about: ['priest/self'] }]
		},
		{
			id: 's2.taker',
			label: 'round two',
			stage: 2,
			size: [0, 2],
			applies: { part: 'taker', stage: 'previous', has: 'anyMember' },
			values: [{ id: 'chief', name: 'chief', about: ['chief/self'] }, { id: 'priest', name: 'priest', about: ['priest/self'] }]
		}
	],
	render: (n) => n.join(' ')
};

export const godsOnly = [[0], [], []];
export const godsThenChief = [[0], [1], []];
export const chiefAndRest = [[1, 2], [0], [0]];
export const restThenChief = [[2], [1], [0]];
