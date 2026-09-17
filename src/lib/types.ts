export interface TraitValue {
	name: string;
	aff?: Partial<Record<Terrain, number>>;
}

export type Terrain = 'coast' | 'marsh' | 'river' | 'forest' | 'steppe' | 'desert' | 'mountain';
export type MapTerrain = Terrain | 'water';

export interface FeatureDef {
	id: string;
	label: string;
	values: TraitValue[];
}

export interface SlotDef {
	id: string;
	domain: string;
	name: string;
	features: FeatureDef[];
	render: (values: string[]) => string;
}

export type TraitValues = number[];
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
	reforms: Record<string, number>;
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
	rec: number | null;
	conf: Confidence;
	truth: number;
	verdict: Verdict;
	pts: number;
	note: string;
}

export interface SlotReconstruction {
	slot: number;
	feats: FeatureReconstruction[];
	pts: number;
	recFv: (number | null)[];
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
