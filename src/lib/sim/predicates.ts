import type { CultureTraits, FeatureDef, PartTag, PartValue, Predicate, Reading, SlotDef, TraitValue, TraitValues } from '$lib/types';
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

type Held = readonly (PartValue | null)[];

const actIndex = (slot: SlotDef, stage: number): number => slot.features.findIndex((g) => g.stage === stage && g.id.endsWith('.act'));

const transition = (value: TraitValue, m: InHand) =>
	m === NOTHING ? undefined : value.material?.find((t) => t.accepts === 'any' || t.accepts === m);

export const isAvailableValue = (value: TraitValue, m: InHand): boolean => !value.material?.length || transition(value, m) !== undefined;

// What is in hand when stage `stage` begins. Null for an unstaged part, or once the chain has ended.
export function inHand(slot: SlotDef, fv: Held, stage: number | undefined): InHand {
	if (stage === undefined) return NOTHING;
	let m: InHand = STAGE_START;
	for (let s = 1; s < stage; s++) {
		const ai = actIndex(slot, s);
		if (ai < 0) return NOTHING;
		const v = fv[ai]?.[0];
		if (v === undefined) return NOTHING;
		const t = transition(slot.features[ai].values[v], m);
		if (!t || t.yields === 'nothing') return NOTHING;
		m = t.yields === 'same' ? m : t.yields;
	}
	return m;
}

// Whether value `vi` of part `fi` may be held, given the rest of the custom.
export const isAvailableIn = (slot: SlotDef, fv: Held, fi: number, vi: number): boolean =>
	isAvailableValue(slot.features[fi].values[vi], inHand(slot, fv, slot.features[fi].stage));

export const isAvailable = (traits: CultureTraits, si: number, fi: number, vi: number): boolean => isAvailableIn(SLOTS[si], traits[si], fi, vi);

const targetIndex = (slot: SlotDef, f: FeatureDef, part: string, rel?: 'same' | 'previous'): number => {
	const stage = f.stage === undefined ? undefined : rel === 'previous' ? f.stage - 1 : f.stage;
	const id = stage === undefined ? part : `s${stage}.${part}`;
	return slot.features.findIndex((g) => g.id === id);
};

// The readings of a part's held values, less any that name a group nobody else takes beside. The
// groups are read from the `about` tags of the custom's active set-valued stage parts, round by round.
export function effectiveReadings(slot: SlotDef, fv: Held, fi: number): Reading[] {
	const held = fv[fi] ?? [];
	const all = held.flatMap((vi) => slot.features[fi].values[vi].readings ?? []);
	if (!all.some((r) => r.others)) return [...all];
	const rounds = slot.features
		.flatMap((g, gi) => (g.size && g.stage !== undefined && isActiveIn(slot, fv, gi) ? [{ stage: g.stage, groups: (fv[gi] ?? []).map((vi) => g.values[vi].about ?? []) }] : []))
		.sort((a, b) => a.stage - b.stage);
	// Sound when the target takes in some round and a different group takes in that round or a later one.
	const sound = (target: Noun): boolean => {
		const first = rounds.findIndex((round) => round.groups.some((about) => about.includes(target)));
		return first >= 0 && rounds.slice(first).some((round) => round.groups.some((about) => !about.includes(target)));
	};
	return all.filter((r) => !r.others || (r.target !== undefined && sound(r.target)));
}

function holds(slot: SlotDef, fv: Held, f: FeatureDef, p: Predicate): boolean {
	if ('inHand' in p) {
		const m = inHand(slot, fv, f.stage);
		return p.inHand === 'some' ? m !== NOTHING : m === p.inHand;
	}
	const ti = targetIndex(slot, f, p.part, p.stage);
	if (ti < 0) return true; // a predicate pointing nowhere never silences a part
	const v = fv[ti];
	if (v === null || !isActiveIn(slot, fv, ti)) return false;
	if (p.has === 'anyMember') return v.length > 0;
	// Over a set, a predicate holds when some member matches.
	const readings = effectiveReadings(slot, fv, ti);
	if (p.has === 'anyReading') return readings.length > 0;
	const want = p.has;
	return readings.some(
		(r) => (want.verb === undefined || r.verb === want.verb) && (want.object === undefined || r.object === want.object) && (want.target === undefined || r.target === want.target)
	);
}

export function isActiveIn(slot: SlotDef, fv: Held, fi: number): boolean {
	const f = slot.features[fi];
	const v = fv[fi];
	if (v && f.stage !== undefined && !v.every((vi) => isAvailableIn(slot, fv, fi, vi))) return false;
	const ps = f.applies === undefined ? [] : Array.isArray(f.applies) ? f.applies : [f.applies];
	return ps.every((p) => holds(slot, fv, f, p));
}

export const isActive = (traits: CultureTraits, si: number, fi: number): boolean => isActiveIn(SLOTS[si], traits[si], fi);

export const activeParts = (traits: CultureTraits): [number, number][] =>
	SLOTS.flatMap((slot, si) => slot.features.flatMap((_, fi): [number, number][] => (isActiveIn(slot, traits[si], fi) ? [[si, fi]] : [])));

export const activeCount = (traits: CultureTraits): number => activeParts(traits).length;

export const activeIn = (slot: SlotDef, fv: TraitValues): number[] => fv.flatMap((_, fi) => (isActiveIn(slot, fv, fi) ? [fi] : []));

// The values held across the active parts: what a band's strain is counted against. A set counts
// once per member, an empty set not at all.
export const heldCount = (traits: CultureTraits): number => activeParts(traits).reduce((n, [si, fi]) => n + traits[si][fi].length, 0);

// Whether some held value of part `fi` in custom `si` is about `noun`.
export const heldAbout = (traits: CultureTraits, si: number, fi: number, noun: Noun): boolean =>
	traits[si][fi].some((vi) => SLOTS[si].features[fi].values[vi].about?.includes(noun) ?? false);

// ---------- shadows ----------

const partNamed = (f: FeatureDef, name: string): boolean => f.id === name || f.id.endsWith(`.${name}`);

// Whether a condition holds in one custom's current values. Readings are read through
// effectiveReadings, so a shadow rule and a predicate never disagree about an `others` reading.
function tagHolds(slot: SlotDef, fv: Held, tag: PartTag): boolean {
	return slot.features.some((f, fi) => {
		if (!partNamed(f, tag.part) || !isActiveIn(slot, fv, fi)) return false;
		const effective = effectiveReadings(slot, fv, fi);
		return (fv[fi] ?? []).some((vi) => {
				const about = f.values[vi].about ?? [];
				const readings = (f.values[vi].readings ?? []).filter((r) => effective.includes(r));
				const want = tag.has;
				return (
					(tag.about === undefined || about.includes(tag.about)) &&
					(tag.not === undefined || !about.includes(tag.not)) &&
					(want === undefined ||
						readings.some(
							(r) => (want.verb === undefined || r.verb === want.verb) && (want.object === undefined || r.object === want.object) && (want.target === undefined || r.target === want.target)
						))
				);
			});
	});
}

// Whether custom `si` is currently a shadow of another: some rule has every `when` tag holding in its
// own values and every `holds` tag holding in the other custom's. Hidden customs are not removed from
// the traits; the display and scoring decide what to do with this.
export function isShadowed(traits: CultureTraits, si: number, slots: readonly SlotDef[] = SLOTS): boolean {
	const slot = slots[si];
	return (slot.shadows ?? []).some((rule) => {
		const other = slots.findIndex((s) => s.id === rule.custom);
		return other >= 0 && rule.when.every((t) => tagHolds(slot, traits[si], t)) && rule.holds.every((t) => tagHolds(slots[other], traits[other], t));
	});
}
