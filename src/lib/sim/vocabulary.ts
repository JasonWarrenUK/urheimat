// The words that tags and readings are written in. One noun list serves meaning tags and the
// objects and targets of readings alike. Verbs are paths: `send/away` and `send/to` are siblings.
// A word not on these lists fails the type check, so a typo can't create a new tag.

export const NOUNS = [] as const satisfies readonly string[];
export const VERBS = [] as const satisfies readonly string[];

export type Noun = (typeof NOUNS)[number];
export type Verb = (typeof VERBS)[number];
export type Term = Noun | Verb;

// Pairs that differ on exactly one thing. Opposition is always recorded; each lens decides what it is worth.
export const OPPOSITES: readonly (readonly [Term, Term])[] = [];
