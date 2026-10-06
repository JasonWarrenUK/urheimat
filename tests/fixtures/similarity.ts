// A hand-built disposal part on invented words, so the rules are tested apart from the real corpus.
import type { LooseTags, Opposites } from '../../src/lib/sim/similarity';

export const opposites: Opposites = [
	['send/away', 'send/to'],
	['earth', 'sky']
];

export const boat: LooseTags = {
	about: ['water'],
	readings: [
		{ verb: 'send/away', object: 'body' },
		{ verb: 'send/to', object: 'spirit', target: 'afterlife' }
	]
};
export const bog: LooseTags = { about: ['water', 'earth'], readings: [{ verb: 'give', object: 'body', target: 'gods' }] };
export const mound: LooseTags = { about: ['earth'], readings: [{ verb: 'keep', object: 'body' }] };
export const exposure: LooseTags = { about: ['sky'], readings: [{ verb: 'send/up', object: 'spirit', target: 'afterlife' }] };
export const untagged: LooseTags = {};
