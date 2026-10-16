import type { Answer, Culture, GameState, MapTerrain, Pressure, Pull, PullSource, Situation, Terrain } from '$lib/types';
import { aff, contact, setName, vname } from './engine';
import { emitChange } from './history';
import { NEAR, SCARCITY_LENS, UPHEAVAL_LENS } from './lens';
import { heldAbout, isActive, isAvailable } from './predicates';
import { partTable } from './similarity';
import { AFF_WEIGHT, PULLS, SLOTS } from './slots';

// Layer 1 pressures (2DS.1 decisions 3a, 3m, 3w, 4a, 4e, 4k, 4m; 6SL.3). Random drift is gone:
// every source that used to move a custom now makes a pull, pulls accumulate on the band between
// steps, and a pull that reaches the band's hold surfaces as a situation with written answers. The
// player answers; an AI band takes the let-it-lie outcome until 6SL.7 scripts it. Nothing here
// spends the seeded rng: which pulls surface is decided by strength alone.

// At most this many pressures a step, beside the storylet cap. 6SL.8 replaces the flat cap with weather.
export const PRESSURES_PER_STEP = 3;

const MEMORY = 0.3; // a lost value pulls back this much a step (3w): rarely enough to return alone
const LANDSCAPE = 0.5; // a land the band lived on pulls at this share of what the land under it would
const FADE = 0.5; // a pull whose source has gone, or that was held against, keeps this much a step
const GONE = 0.1; // and dies below this

const RULE = SLOTS.findIndex((s) => s.id === 'rule'),
	SOURCE = SLOTS[RULE].features.findIndex((f) => f.id === 'source'),
	MEMORY_CUSTOM = SLOTS.findIndex((s) => s.id === 'memory'),
	MEDIUM = SLOTS[MEMORY_CUSTOM].features.findIndex((f) => f.id === 'medium');

// How much pull a band's customs withstand before a pressure surfaces. Rule by law and sacred rule
// keep custom; so do a stone record and a spoken one. A band that has just moved holds less.
export function hold(c: Culture): number {
	let h = 5 * c.conserv;
	if (heldAbout(c.traits, RULE, SOURCE, 'justice')) h += 1.5;
	if (heldAbout(c.traits, RULE, SOURCE, 'mediation')) h += 1;
	if (heldAbout(c.traits, MEMORY_CUSTOM, MEDIUM, 'stone')) h += 1;
	if (heldAbout(c.traits, MEMORY_CUSTOM, MEDIUM, 'voice')) h += 0.5;
	if (c.migrated) h -= 2;
	return Math.max(2, h);
}

type Contribution = Omit<Pull, 'live'>;
const keyOf = (p: { custom: number; part: number; op: Pull['op']; value: number }): string => `${p.custom}:${p.part}:${p.op}:${p.value}`;
const sizeOf = (si: number, fi: number): readonly [number, number] | undefined => SLOTS[si].features[fi].size;
const isSet = (si: number, fi: number): boolean => sizeOf(si, fi) !== undefined;
const emptyAff = (si: number, fi: number, t: MapTerrain): number | undefined => {
	const e = SLOTS[si].features[fi].empty;
	return e ? AFF_WEIGHT[e[t as Terrain] ?? 'allows'] : undefined;
};
// Nearness of a candidate to what is held, 0 to 1: the best table cell against any member, or a
// middling guess where the part is untagged or empty.
function nearTo(si: number, fi: number, held: readonly number[], vi: number): number {
	const t = partTable(si, fi);
	if (!t || !held.length) return 0.5;
	return Math.max(...held.map((h) => t[h][vi])) / 1000;
}
const live = (c: Culture): [number, number][] =>
	SLOTS.flatMap((slot, si) => (c.absent.includes(slot.id) ? [] : slot.features.flatMap((_, fi): [number, number][] => (isActive(c.traits, si, fi) ? [[si, fi]] : []))));

// What a land does to each part: the one value it most prefers over what is held (adopt, or add to
// a set), the members it resists (drop), and emptiness where the part favours it. `weight` scales
// everything, so a remembered landscape can pull at a share of what the seat does.
function landPulls(c: Culture, t: MapTerrain, weight: number, source: PullSource): Contribution[] {
	const out: Contribution[] = [];
	live(c).forEach(([si, fi]) => {
		const f = SLOTS[si].features[fi],
			held = c.traits[si][fi],
			a = (vi: number) => aff(si, fi, vi, t);
		const open = f.values.map((_, vi) => !held.includes(vi) && isAvailable(c.traits, si, fi, vi));
		if (isSet(si, fi)) {
			const [min] = sizeOf(si, fi)!,
				ae = emptyAff(si, fi, t);
			if (held.length > min)
				held.forEach((vi) => {
					if (a(vi) < 1) out.push({ custom: si, part: fi, op: 'drop', value: vi, strength: 2 * (1 - a(vi)) * weight, source });
					const g = ae === undefined ? 0 : ae - a(vi);
					if (g > 0) out.push({ custom: si, part: fi, op: 'drop', value: vi, strength: (2 * g * weight) / held.length, source: source.kind === 'land' ? { kind: 'absence' } : source });
				});
			const floor = held.length ? held.reduce((s, vi) => s + a(vi), 0) / held.length : (ae ?? 1);
			let best: Contribution | null = null;
			f.values.forEach((_, vi) => {
				const g = a(vi) - floor;
				if (!open[vi] || g <= 0) return;
				const strength = (2 * g * nearTo(si, fi, held, vi) + (floor < 1 ? 2 * (1 - floor) : 0)) * weight;
				if (!best || strength > best.strength) best = { custom: si, part: fi, op: 'add', value: vi, strength, source };
			});
			if (best) out.push(best);
			return;
		}
		const cur = held[0],
			ac = a(cur);
		let best: Contribution | null = null;
		f.values.forEach((_, vi) => {
			const g = a(vi) - ac;
			if (!open[vi] || g <= 0) return;
			const strength = (2 * g * nearTo(si, fi, held, vi) + (ac < 1 ? 2 * (1 - ac) : 0)) * weight;
			if (!best || strength > best.strength) best = { custom: si, part: fi, op: 'adopt', value: vi, strength, source };
		});
		if (best) out.push(best);
	});
	return out;
}

// Each band in contact pulls towards what it practises, by the strength of the contact: an ordinary
// part towards its value, a set towards its members and more weakly away from members it lacks.
function neighbourPulls(st: GameState, c: Culture): Contribution[] {
	const out: Contribution[] = [];
	st.cultures.forEach((k) => {
		if (k.id === c.id) return;
		const w = contact(st, c, k);
		if (w <= 0) return;
		const source: PullSource = { kind: 'neighbour', band: k.id };
		live(c).forEach(([si, fi]) => {
			if (k.absent.includes(SLOTS[si].id) || !isActive(k.traits, si, fi)) return;
			const held = c.traits[si][fi],
				theirs = k.traits[si][fi];
			if (isSet(si, fi)) {
				const [min] = sizeOf(si, fi)!;
				theirs.forEach((vi) => !held.includes(vi) && isAvailable(c.traits, si, fi, vi) && out.push({ custom: si, part: fi, op: 'add', value: vi, strength: w, source }));
				if (held.length > min) held.forEach((vi) => !theirs.includes(vi) && out.push({ custom: si, part: fi, op: 'drop', value: vi, strength: 0.5 * w, source }));
			} else if (theirs[0] !== held[0] && isAvailable(c.traits, si, fi, theirs[0])) out.push({ custom: si, part: fi, op: 'adopt', value: theirs[0], strength: w, source });
		});
	});
	return out;
}

// A value the band once held pulls back, weakly (3w). The land or a neighbour favouring it add their
// own pulls on the same key, which is the exception the decision names.
function memoryPulls(c: Culture): Contribution[] {
	return c.lost.flatMap((l) => {
		if (c.absent.includes(SLOTS[l.custom].id) || !isActive(c.traits, l.custom, l.part)) return [];
		const held = c.traits[l.custom][l.part];
		if (held.includes(l.value) || !isAvailable(c.traits, l.custom, l.part, l.value)) return [];
		return [{ custom: l.custom, part: l.part, op: isSet(l.custom, l.part) ? 'add' : 'adopt', value: l.value, strength: MEMORY, source: { kind: 'memory' } } as Contribution];
	});
}

// A land the band lived on before keeps pulling, at a share of what the seat does scaled by how much
// of the band's life was spent there.
function landscapePulls(c: Culture, t: MapTerrain): Contribution[] {
	const total = Object.values(c.lands).reduce((a, b) => a + b, 0);
	return Object.entries(c.lands).flatMap(([terrain, steps]) =>
		terrain === t || steps < 2 ? [] : landPulls(c, terrain as Terrain, (LANDSCAPE * steps) / total, { kind: 'landscape', terrain: terrain as Terrain })
	);
}

// Pulls one custom's tags make on another, from the corpus table.
function customPulls(c: Culture): Contribution[] {
	return PULLS.flatMap((rule) => {
		const from = SLOTS.findIndex((s) => s.id === rule.when.custom),
			si = SLOTS.findIndex((s) => s.id === rule.to.custom);
		if (from < 0 || si < 0 || c.absent.includes(rule.when.custom) || c.absent.includes(rule.to.custom)) return [];
		const asks = SLOTS[from].features.some((_, fi) => isActive(c.traits, from, fi) && heldAbout(c.traits, from, fi, rule.when.about));
		if (!asks) return [];
		const fi = SLOTS[si].features.findIndex((f) => f.id === rule.to.part),
			vi = fi < 0 ? -1 : SLOTS[si].features[fi].values.findIndex((v) => v.id === rule.to.value);
		if (vi < 0 || !isActive(c.traits, si, fi) || c.traits[si][fi].includes(vi) || !isAvailable(c.traits, si, fi, vi)) return [];
		return [{ custom: si, part: fi, op: isSet(si, fi) ? 'add' : 'adopt', value: vi, strength: rule.strength, source: { kind: 'custom', custom: rule.when.custom } } as Contribution];
	});
}

export function contributions(st: GameState, c: Culture): Contribution[] {
	const t = st.map.tiles[c.y][c.x];
	return [...landPulls(c, t, 1, { kind: 'land' }), ...neighbourPulls(st, c), ...memoryPulls(c), ...landscapePulls(c, t), ...customPulls(c)];
}

// This step's contributions join the pulls carried from before: a pull still fed grows, one no longer
// fed fades, and the source that gave most this step is the one the situation names.
export function accumulate(c: Culture, now: Contribution[]): void {
	const pulls = new Map(c.pulls.map((p) => [keyOf(p), { ...p, live: false }]));
	const best = new Map<string, Contribution>();
	now.forEach((k) => {
		const key = keyOf(k),
			p = pulls.get(key);
		if (p) {
			p.strength += k.strength;
			p.live = true;
		} else pulls.set(key, { ...k, live: true });
		const b = best.get(key);
		if (!b || k.strength > b.strength) best.set(key, k);
	});
	best.forEach((k, key) => (pulls.get(key)!.source = k.source));
	c.pulls = [...pulls.values()]
		.map((p) => (p.live ? p : { ...p, strength: p.strength * FADE }))
		.filter((p) => p.strength >= GONE);
}

// Whether a pull still makes sense against what the band holds now.
function stands(c: Culture, p: Pull): boolean {
	if (c.absent.includes(SLOTS[p.custom].id) || !isActive(c.traits, p.custom, p.part)) return false;
	const held = c.traits[p.custom][p.part];
	if (p.op === 'drop') return held.includes(p.value) && held.length > (sizeOf(p.custom, p.part)?.[0] ?? 1);
	return !held.includes(p.value) && isAvailable(c.traits, p.custom, p.part, p.value);
}

// The pulls that surface this step: those at or past the hold, strongest first, to the cap. They
// leave the band's pulls; holding fast puts one back at a fraction.
export function surface(c: Culture): Pull[] {
	const h = hold(c);
	c.pulls = c.pulls.filter((p) => stands(c, p));
	const due = c.pulls
		.filter((p) => p.strength >= h)
		.sort((a, b) => b.strength - a.strength || keyOf(a).localeCompare(keyOf(b)))
		.slice(0, PRESSURES_PER_STEP);
	c.pulls = c.pulls.filter((p) => !due.includes(p));
	return due;
}

// Change one part, remembering what left it (a dormant memory the band may be pulled back to) and
// forgetting what returned, and dating the change for the notebook (4SD.15). A change to what the
// part already holds is no change and leaves no event.
export function change(st: GameState, c: Culture, si: number, fi: number, next: number[]): void {
	const prev = c.traits[si][fi];
	prev.forEach((vi) => !next.includes(vi) && c.lost.push({ custom: si, part: fi, value: vi, step: st.era }));
	c.lost = c.lost.filter((l) => !(l.custom === si && l.part === fi && next.includes(l.value)));
	c.traits[si][fi] = next;
	if (prev.length === next.length && prev.every((vi) => next.includes(vi))) return;
	emitChange(st, c, si, fi, prev, next, `${SLOTS[si].id}.${SLOTS[si].features[fi].id}: ${setName(si, fi, prev) || 'nothing'} to ${setName(si, fi, next) || 'nothing'}`);
}

// The value a pull would displace: what an ordinary part holds, or the member a full set would swap
// out (the one the land likes least). Null for an add with room, and for a drop.
export function displaced(st: GameState, c: Culture, p: Pull): number | null {
	const held = c.traits[p.custom][p.part];
	if (p.op === 'adopt') return held[0];
	if (p.op === 'drop' || held.length < sizeOf(p.custom, p.part)![1]) return null;
	const t = st.map.tiles[c.y][c.x];
	return held.reduce((worst, vi) => (aff(p.custom, p.part, vi, t) < aff(p.custom, p.part, worst, t) ? vi : worst));
}

// Apply a pull as it stands, or with another value in its place (the third course).
function applyPull(st: GameState, c: Culture, p: Pull, value = p.value): number[] {
	const held = c.traits[p.custom][p.part],
		out = displaced(st, c, p);
	let next: number[];
	if (p.op === 'adopt') next = [value];
	else if (p.op === 'drop') next = held.filter((vi) => vi !== value);
	else next = [...held.filter((vi) => vi !== out), value];
	change(st, c, p.custom, p.part, next);
	return next;
}

// The third course, found through the lens for the pull's cause. Under the land's pull (and the
// pulls that read like it): the value nearest by what the held one does and is about that the land
// prefers over it. Under a neighbour's pull: the value nearest theirs by what physically happens
// and nearest yours by meaning. A drop offers a swap for the resisted member; an add that displaces
// nothing offers nothing.
export function thirdCourse(st: GameState, c: Culture, p: Pull): number | null {
	const t = st.map.tiles[c.y][c.x],
		held = c.traits[p.custom][p.part],
		open = (vi: number) => vi !== p.value && !held.includes(vi) && isAvailable(c.traits, p.custom, p.part, vi);
	const scarcity = partTable(p.custom, p.part, SCARCITY_LENS),
		upheaval = partTable(p.custom, p.part, UPHEAVAL_LENS),
		out = displaced(st, c, p);
	if (!scarcity || !upheaval || (p.op === 'add' && out === null)) return null;
	const from = p.op === 'drop' ? p.value : (out as number);
	let best: number | null = null,
		bs = 0;
	SLOTS[p.custom].features[p.part].values.forEach((_, vi) => {
		if (!open(vi)) return;
		let s: number;
		if (p.source.kind === 'neighbour') s = (upheaval[p.value][vi] * scarcity[from][vi]) / 1000;
		else {
			if (aff(p.custom, p.part, vi, t) <= aff(p.custom, p.part, from, t)) return;
			s = scarcity[from][vi];
		}
		if (s >= NEAR && s > bs) {
			bs = s;
			best = vi;
		}
	});
	return best;
}

// ---------- words ----------
const lower = (si: number): string => SLOTS[si].name.toLowerCase();
const label = (p: Pull): string => SLOTS[p.custom].features[p.part].label;
const name = (p: Pull, vi = p.value): string => vname(p.custom, p.part, vi);
const bandName = (st: GameState, id: number): string => `the ${st.cultures[id].name}`;
const cause = (st: GameState, c: Culture, p: Pull): string => {
	const s = p.source;
	switch (s.kind) {
		case 'land':
		case 'absence':
			return `as the ${st.map.tiles[c.y][c.x]} would have it`;
		case 'neighbour':
			return `learned from ${bandName(st, s.band)}`;
		case 'memory':
			return 'the old way restored';
		case 'landscape':
			return `as those who remember the ${s.terrain} would have it`;
		case 'custom':
			return `as the ${lower(SLOTS.findIndex((x) => x.id === s.custom))} asks`;
	}
};

// An add that displaces a member (a full set) reads as a change from that member; one with room reads
// as something new taken up.
function situationText(st: GameState, c: Culture, p: Pull): string {
	const t = st.map.tiles[c.y][c.x],
		custom = lower(p.custom),
		out = displaced(st, c, p),
		cur = out === null ? '' : name(p, out),
		swap = p.op !== 'drop' && out !== null,
		v = name(p),
		s = p.source;
	switch (s.kind) {
		case 'land':
			if (swap) return `The ${t} wears on ${custom}: ${label(p)} ${cur} sits ill here, and ${v} comes easier to your people.`;
			if (p.op === 'add') return `The ${t} offers ${custom} a new ${label(p)}: ${v}. Some of your people have taken to it already.`;
			return `The ${t} is no place for ${v} (${custom}, ${label(p)}), and your people are letting it slip.`;
		case 'absence':
			return `On the ${t} your people see little need for ${v} (${custom}, ${label(p)}).`;
		case 'neighbour': {
			const k = bandName(st, s.band),
				K = k[0].toUpperCase() + k.slice(1);
			if (swap) return `${K} keep ${custom} otherwise: ${label(p)} ${v}. Your young have seen it and like it.`;
			if (p.op === 'add') return `${K} also hold ${v} (${custom}, ${label(p)}), and some of yours would take it up.`;
			return `${K} do without ${v} (${custom}, ${label(p)}), and some of yours ask why you keep it.`;
		}
		case 'memory':
			return `The old people remember when ${custom} was otherwise: ${label(p)} ${v}. Some would have it back.`;
		case 'landscape':
			if (p.op === 'drop') return `Those who remember the ${s.terrain} never cared for ${v} (${custom}, ${label(p)}).`;
			return `Those who remember the ${s.terrain} still hold to its ways: ${label(p)} ${v} (${custom}).`;
		case 'custom': {
			const from = SLOTS.findIndex((x) => x.id === s.custom);
			return `What feeds you shapes ${custom}: with ${setName(from, 0, c.traits[from][0]).toLowerCase()}, ${label(p)} ${v} comes to seem right.`;
		}
	}
}

function answersFor(st: GameState, c: Culture, p: Pull, third: number | null): Answer[] {
	const out = displaced(st, c, p),
		cur = p.op === 'drop' ? name(p) : out === null ? null : name(p, out);
	const keep: Answer = { id: 'hold', text: cur === null ? 'Refuse it' : `Hold to ${cur}` };
	if (p.source.kind === 'memory') return [{ id: 'adopt', text: p.op === 'adopt' ? `Restore ${name(p)}` : `Take ${name(p)} up again` }, cur === null ? { id: 'hold', text: 'Leave it in the past' } : keep];
	const answers: Answer[] = [p.source.kind === 'neighbour' ? { id: 'hold', text: 'Forbid it' } : keep];
	if (third !== null)
		answers.push({
			id: 'third',
			text: p.source.kind === 'neighbour' ? `Take their way, keep your reason: ${name(p, third)}` : `Keep the meaning, change the means: ${name(p, third)}`
		});
	return answers;
}

// What a let-lie or an answer does to the band, and the chronicle line for it.
export function resolve(st: GameState, c: Culture, pr: Pressure, chosen: string | null): void {
	const p = pr.pull,
		memory = p.source.kind === 'memory';
	const yields = memory ? chosen === 'adopt' : chosen === null || chosen === 'third';
	if (chosen === 'hold') {
		c.pulls.push({ ...p, strength: p.strength * FADE, live: false });
		return;
	}
	if (!yields) return;
	const before = setName(p.custom, p.part, c.traits[p.custom][p.part]);
	const next = applyPull(st, c, p, chosen === 'third' && pr.third !== null ? pr.third : p.value);
	const after = setName(p.custom, p.part, next);
	const how = chosen === 'third' ? (p.source.kind === 'neighbour' ? `their means, your reason` : 'the meaning kept') : cause(st, c, p);
	const known = c.isPlayer || contact(st, st.cultures[st.playerId as number], c) >= 0.5;
	if (!known) return;
	const who = c.isPlayer ? 'Among your people' : `Among the ${c.name}`;
	const what = !before ? `gains <em>${after}</em>` : !after ? `loses <em>${before}</em>` : `changes: <em>${before}</em> becomes <em>${after}</em>`;
	st.log.push({ era: st.era, text: `${who}, ${lower(p.custom)} (${label(p)}) ${what}, ${how}.` });
}

// One band's pressures for the step. The pulls build; the ones that surface become situations for
// the player, or resolve at once for an AI band by their let-it-lie outcome (4k, until 6SL.7). The
// step lived on this land is counted last, so a remembered landscape never includes the seat.
export function pressureStep(st: GameState, c: Culture): Situation[] {
	accumulate(c, contributions(st, c));
	const due = surface(c).map((pull): Pressure => ({ pull, third: thirdCourse(st, c, pull) }));
	const t = st.map.tiles[c.y][c.x] as Terrain;
	c.lands[t] = (c.lands[t] ?? 0) + 1;
	if (!c.isPlayer) {
		due.forEach((pr) => resolve(st, c, pr, null));
		return [];
	}
	return due.map((pr) => ({
		id: `${st.era + 1}:${keyOf(pr.pull)}`,
		pressure: pr,
		text: situationText(st, c, pr.pull),
		answers: answersFor(st, c, pr.pull, pr.third)
	}));
}
