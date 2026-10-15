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
	// How well what this livelihood value yields keeps, which caps the surplus buffer (6SL.6). Only
	// livelihood sources say. Unset until the values are written; the stud reads none of it.
	keeps?: 'high' | 'low' | 'none';
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
	// What the land does to this part being empty (an unwed power, no image). A set with no members
	// carries no value affinity, so the land's pull towards absence is written here (6SL.3).
	empty?: Affinity;
	// A later stage of this part never repeats what an earlier stage holds (a sequence of distinct
	// members, such as a band's livelihood sources). Set by each(); a taker may take in two rounds.
	distinct?: true;
	applies?: Predicate | Predicate[]; // all must hold
}

export interface SlotDef {
	id: string;
	domain: string;
	name: string;
	features: FeatureDef[];
	shadows?: ShadowRule[];
	// What straining against the land costs. Food strain is hunger and lowers the band's food yield
	// (6SL.6); custom strain (the default) is pressure, which the situation system carries.
	strain?: 'food' | 'custom';
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

// One person in a band's leading family. Everything about a life is drawn at birth: `dies` is the
// year of death, `children` the ages at which their children are born. `parent` is null for a
// founder or a kinsman taken from outside the tree; `generation` counts from the scattering.
export interface Person {
	id: number;
	name: string;
	born: number;
	dies: number;
	parent: number | null;
	generation: number;
	children: number[];
	kinsman?: true; // taken from outside the tree after the scattering, of no line anyone can name
}

export interface Culture {
	id: number;
	name: string;
	x: number;
	y: number;
	traits: CultureTraits;
	alive: boolean;
	isPlayer: boolean;
	condition: BandCondition;
	conserv: number;
	drive: Drive;
	known: CultureTraits;
	knownEra: number;
	migrated: boolean;
	bornEra: number;
	diedEra: number | null;
	parent: number | null;
	family: Person[];
	leader: number; // a Person id in family
	absent: string[]; // custom ids the band lacks; their traits stay as a dormant memory
	pulls: Pull[]; // the pressures building on the band's customs, carried between steps
	lost: Lost[]; // values the band once held and no longer does (spike 3w)
	lands: Partial<Record<Terrain, number>>; // steps lived on each kind of land
}

// ---------- layer 1 pressures (6SL.3) ----------
// Every change to a band's customs is a pull answered (by the player or, for an AI band, by its
// let-it-lie outcome) or a storylet consequence; random drift is gone (spike 4a, 4e, 4m). A pull is
// one source's pressure on one part towards one operation; it accumulates between steps until it
// reaches the part's hold, then surfaces as a situation.
export type PullSource =
	| { kind: 'land' } // the land under the band's seat
	| { kind: 'neighbour'; band: number } // a band in contact practises it
	| { kind: 'memory' } // the band once held it (3w)
	| { kind: 'landscape'; terrain: Terrain } // a land the band lived on before
	| { kind: 'custom'; custom: string } // another custom's tags ask for it (livelihood on descent)
	| { kind: 'absence' }; // the land favours this part being empty

export type PullOp = 'adopt' | 'add' | 'drop';

export interface Pull {
	custom: number;
	part: number;
	op: PullOp; // adopt: an ordinary part takes the value; add or drop: a set gains or loses the member
	value: number;
	strength: number; // accumulated over steps
	source: PullSource; // whichever source contributed most this step
	live: boolean; // some source still pulls this way this step; otherwise the pull is fading
}

export interface Lost {
	custom: number;
	part: number;
	value: number;
	step: number;
}

// A pull one custom's tags make on another's part: while the band holds a value about `about` in
// `custom`, `to` is pulled at `strength` a step. The corpus lists them (PULLS).
export interface CustomPull {
	when: { custom: string; about: Noun };
	to: { custom: string; part: string; value: string };
	strength: number;
}

// A band's custom changes how many are born or die while it holds a value about `about` in `custom`
// (6SL.6). `births` is a relative change to the birth rate, `deaths` an extra fraction of numbers lost
// a step. The corpus lists them (DEMOGRAPHY); each row's real-world claim needs a source.
export interface DemographyRow {
	when: { custom: string; about: Noun };
	births?: number;
	deaths?: number;
	source?: string; // where the claim comes from
	unverified?: true; // no source yet
}

// ---------- condition strands (6SL.6) ----------
// Condition is felt through situations and never shown as numbers (spike 5f). Food is derived each
// step from the land, the livelihood customs and the numbers, so it is read and recorded but never
// stored or written: a consequence acts on the factors food derives from.
export type StrandId = 'food' | 'numbers' | 'buffer' | 'health' | 'morale' | 'standing';

// The seven livelihood sources, by the ids of the values of the livelihood custom's source part, and
// the five resource pools on a tile that they draw on (6SL.6): several sources share one pool, so
// the hoe and the plough share the soil and large and small herds share the pasture.
export type SourceId = 'herds/large' | 'herds/small' | 'crop/hoe' | 'crop/plough' | 'catch' | 'hunt' | 'gather';
export type PoolId = 'soil' | 'pasture' | 'game' | 'fish' | 'plants';
export type WritableStrandId = Exclude<StrandId, 'food'>;

// Which bands a consequence acts on, resolved when it is applied. Open: the set of references.
export type BandRef = 'self' | 'parent' | 'daughters' | 'contacts';

// The derived food of one step: what the land and the customs yield, what the numbers need, and how
// the two stand. Adequacy below 1 is hunger.
export interface FoodReading {
	yield: number;
	need: number;
	adequacy: number;
}

// One route's state on one band. Strength is the pull it has built, and it gates surfacing; the
// refusals set the tier (a route surfaced with `refusals` refusals is at tier `refusals + 1`).
// `surfaced` is whether the route put a situation to the band this step, and `resolved` whether an
// answer resolved it, so its forced outcome happens at the next step.
export interface LadderState {
	strength: number;
	refusals: number;
	surfaced: boolean;
	resolved: boolean;
}

// Every strand of one band at the end of one step, with food as derived then, and where the band
// stood and what it practised (4SD.15). The notebook reads condition over time from these (2DS.3:
// "Hard times and good") and customs and routes over time from the seat and the traits.
export interface StrandSnapshot {
	step: number;
	numbers: number;
	buffer: number;
	health: number;
	morale: number;
	standing: Record<number, number>;
	food: FoodReading;
	x: number;
	y: number;
	traits: CultureTraits; // a copy: later changes never reach it
	absent: string[];
}

export interface BandCondition {
	numbers: number; // the hidden headcount; conditions read its size tier
	buffer: number; // surplus carried between steps, capped by how well the food keeps and how settled the band is
	health: number;
	morale: number;
	standing: Record<number, number>; // each other band's regard for this one, by band id
	seatSteps: number; // steps in a row on the current seat; stands in for settledness until 4SD.11
	// The tiles the band cultivates, as "x,y" keys, held across steps (the hoe and the plough share
	// them), and how many steps in a row they have gone unneeded. Itinerant sources hold no tiles.
	fields: string[];
	fieldIdle: number;
	ladders: Record<string, LadderState>;
	history: StrandSnapshot[];
}

// A dated, structured event beside the chronicle text, for the notebook's turning points. A custom
// event (4SD.15) carries the change itself: which part moved and what it held before and after.
export type BandEventKind = 'death' | 'split' | 'move' | 'ladder' | 'custom';
export interface CustomChange {
	custom: number;
	part: number;
	from: number[];
	to: number[];
}
export interface BandEvent {
	kind: BandEventKind;
	band: number;
	step: number;
	reason: string;
	change?: CustomChange; // on a custom event for a changed part; a custom lost or regained carries its reason only
}

// What a ladder does when its last tier is reached.
export type ForcedOutcome = { death: true } | { split: string };

// A route is data: what feeds its pull, where each tier starts and what the last tier forces. The
// situations at each tier are storylets that hold a `{ ladder }` condition, so a combination of
// routes is a storylet that holds several (the most specific storylet wins).
export interface LadderFeed {
	when: Condition[]; // all must hold for the band this step
	by: number; // strength added to the pull
}

export interface LadderRoute {
	id: string;
	kind: 'death' | 'split';
	feeds: LadderFeed[];
	hold: number; // the strength at which the route surfaces
	tiers: number; // how many tiers of situation it has; refusing the last forces the outcome
	fade: number; // what the pull keeps each step nothing feeds it
	forced: ForcedOutcome;
}

// What an answer does to a route in play: refuse it (the route climbs), ease it (buy time or cure,
// by `by` of strength) or resolve it (its outcome happens now, by consent).
export type LadderMove = 'refuse' | 'ease' | 'resolve';

export interface GameMap {
	tiles: MapTerrain[][];
	cx: number;
	cy: number;
	// What each tile's resource pools hold as a fraction of full (6SL.6). Sparse: a tile no band has
	// worked is absent and a pool absent from a tile is full. Keyed "x,y".
	stocks: Record<string, Partial<Record<PoolId, number>>>;
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
	situations: Situation[]; // put to the player this step
	events: StepEvent[]; // what happened to the player's band in the last step
	bandEvents: BandEvent[]; // structured events for every band, kept for the notebook
	story: StoryRecord[]; // every storylet that fired, in order
	raised: string[]; // storylets to fire next step whatever their conditions
}

// What the player brings to a step: a move (the one act a band may start unprompted, spike 4i) and
// an answer to each situation, by situation id. Nothing else can be started; there is no budget.
export interface StepInput {
	move: Point | null;
	answers: Record<string, string>;
}

// A situation put to the player in a step, and the answers written for it. Pressures (6SL.3) and
// storylets (6SL.5) raise them; "let it lie" is always offered (spike 3m) and is rendered, not stored.
export interface Answer {
	id: string;
	text: string;
}

export interface Situation {
	id: string; // unique within the step
	storylet?: string; // which storylet raised it, for a storylet situation
	pressure?: Pressure; // the pull it surfaces, for a pressure situation
	text: string;
	answers: Answer[];
}

// A surfaced pull, with the third course worked out when it was raised (a value found through the
// lens for its cause: the nearest by meaning the land allows, or their means with your reason).
export interface Pressure {
	pull: Pull;
	third: number | null;
}

// ---------- the prerequisite structure (6SL.5) ----------
// One condition language gates storylets, writing and territory alike (spike 3r). Every condition is
// evaluated against the player's band at the end of a step; a storylet fires when all of its hold.
export type Condition =
	| { custom: string; about: Noun; part?: string } // some held value is about the noun
	| { custom: string; has: { verb?: Verb; object?: Noun; target?: Noun } } // some held value carries the reading
	| { custom: string; present: boolean } // the band holds, or lacks, the custom
	| { year: [from: number, to: number] }
	| { seat: Terrain[] }
	// A strand stands at a level now (food reads as adequacy, standing as the mean regard) or moves
	// against the last step's snapshot. A ladder route is live at a tier.
	| { strand: { id: StrandId; below?: number; above?: number; trend?: 'rising' | 'falling' } }
	| { ladder: { route: string; tier: number } }
	| { leader: { age?: [lo: number, hi: number]; generation?: [lo: number, hi: number]; line?: 'tracked' | 'kinsman' } }
	| { contact: 'some' | 'none' }
	// A neighbour in contact practises something: `known` reads the band's dated knowledge of its kin
	// (which may be stale), `now` the neighbour's actual customs. A storylet that reads `known` and
	// resolves on `now` plays the gap between what a band believes of its kin and what is true.
	| { neighbour: { custom: string; about: Noun; part?: string; via?: 'known' | 'now' } }
	| { stale: number } // some neighbour in contact was last known more than so many steps ago
	| { event: StepEvent } // happened to the band this step
	| { fired: string; within?: number } // a storylet fired, within so many steps
	| { answered: { storylet: string; answer: string }; within?: number }
	| { unrecognised: true } // a custom names a kind of person the gender custom does not recognise
	| { pressure: { custom: string; part?: string; source?: PullSource['kind'] } } // a pull surfaces on it this step
	| { not: Condition };

export type StepEvent = 'succession' | 'move' | 'split' | 'death';

// What an answer does. 6SL.4 extends this.
export type Consequence =
	| { log: string }
	// A strand moves by `by`, on the bands named in `of` (the band itself when absent). Food is not
	// writable, and standing always names the bands whose regard changes: naming none is an error.
	| { strand: Exclude<WritableStrandId, 'standing'>; by: number; of?: BandRef[] }
	| { strand: 'standing'; by: number; of: [BandRef, ...BandRef[]] }
	// What the answer does to a ladder route in play. Every answer to a ladder situation states one
	// for each route it names (a corpus test enforces it); letting a situation lie is always a refusal.
	| { ladder: { route: string; do: LadderMove; by?: number } }
	| { prosperity: number } // STUD: legacy, mapped to morale until the corpus pass remaps every answer (docs/spikes/6SL.6-remap-table.md), then deleted
	| { set: { custom: string; part: string; value: string | string[] } } // by value id
	| { lose: string }
	| { gain: string }
	| { raise: string } // a storylet fires next step whatever its conditions
	| { succession: true }; // the reign ends now; the band's descent rule picks the next leader

export interface StoryAnswer {
	id: string;
	text: string;
	then: Consequence[];
}

export interface Storylet {
	id: string;
	text: string; // {leader} names the band's leader
	when: Condition[];
	raisedOnly?: boolean; // never fires on its own conditions; only when a consequence raises it
	chance?: number; // odds of firing each time its conditions hold, from the seeded rng (1 when absent)
	once?: boolean;
	cooldown?: number; // steps before it may fire again
	answers: StoryAnswer[];
	lie?: Consequence[]; // what letting it lie does
}

// What the engine remembers of storylets: when each fired and how it was answered (null = let lie).
export interface StoryRecord {
	storylet: string;
	step: number;
	answer: string | null;
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

/** GameState with the rng replaced by its state for storage. */
export interface SerializedGameState extends Omit<GameState, 'rng'> {
	rngState: number;
}

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
