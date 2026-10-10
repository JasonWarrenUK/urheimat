import type { Culture, Person, Rng } from '$lib/types';
import { heldAbout } from './predicates';
import { SLOTS } from './slots';

// Leaders and their families (2DS.1, decisions 3b, 3c, 3q). The world moves in fixed 25-year
// steps. Every person has a first child at 18 and, while under 45, further children with halving
// odds at a gap of 2 to 8 years; death comes anywhere from 36 to 75. All of it is drawn at birth
// from the seeded rng, so a family is a deterministic tree. Leadership passes by the band's own
// descent rule to the nearest adult descendant; failing one, a kinsman from outside the tree.

export const YEARS_PER_STEP = 25;
export const ADULT = 18;
const FERTILE_UNTIL = 45;
const DEATH: [number, number] = [36, 75];

const between = (r: Rng, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));

const DESCENT = SLOTS.findIndex((s) => s.id === 'descent'),
	HEIRS = SLOTS[DESCENT].features.findIndex((f) => f.id === 'heirs'),
	SHARE = SLOTS[DESCENT].features.findIndex((f) => f.id === 'share');

// Names for people, from the same syllables as bands.
const CONS = ['k', 't', 'r', 's', 'm', 'n', 'w', 'd', 'g', 'th', 'l', 'v', 'b', 'h'];
const VOW = ['a', 'e', 'i', 'o', 'u', 'ai', 'au', 'ei'];
export function personName(r: Rng): string {
	let s = '';
	for (let i = 0; i < 2; i++) s += CONS[Math.floor(r() * CONS.length)] + VOW[Math.floor(r() * VOW.length)];
	if (r() < 0.5) s += ['r', 'n', 's', 'th', 'l'][Math.floor(r() * 5)];
	return s[0].toUpperCase() + s.slice(1);
}

export const person = (c: Culture, id: number): Person => c.family.find((p) => p.id === id)!;
export const leaderOf = (c: Culture): Person => person(c, c.leader);
export const alive = (p: Person, year: number): boolean => year < p.dies;
export const ageOf = (p: Person, year: number): number => year - p.born;
const adult = (p: Person, year: number): boolean => alive(p, year) && ageOf(p, year) >= ADULT;
const nextId = (family: Person[]): number => family.reduce((n, p) => Math.max(n, p.id + 1), 0);

// A person born in `born`, with their whole life drawn now: the age they die at, and the ages their
// children come at. A founder or kinsman (`parent` null) is already `age` years old and alive, so
// their death is drawn beyond that age.
export function bear(r: Rng, family: Person[], born: number, parent: number | null, generation: number, age = 0): Person {
	const dies = between(r, Math.max(DEATH[0], age + 1), DEATH[1]);
	const children: number[] = [ADULT];
	let at = ADULT,
		odds = 0.5;
	while (at < FERTILE_UNTIL && r() < odds) {
		at += between(r, 2, 8);
		if (at >= FERTILE_UNTIL || at >= dies) break;
		children.push(at);
		odds /= 2;
	}
	const p: Person = { id: nextId(family), name: personName(r), born, dies: born + dies, parent, generation, children };
	family.push(p);
	return p;
}

// Children of `root` and their descendants who are already born by `year`, created now. Used for
// a founder at the scattering and for a kinsman taken from outside the tree.
function materialise(r: Rng, family: Person[], root: Person, year: number): void {
	const queue = [root];
	while (queue.length) {
		const p = queue.shift()!;
		p.children.filter((a) => p.born + a <= year).forEach((a) => queue.push(bear(r, family, p.born + a, p.id, p.generation + 1)));
	}
}

// Someone of no tracked line, aged 18 to 45, with the family they already have.
function kinsman(r: Rng, family: Person[], generation: number, year: number): Person {
	const age = between(r, ADULT, FERTILE_UNTIL);
	const p = bear(r, family, year - age, null, generation, age);
	materialise(r, family, p, year);
	return p;
}

export interface FamilyEvent {
	kind: 'death' | 'succession';
	person: Person;
	year: number;
}

// Who bears tracked children: the leader, the leader's siblings and the descendants of either. The
// rest of the tree stays as it is, alive or dead; their further children are the band, untracked.
// Without this bound every line breeds and the tree grows past any use within a few steps.
function breeding(c: Culture): Set<number> {
	const leader = leaderOf(c);
	const roots = c.family.filter((p) => p.id === leader.id || (leader.parent !== null && p.parent === leader.parent));
	const set = new Set(roots.map((p) => p.id));
	for (let grew = true; grew; ) {
		grew = false;
		c.family.forEach((p) => {
			if (p.parent !== null && set.has(p.parent) && !set.has(p.id)) {
				set.add(p.id);
				grew = true;
			}
		});
	}
	return set;
}

// Run one band's family from `from` (exclusive) to `to` (inclusive), year by year: births, then the
// leader's death and a successor if it falls this year. Returns what happened, for the chronicle.
export function advance(r: Rng, c: Culture, from: number, to: number): FamilyEvent[] {
	const events: FamilyEvent[] = [];
	for (let year = from + 1; year <= to; year++) {
		const breeds = breeding(c);
		c.family
			.filter((p) => breeds.has(p.id) && p.children.some((a) => p.born + a === year))
			.forEach((p) => p.children.filter((a) => p.born + a === year).forEach(() => bear(r, c.family, year, p.id, p.generation + 1)));
		const leader = leaderOf(c);
		if (leader.dies === year) {
			events.push({ kind: 'death', person: leader, year });
			const next = successor(r, c, year);
			c.leader = next.id;
			events.push({ kind: 'succession', person: next, year });
		}
	}
	return events;
}

// Who leads next, by the band's descent rule: `heirs` says whose children count first (the leader's
// own, or the leader's siblings'), `share` orders siblings (eldest or youngest first; equal means
// eldest for now). The nearest generation goes first either way. Failing an adult, a kinsman.
export function successor(r: Rng, c: Culture, year: number): Person {
	const leader = leaderOf(c);
	const sisterFirst = heldAbout(c.traits, DESCENT, HEIRS, 'female');
	const youngestFirst = heldAbout(c.traits, DESCENT, SHARE, 'youth');
	const own = [leader];
	const siblings = leader.parent === null ? [] : c.family.filter((p) => p.parent === leader.parent && p.id !== leader.id);
	for (const roots of sisterFirst ? [siblings, own] : [own, siblings]) {
		let generation = roots;
		while (generation.length) {
			const children = c.family.filter((p) => p.parent !== null && generation.some((g) => g.id === p.parent));
			const adults = children.filter((p) => adult(p, year)).sort((a, b) => (youngestFirst ? b.born - a.born : a.born - b.born));
			if (adults.length) return adults[0];
			generation = children;
		}
	}
	return kinsman(r, c.family, leader.generation, year);
}

// The first leader of a band at the scattering: aged 18 to 45, with the children already born to
// them, so the tree is complete at year 0.
export function found(r: Rng, c: Culture, year: number): Person {
	const p = kinsman(r, c.family, 1, year);
	c.leader = p.id;
	return p;
}

// Who leaves to found a daughter band: an adult child of the leader who is not the heir, taking
// their own descendants with them; failing one, a kinsman.
export function split(r: Rng, parent: Culture, daughter: Culture, year: number): Person {
	const leader = leaderOf(parent);
	const heir = successor(r, parent, year);
	const spare = parent.family
		.filter((p) => p.parent === leader.id && p.id !== heir.id && adult(p, year))
		.sort((a, b) => a.born - b.born)[0];
	if (!spare) {
		const k = kinsman(r, daughter.family, leader.generation, year);
		daughter.leader = k.id;
		return k;
	}
	const moving = new Set<number>([spare.id]);
	for (let grew = true; grew; ) {
		grew = false;
		parent.family.forEach((p) => {
			if (p.parent !== null && moving.has(p.parent) && !moving.has(p.id)) {
				moving.add(p.id);
				grew = true;
			}
		});
	}
	daughter.family = parent.family.filter((p) => moving.has(p.id)).map((p) => ({ ...p, parent: p.id === spare.id ? null : p.parent, children: [...p.children] }));
	parent.family = parent.family.filter((p) => !moving.has(p.id));
	daughter.leader = spare.id;
	return leaderOf(daughter);
}

// The year a step begins: the scattering is year 0, era 1.
export const yearOf = (era: number): number => Math.max(0, era - 1) * YEARS_PER_STEP;
