import type { Condition, Consequence, Culture, GameState, Situation, StepInput, Storylet } from '$lib/types';
import { ageOf, leaderOf, yearOf } from './family';
import { contact } from './engine';
import { SLOTS } from './slots';

// The prerequisite structure and the storylet engine (2DS.1, decisions 3a, 3r; 6SL.5). Conditions
// are evaluated against the player's band at the end of a step; a storylet whose conditions all hold
// is raised as a situation for the coming step. The player's answers are applied at the next step's
// end, before the world moves. One structure gates storylets, writing and territory alike.

const slotIndex = (id: string): number => SLOTS.findIndex((s) => s.id === id);
const partIndex = (si: number, id: string): number => SLOTS[si].features.findIndex((f) => f.id === id);

// Whether a custom's held values satisfy a tag or reading query. An absent custom satisfies nothing.
function customHas(c: Culture, si: number, part: string | undefined, test: (vi: number, fi: number) => boolean): boolean {
	if (si < 0 || c.absent.includes(SLOTS[si].id)) return false;
	return SLOTS[si].features.some((f, fi) => (part === undefined || f.id === part || f.id.endsWith(`.${part}`)) && c.traits[si][fi].some((vi) => test(vi, fi)));
}

// Every sex noun a band's customs name, against the kinds its gender custom recognises.
const SEX_NOUNS = ['male', 'female', 'sex/both', 'sex/neither'] as const;
export function unrecognisedKinds(c: Culture): string[] {
	const gender = slotIndex('gender');
	const kinds = gender < 0 ? [] : c.traits[gender].flat().flatMap((vi) => SLOTS[gender].features[0].values[vi].about ?? []);
	const named = new Set<string>();
	SLOTS.forEach((s, si) => {
		if (s.id === 'gender' || c.absent.includes(s.id)) return;
		s.features.forEach((f, fi) => c.traits[si][fi].forEach((vi) => (f.values[vi].about ?? []).forEach((n) => SEX_NOUNS.includes(n as (typeof SEX_NOUNS)[number]) && named.add(n))));
	});
	return [...named].filter((n) => !kinds.includes(n as never));
}

export function holds(st: GameState, c: Culture, cond: Condition): boolean {
	if ('not' in cond) return !holds(st, c, cond.not);
	if ('custom' in cond) {
		const si = slotIndex(cond.custom);
		if ('present' in cond) return si >= 0 && !c.absent.includes(cond.custom) === cond.present;
		if ('about' in cond) return customHas(c, si, cond.part, (vi, fi) => SLOTS[si].features[fi].values[vi].about?.includes(cond.about) ?? false);
		const want = cond.has;
		return customHas(c, si, undefined, (vi, fi) =>
			(SLOTS[si].features[fi].values[vi].readings ?? []).some(
				(r) => (want.verb === undefined || r.verb === want.verb) && (want.object === undefined || r.object === want.object) && (want.target === undefined || r.target === want.target)
			)
		);
	}
	const year = yearOf(st.era);
	if ('year' in cond) return year >= cond.year[0] && year <= cond.year[1];
	if ('seat' in cond) return (cond.seat as string[]).includes(st.map.tiles[c.y][c.x]);
	if ('prosperity' in cond) return (cond.prosperity.below === undefined || c.prosperity < cond.prosperity.below) && (cond.prosperity.above === undefined || c.prosperity > cond.prosperity.above);
	if ('leader' in cond) {
		const l = leaderOf(c),
			age = ageOf(l, year);
		const a = cond.leader.age,
			g = cond.leader.generation;
		return (!a || (age >= a[0] && age <= a[1])) && (!g || (l.generation >= g[0] && l.generation <= g[1]));
	}
	if ('contact' in cond) {
		const any = st.cultures.some((k) => k.alive && k.id !== c.id && contact(st, c, k) > 0);
		return cond.contact === 'some' ? any : !any;
	}
	if ('event' in cond) return st.events.includes(cond.event);
	if ('fired' in cond) return st.story.some((r) => r.storylet === cond.fired && (cond.within === undefined || st.era - r.step <= cond.within));
	if ('answered' in cond)
		return st.story.some((r) => r.storylet === cond.answered.storylet && r.answer === cond.answered.answer && (cond.within === undefined || st.era - r.step <= cond.within));
	if ('unrecognised' in cond) return unrecognisedKinds(c).length > 0;
	return false;
}

const lastFired = (st: GameState, id: string): number | undefined => st.story.filter((r) => r.storylet === id).map((r) => r.step).pop();

// Which storylets fire now: everything raised by a consequence, plus every storylet whose
// conditions hold and that is not spent (once) or cooling down. 6SL.8 later caps the count.
export function fire(st: GameState, c: Culture, corpus: readonly Storylet[] = STORYLETS): Situation[] {
	const raised = new Set(st.raised);
	st.raised = [];
	const due = corpus.filter((s) => {
		if (raised.has(s.id)) return true;
		const last = lastFired(st, s.id);
		if (s.once && last !== undefined) return false;
		if (s.cooldown !== undefined && last !== undefined && st.era - last < s.cooldown) return false;
		return s.when.every((cond) => holds(st, c, cond));
	});
	return due.map((s) => ({
		id: `${st.era}:${s.id}`,
		storylet: s.id,
		text: s.text.replace(/\{leader\}/g, leaderOf(c).name),
		answers: s.answers.map((a) => ({ id: a.id, text: a.text }))
	}));
}

export function apply(st: GameState, c: Culture, cons: Consequence[]): void {
	cons.forEach((k) => {
		if ('log' in k) st.log.push({ era: st.era, text: k.log.replace(/\{leader\}/g, leaderOf(c).name) });
		else if ('prosperity' in k) c.prosperity = Math.max(0, Math.min(10, c.prosperity + k.prosperity));
		else if ('set' in k) {
			const si = slotIndex(k.set.custom),
				fi = si < 0 ? -1 : partIndex(si, k.set.part);
			if (fi < 0) return;
			const ids = Array.isArray(k.set.value) ? k.set.value : [k.set.value];
			const vis = ids.map((id) => SLOTS[si].features[fi].values.findIndex((v) => v.id === id)).filter((vi) => vi >= 0);
			if (vis.length) c.traits[si][fi] = vis;
		} else if ('lose' in k) {
			if (!c.absent.includes(k.lose)) c.absent.push(k.lose);
		} else if ('gain' in k) c.absent = c.absent.filter((id) => id !== k.gain);
		else if ('raise' in k) st.raised.push(k.raise);
	});
}

// The player's answers to last step's situations, applied and remembered. An unanswered situation
// was let lie: its storylet's `lie` consequences run, if it has any.
export function answer(st: GameState, c: Culture, step: StepInput, corpus: readonly Storylet[] = STORYLETS): void {
	st.situations.forEach((sit) => {
		const s = corpus.find((x) => x.id === sit.storylet);
		if (!s) return;
		const chosen = step.answers[sit.id];
		const a = s.answers.find((x) => x.id === chosen);
		st.story.push({ storylet: s.id, step: st.era, answer: a ? a.id : null });
		apply(st, c, a ? a.then : (s.lie ?? []));
	});
}

// The first storylets: enough to prove each mechanism. The corpus is 6SL.12's.
export const STORYLETS: readonly Storylet[] = [
	{
		id: 'new-leader-doubts',
		text: '{leader} is young, and the elders mutter that the old ways are theirs to keep.',
		when: [{ event: 'succession' }, { leader: { age: [18, 24] } }],
		answers: [
			{ id: 'yield', text: 'Let the elders have their way', then: [{ prosperity: 0.5 }, { log: 'The elders keep the old ways, and the band is the calmer for it.' }] },
			{ id: 'rule', text: 'Rule in your own name', then: [{ raise: 'elders-resist' }] }
		],
		lie: [{ log: 'The muttering fades, for now.' }]
	},
	{
		id: 'elders-resist',
		text: "The elders keep the hearth-fire's rite from {leader}.",
		when: [{ not: { year: [0, 100000] } }], // never on its own: only when raised
		once: true,
		answers: [
			{ id: 'yield', text: 'Yield the rite', then: [{ set: { custom: 'cult', part: 'officiant', value: 'elder-woman' } }, { log: 'The eldest woman keeps the daily rite from now on.' }] },
			{ id: 'force', text: 'Take it by force', then: [{ prosperity: -1 }, { log: '{leader} takes the rite, and the band remembers how.' }] }
		]
	},
	{
		id: 'strangers-at-the-ford',
		text: 'A band of strangers waits at the ford, and your people have always turned such away.',
		when: [{ custom: 'guest', part: 'stance', about: 'boundary' }, { contact: 'some' }],
		cooldown: 3,
		answers: [
			{ id: 'welcome', text: 'Take them in', then: [{ set: { custom: 'guest', part: 'stance', value: 'welcome' } }, { log: 'The strangers are taken in, and the door stands open after them.' }] },
			{ id: 'turn', text: 'Turn them away', then: [{ log: 'The strangers go on along the river.' }] }
		],
		lie: [{ log: 'Nobody goes down to the ford, and by morning the strangers are gone.' }]
	}
];
