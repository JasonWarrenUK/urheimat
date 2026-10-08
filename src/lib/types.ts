import type { Noun, Verb } from '$lib/sim/vocabulary';

// One way of understanding what a practice does: send the spirit to the afterlife. `when` limits a
// reading to certain material in hand (scattering destroys a body only when it is ash or dust).
export interface Reading {
	verb: Verb;
	object: Noun;
	target?: Noun;
	when?: readonly Noun[];
	// Counts only when the target takes in the same round or an earlier one and someone else takes
	// in that round or a later one: a binding to the chief is vacuous if the chief takes alone.
	// Predicates and display honour it; the similarity table ignores it and reads the full reading.
	others?: true;
}

// What an act does to the remains: given this in hand, it leaves that. 'any' accepts whatever came;
// 'same' passes it on unchanged; 'nothing' ends the chain. Stage one starts with a body.
export interface Transition {
	accepts: Noun | 'any';
	yields: Noun | 'same' | 'nothing';
}

// Three kinds of tag: what a value is about, what a people believes it does, and what physically
// happens to the remains (which is what predicates, availability and material traces read).
export interface ValueTags {
	about?: readonly Noun[];
	readings?: readonly Reading[];
	material?: readonly Transition[];
}

// What the land itself does to a value, now. Never band state (memory, mobility, numbers).
// A terrain absent from a table allows the value.
export type AffLevel = 'strong' | 'favours' | 'allows' | 'resists' | 'excludes';
export type Affinity = Partial<Record<Terrain, AffLevel>>;

export interface TraitValue extends ValueTags {
	id?: string;
	name: string;
	aff?: Affinity;
}

export type Terrain = 'coast' | 'marsh' | 'river' | 'forest' | 'steppe' | 'desert' | 'mountain';
export type MapTerrain = Terrain | 'water';

// When a part applies: a condition over another part's current values in the same custom (written
// in tags, never value ids), or over the material in hand at this part's stage ('some' = anything).
// Over a set it holds when some member matches; `anyMember` holds when the set is not empty.
export type Predicate =
	| { part: string; stage?: 'same' | 'previous'; has: 'anyMember' | 'anyReading' | { verb?: Verb; object?: Noun; target?: Noun } }
	| { inHand: Noun | 'some' };

// A condition on one named part of a custom: some held value of any active part with that name
// (a staged part matches every round) is about `about`, is not about `not` and carries a reading
// matching `has`. Each field given must hold.
export interface PartTag {
	part: string;
	about?: Noun;
	not?: Noun;
	has?: { verb?: Verb; object?: Noun; target?: Noun };
}

// A custom that may be a shadow of another: while every `when` tag holds in this custom and every
// `holds` tag holds in `custom`, this one is hidden and reads as that one. Either side moving away
// from the match unhides it. Tags only; value ids never appear.
export interface ShadowRule {
	custom: string;
	when: PartTag[];
	holds: PartTag[];
}

export interface FeatureDef {
	id: string;
	label: string;
	values: TraitValue[];
	stage?: number;
	// A set-valued part holds between min and max distinct members (min 0 lets it be empty, which
	// ends a sequence). Any other part holds exactly one value.
	size?: readonly [min: number, max: number];
	applies?: Predicate | Predicate[]; // all must hold
}

export interface SlotDef {
	id: string;
	domain: string;
	name: string;
	features: FeatureDef[];
	shadows?: ShadowRule[];
	render: (values: string[]) => string;
}

// What one part holds: the indices of its held values. Length 1 for an ordinary part.
export type PartValue = number[];
export type TraitValues = PartValue[];
export type CultureTraits = TraitValues[];

export interface Drive {
	dx: number;
	dy: number;
	pref: Terrain;
}

export interface Culture {
	id: number;
	name: string;
	x: number;
	y: number;
	traits: CultureTraits;
	alive: boolean;
	isPlayer: boolean;
	prosperity: number;
	conserv: number;
	drive: Drive;
	known: CultureTraits;
	knownEra: number;
	migrated: boolean;
	held: Set<number>;
	bornEra: number;
	diedEra: number | null;
	parent: number | null;
}

export interface GameMap {
	tiles: MapTerrain[][];
	cx: number;
	cy: number;
}

export interface LogEntry {
	era: number;
	text: string;
}

export interface Rng {
	(): number;
	state: number;
}

export interface GameState {
	seed: number;
	rng: Rng;
	era: number;
	maxEra: number;
	cultures: Culture[];
	log: LogEntry[];
	playerId: number | null;
	over: boolean;
	playerDead: boolean;
	map: GameMap;
	peopleName: string;
	homeTerrain: MapTerrain;
	ancestral: CultureTraits;
}

export interface MovePlan {
	x: number;
	y: number;
}

export interface TeachPlan {
	kin: number;
	slot: number;
}

export interface Orders {
	held: Set<number>;
	reforms: Record<string, number>; // single-valued parts only
	move: MovePlan | null;
	split: boolean;
	consolidate: number;
	teach: TeachPlan | null;
}

export type Confidence = 'secure' | 'suspect' | null;
export type Verdict = 'lost' | 'correct' | 'wrong';

export interface FeatureReconstruction {
	f: number;
	label: string;
	rec: PartValue | null;
	conf: Confidence;
	truth: PartValue;
	verdict: Verdict;
	pts: number;
	note: string;
}

export interface SlotReconstruction {
	slot: number;
	feats: FeatureReconstruction[];
	pts: number;
	recFv: (PartValue | null)[];
}

export interface ReconstructionResult {
	entries: SlotReconstruction[];
	total: number;
	max: number;
	counts: { correct: number; wrong: number; lost: number };
	survivors: number;
}

export interface Point {
	x: number;
	y: number;
}

/** Saved run document (MongoDB `runs` collection). */
export interface RunDocument {
	_id?: string;
	playerId: string;
	seed: number;
	schemaVersion: number;
	state: SerializedGameState;
	era: number;
	over: boolean;
	updatedAt: Date;
	createdAt: Date;
}

/** GameState with Set/function fields replaced by plain JSON-safe shapes for storage. */
export interface SerializedGameState extends Omit<GameState, 'rng' | 'cultures'> {
	rngState: number;
	cultures: SerializedCulture[];
}

export type SerializedCulture = Omit<Culture, 'held'> & { held: number[] };

/** Leaderboard entry (MongoDB `scores` collection). */
export interface ScoreDocument {
	_id?: string;
	playerId: string;
	playerName: string;
	peopleName: string;
	seed: number;
	total: number;
	max: number;
	survivors: number;
	createdAt: Date;
}
