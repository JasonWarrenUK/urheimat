// The words that tags and readings are written in. One noun list serves meaning tags and the
// objects and targets of readings alike. Verbs are paths: `send/away` and `send/to` are siblings.
// A word not on these lists fails the type check, so a typo can't create a new tag.

// Grown round by round as the corpus is tagged. Destinations are a family: beyond/sky, beyond/stars…
export const NOUNS = [
	// what an act works on
	'body',
	'spirit',
	'memory',
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
	'purity'
] as const satisfies readonly string[];

export const VERBS = ['lay', 'destroy', 'sanctify', 'release', 'transform'] as const satisfies readonly string[];

export type Noun = (typeof NOUNS)[number];
export type Verb = (typeof VERBS)[number];
export type Term = Noun | Verb;

// Pairs that differ on exactly one thing. Opposition is always recorded; each lens decides what it is worth.
export const OPPOSITES: readonly (readonly [Term, Term])[] = [];
