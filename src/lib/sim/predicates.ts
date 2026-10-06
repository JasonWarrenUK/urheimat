import type { CultureTraits, FeatureDef, Predicate, SlotDef, TraitValues } from '$lib/types';
import { SLOTS } from './slots';

// A part applies when its predicate holds over another part's current value in the same custom.
// A part with no predicate always applies. A dormant part keeps its stored value, so it remembers
// if it wakes again; it is skipped by drift, strain, scoring, reform and render.

const targetIndex = (slot: SlotDef, f: FeatureDef, p: Predicate): number => {
	const stage = f.stage === undefined ? undefined : p.stage === 'previous' ? f.stage - 1 : f.stage;
	const id = stage === undefined ? p.part : `s${stage}.${p.part}`;
	return slot.features.findIndex((g) => g.id === id);
};

function holds(p: Predicate, target: FeatureDef, v: number): boolean {
	const value = target.values[v],
		readings = value.readings ?? [];
	if (p.has === 'anyReading') return readings.length > 0;
	if ('material' in p.has) return (value.material ?? []).includes(p.has.material);
	const want = p.has;
	return readings.some(
		(r) => (want.verb === undefined || r.verb === want.verb) && (want.object === undefined || r.object === want.object) && (want.target === undefined || r.target === want.target)
	);
}

export function isActiveIn(slot: SlotDef, fv: readonly (number | null)[], fi: number): boolean {
	const f = slot.features[fi],
		p = f.applies;
	if (!p) return true;
	const ti = targetIndex(slot, f, p);
	if (ti < 0) return true; // a predicate pointing nowhere never silences a part
	const v = fv[ti];
	if (v === null) return false;
	return isActiveIn(slot, fv, ti) && holds(p, slot.features[ti], v);
}

export const isActive = (traits: CultureTraits, si: number, fi: number): boolean => isActiveIn(SLOTS[si], traits[si], fi);

export const activeParts = (traits: CultureTraits): [number, number][] =>
	SLOTS.flatMap((slot, si) => slot.features.flatMap((_, fi): [number, number][] => (isActiveIn(slot, traits[si], fi) ? [[si, fi]] : [])));

export const activeCount = (traits: CultureTraits): number => activeParts(traits).length;

export const activeIn = (slot: SlotDef, fv: TraitValues): number[] => fv.flatMap((_, fi) => (isActiveIn(slot, fv, fi) ? [fi] : []));
