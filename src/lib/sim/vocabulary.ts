// The words that tags and readings are written in. One noun list serves meaning tags and the
// objects and targets of readings alike. Verbs are paths: `send/away` and `send/to` are siblings.
// A word not on these lists fails the type check, so a typo can't create a new tag.

// Grown round by round as the corpus is tagged. Destinations are a family: beyond/sky, beyond/stars…
export const NOUNS = [
	// what an act works on, and what it leaves
	'body',
	'spirit',
	'memory',
	'dust',
	// where it sends them
	'beyond/sky',
	'beyond/stars',
	'beyond/otherworld',
	'ancestors',
	'gods',
	// what it is about
	'fire',
	'warmth',
	'light',
	'smoke',
	'ash',
	'haste',
	'purity',
	'sky',
	'birds',
	'wind',
	'bone',
	'patience',
	'openness',
	'permanence',
	'dryness',
	'salt',
	'presence',
	'wholeness',
	'earth',
	'darkness',
	'depth',
	'decay',
	'rest',
	'boundary',
	'water',
	'passage',
	'cleansing',
	'cold',
	'hiddenness',
	'dispersal',
	'lightness',
	'freedom',
	'labour',
	'intimacy',
	'completion',
	'hearth',
	'guardianship',
	'nearness',
	'abandonment',
	'indifference',
	// what a place answers to
	'remains',
	'living',
	'land',
	'height',
	'enclosure'
] as const satisfies readonly string[];

export const VERBS = [
	// what an act does to the dead
	'destroy',
	'sanctify',
	'release',
	'transform',
	// why a place: what it does for them
	'mark',
	'hide',
	'hold',
	'offer',
	'return'
] as const satisfies readonly string[];

export type Noun = (typeof NOUNS)[number];
export type Verb = (typeof VERBS)[number];
export type Term = Noun | Verb;

// Pairs that differ on exactly one thing. Opposition is always recorded; each lens decides what it is worth.
export const OPPOSITES: readonly (readonly [Term, Term])[] = [
	['haste', 'patience'],
	['decay', 'permanence'],
	['hiddenness', 'openness'],
	['dispersal', 'wholeness'],
	['nearness', 'passage']
];
