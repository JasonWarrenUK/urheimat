import type { CultureTraits, FeatureDef, Predicate, SlotDef, TraitValue, TraitValues } from '$lib/types';
import type { Noun } from './vocabulary';
import { SLOTS } from './slots';

// Material flow and predicates.
//
// A staged custom starts with a body in hand. Each stage's act accepts what is in hand and yields
// what the next stage receives ('same' passes it on, 'nothing' ends the chain). A value whose
// transitions don't accept what is in hand is unavailable: not generated, not drifted to, not
// reformable; if a band holds one anyway (an upstream change), its part is dormant and the chain
// ends there.
//
// A part applies when its predicates hold: a condition over another part's current value (in tags,
// never ids) or over the material in hand at this part's stage. A dormant part keeps its stored
// value, so it remembers if it wakes again.

const STAGE_START: Noun = 'body';
const NOTHING = null;
type InHand = Noun | null;

const actIndex = (slot: SlotDef, stage: number): number => slot.features.findIndex((g) => g.stage === stage && g.id.endsWith('.act'));

const transition = (value: TraitValue, m: InHand) =>
	m === NOTHING ? undefined : value.material?.find((t) => t.accepts === 'any' || t.accepts === m);

export const isAvailableValue = (value: TraitValue, m: InHand): boolean => !value.material?.length || transition(value, m) !== undefined;

// What is in hand when stage `stage` begins. Null for an unstaged part, or once the chain has ended.
export function inHand(slot: SlotDef, fv: readonly (number | null)[], stage: number | undefined): InHand {
	if (stage === undefined) return NOTHING;
	let m: InHand = STAGE_START;
	for (let s = 1; s < stage; s++) {
		const ai = actIndex(slot, s);
		if (ai < 0) return NOTHING;
		const v = fv[ai];
		if (v === null) return NOTHING;
		const t = transition(slot.features[ai].values[v], m);
		if (!t || t.yields === 'nothing') return NOTHING;
		m = t.yields === 'same' ? m : t.yields;
	}
	return m;
}

// Whether value `vi` of part `fi` may be held, given the rest of the custom.
export const isAvailableIn = (slot: SlotDef, fv: readonly (number | null)[], fi: number, vi: number): boolean =>
	isAvailableValue(slot.features[fi].values[vi], inHand(slot, fv, slot.features[fi].stage));

export const isAvailable = (traits: CultureTraits, si: number, fi: number, vi: number): boolean => isAvailableIn(SLOTS[si], traits[si], fi, vi);

const targetIndex = (slot: SlotDef, f: FeatureDef, part: string, rel?: 'same' | 'previous'): number => {
	const stage = f.stage === undefined ? undefined : rel === 'previous' ? f.stage - 1 : f.stage;
	const id = stage === undefined ? part : `s${stage}.${part}`;
	return slot.features.findIndex((g) => g.id === id);
};

function holds(slot: SlotDef, fv: readonly (number | null)[], f: FeatureDef, p: Predicate): boolean {
	if ('inHand' in p) {
		const m = inHand(slot, fv, f.stage);
		return p.inHand === 'some' ? m !== NOTHING : m === p.inHand;
	}
	const ti = targetIndex(slot, f, p.part, p.stage);
	if (ti < 0) return true; // a predicate pointing nowhere never silences a part
	const v = fv[ti];
	if (v === null || !isActiveIn(slot, fv, ti)) return false;
	const readings = slot.features[ti].values[v].readings ?? [];
	if (p.has === 'anyReading') return readings.length > 0;
	const want = p.has;
	return readings.some(
		(r) => (want.verb === undefined || r.verb === want.verb) && (want.object === undefined || r.object === want.object) && (want.target === undefined || r.target === want.target)
	);
}

export function isActiveIn(slot: SlotDef, fv: readonly (number | null)[], fi: number): boolean {
	const f = slot.features[fi];
	const v = fv[fi];
	if (v !== null && f.stage !== undefined && !isAvailableIn(slot, fv, fi, v)) return false;
	const ps = f.applies === undefined ? [] : Array.isArray(f.applies) ? f.applies : [f.applies];
	return ps.every((p) => holds(slot, fv, f, p));
}

export const isActive = (traits: CultureTraits, si: number, fi: number): boolean => isActiveIn(SLOTS[si], traits[si], fi);

export const activeParts = (traits: CultureTraits): [number, number][] =>
	SLOTS.flatMap((slot, si) => slot.features.flatMap((_, fi): [number, number][] => (isActiveIn(slot, traits[si], fi) ? [[si, fi]] : [])));

export const activeCount = (traits: CultureTraits): number => activeParts(traits).length;

export const activeIn = (slot: SlotDef, fv: TraitValues): number[] => fv.flatMap((_, fi) => (isActiveIn(slot, fv, fi) ? [fi] : []));
