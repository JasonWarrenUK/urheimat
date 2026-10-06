import type { CultureTraits } from '$lib/types';
import { DEFAULT_LENS, type Lens, type TermCriteria } from './lens';
import { isActiveIn } from './predicates';
import { SLOTS } from './slots';
import { OPPOSITES } from './vocabulary';

// Similarity between two values of the same part, judged through a lens. Scores are integers
// from 0 to 1000, worked out once per lens, so play only ever does lookups.

// Loose shapes, so the rules can be tested on words that aren't in the vocabulary.
interface LooseReading {
	verb: string;
	object: string;
	target?: string;
}
export interface LooseTags {
	about?: readonly string[];
	readings?: readonly LooseReading[];
}
export type Opposites = readonly (readonly [string, string])[];

const isOpposite = (a: string, b: string, opp: Opposites): boolean =>
	opp.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const isSibling = (a: string, b: string): boolean => {
	const pa = a.split('/'),
		pb = b.split('/');
	return pa.length > 1 && pb.length > 1 && pa[0] === pb[0];
};

export function termScore(a: string | undefined, b: string | undefined, c: TermCriteria, opp: Opposites): number {
	if (a === b) return 1;
	if (a === undefined || b === undefined) return 0;
	if (isOpposite(a, b, opp)) return c.opposite;
	if (isSibling(a, b)) return c.sibling;
	return 0;
}

export function readingScore(a: LooseReading, b: LooseReading, lens: Lens, opp: Opposites): number {
	const f = lens.readings.fields;
	const keys = Object.keys(f) as (keyof typeof f)[];
	let s = 0,
		w = 0;
	keys.forEach((k) => {
		s += f[k].weight * termScore(a[k], b[k], f[k], opp);
		w += f[k].weight;
	});
	return w ? s / w : 0;
}

export function readingsScore(a: readonly LooseReading[], b: readonly LooseReading[], lens: Lens, opp: Opposites): number {
	const grid = a.map((ra) => b.map((rb) => readingScore(ra, rb, lens, opp)));
	const mean = (xs: number[]) => xs.reduce((x, y) => x + y, 0) / xs.length;
	switch (lens.readings.combine) {
		case 'max':
			return Math.max(...grid.flat());
		case 'meanAll':
			return mean(grid.flat());
		case 'meanBest': {
			const rows = grid.map((row) => Math.max(...row));
			const cols = b.map((_, j) => Math.max(...grid.map((row) => row[j])));
			return mean([...rows, ...cols]);
		}
	}
}

// Jaccard, with each opposite pair counted once in the union and earning opposite credit.
export function aboutScore(a: readonly string[], b: readonly string[], lens: Lens, opp: Opposites): number {
	const sa = new Set(a),
		sb = new Set(b);
	const shared = [...sa].filter((x) => sb.has(x)).length;
	const pairs = [...sa].filter((x) => !sb.has(x)).reduce((n, x) => n + [...sb].filter((y) => !sa.has(y) && isOpposite(x, y, opp)).length, 0);
	const union = new Set([...sa, ...sb]).size - pairs;
	return union ? (shared + lens.about.opposite * pairs) / union : 0;
}

export const isTagged = (v: LooseTags): boolean => !!(v.about?.length || v.readings?.length);

// A kind of tag only counts when at least one of the two values carries it; the weights are
// shared out among the kinds that count.
export function valueScore(a: LooseTags, b: LooseTags, lens: Lens = DEFAULT_LENS, opp: Opposites = OPPOSITES): number {
	if (a === b) return 1000;
	let s = 0,
		w = 0;
	const aa = a.about ?? [],
		ab = b.about ?? [];
	if (aa.length || ab.length) {
		s += lens.about.weight * aboutScore(aa, ab, lens, opp);
		w += lens.about.weight;
	}
	const ra = a.readings ?? [],
		rb = b.readings ?? [];
	if (ra.length || rb.length) {
		s += lens.readings.weight * (ra.length && rb.length ? readingsScore(ra, rb, lens, opp) : 0);
		w += lens.readings.weight;
	}
	return w ? Math.round((1000 * s) / w) : 0;
}

// One table per part, or null while any of its values is untagged: such a part keeps the old behaviour.
export type PartTable = number[][] | null;

export function buildTables(lens: Lens): PartTable[][] {
	return SLOTS.map((slot) =>
		slot.features.map((f) => (f.values.every(isTagged) ? f.values.map((a) => f.values.map((b) => valueScore(a, b, lens))) : null))
	);
}

const cache = new Map<Lens, PartTable[][]>();
export function tables(lens: Lens = DEFAULT_LENS): PartTable[][] {
	if (!cache.has(lens)) cache.set(lens, buildTables(lens));
	return cache.get(lens)!;
}

export const partTable = (si: number, fi: number, lens: Lens = DEFAULT_LENS): PartTable => tables(lens)[si][fi];
export const isPartTagged = (si: number, fi: number): boolean => partTable(si, fi) !== null;

export function similarity(si: number, fi: number, a: number, b: number, lens: Lens = DEFAULT_LENS): number | null {
	const t = partTable(si, fi, lens);
	return t ? t[a][b] : null;
}

// Two bands' likeness from 0 to 1: each custom counts equally, its tagged parts live in both bands
// share its weight. Null when nothing is tagged yet.
export function bandSimilarity(a: CultureTraits, b: CultureTraits, lens: Lens = DEFAULT_LENS): number | null {
	const perCustom: number[] = [];
	SLOTS.forEach((slot, si) => {
		const scores = slot.features.flatMap((_, fi) => {
			if (!isActiveIn(slot, a[si], fi) || !isActiveIn(slot, b[si], fi)) return [];
			const s = similarity(si, fi, a[si][fi], b[si][fi], lens);
			return s === null ? [] : [s / 1000];
		});
		if (scores.length) perCustom.push(scores.reduce((x, y) => x + y, 0) / scores.length);
	});
	return perCustom.length ? perCustom.reduce((x, y) => x + y, 0) / perCustom.length : null;
}
