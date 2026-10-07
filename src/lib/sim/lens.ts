import type { ValueTags } from '$lib/types';

// A lens is how similarity is judged for one cause of change: scarcity keeps the reason and
// swaps the material, upheaval keeps the material and changes the reason. Its shape mirrors the
// tags: a flat list of words gets one set rule, a list of structured entries gets criteria per
// string property. Add a property to a tag type and every lens stops compiling until it says how
// to compare it; list-valued properties (a reading's `when`) are structural and never compared.

export interface TermCriteria {
	weight: number;
	sibling: number; // credit for words sharing a path prefix (send/away, send/to)
	opposite: number; // credit for a pair on the OPPOSITES list; replaces sibling credit
}

export interface SetLens {
	weight: number;
	rule: 'jaccard';
	opposite: number;
}

type StringKeys<E> = { [P in keyof Required<E>]: Required<E>[P] extends string ? P : never }[keyof Required<E>];

export interface EntriesLens<E> {
	weight: number;
	// How several entries per value become one score: the best single pair, each entry's best
	// partner averaged both ways, or every pair averaged.
	combine: 'max' | 'meanBest' | 'meanAll';
	fields: { [P in StringKeys<E>]: TermCriteria };
}

type Tags = Required<ValueTags>;
export type Lens = {
	[K in keyof Tags]: Tags[K] extends readonly (infer E)[] ? ([E] extends [string] ? SetLens : EntriesLens<E>) : never;
};

// Placeholder values, to be replaced by Jason's picks once the corpus is tagged and corpus-fit has run.
export const DEFAULT_LENS: Lens = {
	about: { weight: 0.3, rule: 'jaccard', opposite: 0.25 },
	material: {
		weight: 0.2,
		combine: 'meanBest',
		fields: {
			accepts: { weight: 0.4, sibling: 0.5, opposite: 0.25 },
			yields: { weight: 0.6, sibling: 0.5, opposite: 0.25 }
		}
	},
	readings: {
		weight: 0.5,
		combine: 'meanBest',
		fields: {
			verb: { weight: 0.4, sibling: 0.5, opposite: 0.25 },
			object: { weight: 0.4, sibling: 0.5, opposite: 0.25 },
			target: { weight: 0.2, sibling: 0.5, opposite: 0.25 }
		}
	}
};

// Above this (out of 1000) two values count as near neighbours.
export const NEAR = 500;
