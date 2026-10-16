import type { BandRef, Condition, Consequence, Culture, GameState, Situation, StepInput, Storylet } from '$lib/types';
import { liveTier, readStrand, trendOf, writeStrand } from './condition';
import { ageOf, leaderOf, successor, yearOf } from './family';
import { contact } from './engine';
import { emit } from './history';
import { moveRoute } from './ladder';
import { change, resolve } from './pressures';
import { SLOTS } from './slots';

// The prerequisite structure and the storylet engine (2DS.1, decisions 3a, 3r; 6SL.5). Conditions
// are evaluated against the player's band at the end of a step; a storylet whose conditions all hold
// is raised as a situation for the coming step. The player's answers are applied at the next step's
// end, before the world moves. One structure gates storylets, writing and territory alike.

const slotIndex = (id: string): number => SLOTS.findIndex((s) => s.id === id);
const partIndex = (si: number, id: string): number => SLOTS[si].features.findIndex((f) => f.id === id);

// Whether a custom's held values satisfy a tag or reading query. An absent custom satisfies nothing.
function customHas(c: Culture, si: number, part: string | undefined, test: (vi: number, fi: number) => boolean, traits = c.traits): boolean {
	if (si < 0 || c.absent.includes(SLOTS[si].id)) return false;
	return SLOTS[si].features.some((f, fi) => (part === undefined || f.id === part || f.id.endsWith(`.${part}`)) && traits[si][fi].some((vi) => test(vi, fi)));
}

const neighbours = (st: GameState, c: Culture): Culture[] => st.cultures.filter((k) => k.alive && k.id !== c.id && contact(st, c, k) > 0);

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
	if ('strand' in cond) {
		const want = cond.strand,
			now = readStrand(st, c, want.id);
		return (want.below === undefined || now < want.below) && (want.above === undefined || now > want.above) && (want.trend === undefined || trendOf(st, c, want.id) === want.trend);
	}
	if ('ladder' in cond) return liveTier(c, cond.ladder.route) === cond.ladder.tier;
	if ('leader' in cond) {
		const l = leaderOf(c),
			age = ageOf(l, year);
		const a = cond.leader.age,
			g = cond.leader.generation,
			line = cond.leader.line;
		return (
			(!a || (age >= a[0] && age <= a[1])) &&
			(!g || (l.generation >= g[0] && l.generation <= g[1])) &&
			(!line || (line === 'kinsman') === !!l.kinsman)
		);
	}
	if ('contact' in cond) {
		const any = neighbours(st, c).length > 0;
		return cond.contact === 'some' ? any : !any;
	}
	if ('neighbour' in cond) {
		const n = cond.neighbour,
			si = slotIndex(n.custom);
		return neighbours(st, c).some((k) =>
			customHas(k, si, n.part, (vi, fi) => SLOTS[si].features[fi].values[vi].about?.includes(n.about) ?? false, n.via === 'now' ? k.traits : k.known)
		);
	}
	if ('stale' in cond) return neighbours(st, c).some((k) => st.era - k.knownEra > cond.stale);
	if ('event' in cond) return st.events.includes(cond.event);
	if ('fired' in cond) return st.story.some((r) => r.storylet === cond.fired && (cond.within === undefined || st.era - r.step <= cond.within));
	if ('answered' in cond)
		return st.story.some((r) => r.storylet === cond.answered.storylet && r.answer === cond.answered.answer && (cond.within === undefined || st.era - r.step <= cond.within));
	if ('unrecognised' in cond) return unrecognisedKinds(c).length > 0;
	if ('pressure' in cond) {
		const want = cond.pressure;
		return st.situations.some(({ pressure }) => {
			if (!pressure) return false;
			const p = pressure.pull,
				f = SLOTS[p.custom].features[p.part];
			return SLOTS[p.custom].id === want.custom && (want.part === undefined || f.id === want.part || f.id.endsWith(`.${want.part}`)) && (want.source === undefined || p.source.kind === want.source);
		});
	}
	return false;
}

const lastFired = (st: GameState, id: string): number | undefined => st.story.filter((r) => r.storylet === id).map((r) => r.step).pop();

// At most this many situations a step: a raised storylet always fires, and the rest are drawn at
// random from the pool of storylets whose conditions hold. The unpicked do not fire this step. 6SL.8
// replaces the flat cap with weather.
export const SITUATIONS_PER_STEP = 2;

// The ladder routes a storylet names in its conditions. A storylet that names a route is that
// route's situation at that tier, and one that names several is their combination (6SL.6).
export const namedRoutes = (s: Storylet): string[] => s.when.flatMap((w) => ('ladder' in w ? [w.ladder.route] : []));

// Of the ladder storylets that hold, the most specific wins and consumes the routes it names: a
// storylet whose routes another holding storylet names too, and more, is dropped.
function mostSpecific(pool: Storylet[]): Storylet[] {
	return pool.filter((s) => !pool.some((o) => o !== s && namedRoutes(o).length > namedRoutes(s).length && namedRoutes(s).every((r) => namedRoutes(o).includes(r))));
}

// Which storylets fire now: everything raised by a consequence, plus storylets whose conditions
// hold and that are not spent (once) or cooling down, drawn to the cap. Ladder storylets sit outside
// the cap: every live route surfaces each step, and 6SL.8 takes over all caps later.
export function fire(st: GameState, c: Culture, corpus: readonly Storylet[] = STORYLETS): Situation[] {
	const raised = new Set(st.raised);
	st.raised = [];
	const pool = corpus.filter((s) => {
		if (raised.has(s.id)) return true;
		if (s.raisedOnly) return false;
		const last = lastFired(st, s.id);
		if (s.once && last !== undefined) return false;
		if (s.cooldown !== undefined && last !== undefined && st.era - last < s.cooldown) return false;
		if (!s.when.every((cond) => holds(st, c, cond))) return false;
		return s.chance === undefined || st.rng() < s.chance;
	});
	const due = pool.filter((s) => raised.has(s.id));
	const ladders = mostSpecific(pool.filter((s) => !raised.has(s.id) && namedRoutes(s).length));
	const rest = pool.filter((s) => !raised.has(s.id) && !namedRoutes(s).length);
	while (due.length < SITUATIONS_PER_STEP && rest.length) due.push(rest.splice(Math.floor(st.rng() * rest.length), 1)[0]);
	return [...due, ...ladders].map((s) => ({
		id: `${st.era}:${s.id}`,
		storylet: s.id,
		text: s.text.replace(/\{leader\}/g, leaderOf(c).name),
		answers: s.answers.map((a) => ({ id: a.id, text: a.text }))
	}));
}

// The bands a consequence's `of` names, as they stand when it is applied. A reference nobody meets
// (no parent, no daughters, no one in contact) names no band, and the write does nothing.
function bandsFor(st: GameState, c: Culture, refs: readonly BandRef[]): Culture[] {
	const found = refs.flatMap((ref) => {
		if (ref === 'self') return [c];
		if (ref === 'parent') return c.parent === null ? [] : [st.cultures[c.parent]];
		if (ref === 'daughters') return st.cultures.filter((k) => k.alive && k.parent === c.id);
		return neighbours(st, c);
	});
	return found.filter((k, i) => found.indexOf(k) === i);
}

export function apply(st: GameState, c: Culture, cons: Consequence[]): void {
	cons.forEach((k) => {
		if ('log' in k) st.log.push({ era: st.era, text: k.log.replace(/\{leader\}/g, leaderOf(c).name) });
		else if ('ladder' in k) moveRoute(c, k.ladder.route, k.ladder.do, k.ladder.by);
		else if ('strand' in k) bandsFor(st, c, k.of ?? ['self']).forEach((target) => writeStrand(target, c, k.strand, k.by));
		else if ('prosperity' in k) writeStrand(c, c, 'morale', k.prosperity); // STUD: legacy shim until the corpus pass remaps the answers
		else if ('set' in k) {
			const si = slotIndex(k.set.custom),
				fi = si < 0 ? -1 : partIndex(si, k.set.part);
			if (fi < 0) return;
			const ids = Array.isArray(k.set.value) ? k.set.value : [k.set.value];
			const vis = ids.map((id) => SLOTS[si].features[fi].values.findIndex((v) => v.id === id)).filter((vi) => vi >= 0);
			if (vis.length) change(st, c, si, fi, vis);
		} else if ('lose' in k) {
			if (!c.absent.includes(k.lose)) {
				c.absent.push(k.lose);
				emit(st, 'custom', c.id, `${k.lose}: lost`);
			}
		} else if ('gain' in k) {
			if (c.absent.includes(k.gain)) {
				c.absent = c.absent.filter((id) => id !== k.gain);
				emit(st, 'custom', c.id, `${k.gain}: regained`);
			}
		} else if ('raise' in k) st.raised.push(k.raise);
		else if ('succession' in k) {
			const year = yearOf(st.era),
				next = successor(st.rng, c, year);
			c.leader = next.id;
			st.events.push('succession');
			st.log.push({ era: st.era, text: `${next.name}, ${ageOf(next, year)}, leads the ${c.name} from now.` });
		}
	});
}

// The player's answers to last step's situations, applied and remembered. An unanswered situation
// was let lie: a storylet's `lie` consequences run, if it has any; a pressure takes its own outcome.
export function answer(st: GameState, c: Culture, step: StepInput, corpus: readonly Storylet[] = STORYLETS): void {
	st.situations.forEach((sit) => {
		const chosen = step.answers[sit.id];
		if (sit.pressure) {
			resolve(st, c, sit.pressure, sit.answers.some((a) => a.id === chosen) ? chosen : null);
			return;
		}
		const s = corpus.find((x) => x.id === sit.storylet);
		if (!s) return;
		const a = s.answers.find((x) => x.id === chosen);
		st.story.push({ storylet: s.id, step: st.era, answer: a ? a.id : null });
		// Letting a ladder situation lie is always a refusal of every route it names; an answer says what
		// it does to each route in its own consequences.
		if (!a) namedRoutes(s).forEach((route) => moveRoute(c, route, 'refuse'));
		apply(st, c, a ? a.then : (s.lie ?? []));
	});
}

// The first storylets: enough to prove each mechanism. The corpus is 6SL.12's.
export const STORYLETS: readonly Storylet[] = [
	// STUD: the famine ladder's first tier, the one example route, replaced by 6SL.19's storylets.
	{
		id: 'famine-1',
		text: 'The stores are gone and the herds and fields do not feed everyone. The elders ask what is to be done.',
		when: [{ ladder: { route: 'famine', tier: 1 } }],
		answers: [
			{ id: 'ration', text: 'Ration what there is', then: [{ ladder: { route: 'famine', do: 'ease', by: 1 } }, { strand: 'health', by: -1 }, { strand: 'buffer', by: 0.05 }] },
			{ id: 'feast', text: 'Hold a feast and trust in the gods', then: [{ ladder: { route: 'famine', do: 'refuse' } }, { strand: 'morale', by: 1 }, { strand: 'health', by: -1 }] }
		]
	},
	{
		id: 'famine-2',
		text: 'The hunger has not lifted. People are leaving the fires to forage, and the old are not eating.',
		when: [{ ladder: { route: 'famine', tier: 2 } }],
		answers: [
			{ id: 'ration-hard', text: 'Ration hard and share it by lot', then: [{ ladder: { route: 'famine', do: 'ease', by: 1.5 } }, { strand: 'health', by: -1 }, { strand: 'morale', by: -1 }] },
			{ id: 'wait', text: 'Wait for the season to turn', then: [{ ladder: { route: 'famine', do: 'refuse' } }] }
		]
	},
	{
		id: 'famine-3',
		text: 'People are dying of want. The elders say the band cannot hold together another year like this.',
		when: [{ ladder: { route: 'famine', tier: 3 } }],
		answers: [
			{ id: 'slaughter', text: 'Eat the seed and the breeding stock', then: [{ ladder: { route: 'famine', do: 'ease', by: 2 } }, { strand: 'health', by: -2 }, { strand: 'morale', by: -2 }] },
			{ id: 'endure', text: 'Endure it', then: [{ ladder: { route: 'famine', do: 'refuse' } }] }
		]
	},
	{
		id: 'new-leader-doubts',
		text: '{leader} is young, and the elders mutter that the old ways are theirs to keep.',
		when: [{ event: 'succession' }, { leader: { age: [18, 24] } }],
		cooldown: 3,
		chance: 0.7,
		answers: [
			{ id: 'yield', text: 'Let the elders have their way', then: [{ prosperity: 0.5 }, { log: 'The elders keep the old ways, and the band is the calmer for it.' }] },
			{ id: 'rule', text: 'Rule in your own name', then: [{ raise: 'elders-resist' }] }
		],
		lie: [{ log: 'The muttering fades, for now.' }]
	},
	{
		id: 'elders-resist',
		text: "The elders keep the hearth-fire's rite from {leader}.",
		when: [],
		raisedOnly: true,
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
		cooldown: 5,
		chance: 0.5,
		answers: [
			{ id: 'welcome', text: 'Take them in', then: [{ set: { custom: 'guest', part: 'stance', value: 'welcome' } }, { log: 'The strangers are taken in, and the door stands open after them.' }] },
			{ id: 'turn', text: 'Turn them away', then: [{ log: 'The strangers go on along the river.' }] }
		],
		lie: [{ log: 'Nobody goes down to the ford, and by morning the strangers are gone.' }]
	},
	// Round 1: successions.
	{
		id: 'old-leader-lingers',
		text: '{leader} is past sixty, and the young speak of the next leader within hearing.',
		when: [{ leader: { age: [60, 99] } }],
		cooldown: 6,
		chance: 0.5,
		answers: [
			{ id: 'name', text: 'Name the heir now', then: [{ prosperity: 0.5 }, { log: 'The heir is named, and the band settles, knowing.' }] },
			{ id: 'hand', text: 'Hand the seat to the heir now', then: [{ succession: true }] },
			{ id: 'eldest', text: 'Fix the rule that the eldest inherits', then: [{ set: { custom: 'descent', part: 'share', value: 'eldest' } }, { log: 'From now the eldest inherits, and everyone knows who comes next.' }] },
			{ id: 'elect', text: 'Let the band elect its leaders from now on', then: [{ set: { custom: 'rule', part: 'chosen', value: 'election' } }, { log: 'The band will choose its leaders; the talk turns to who would win.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The talk goes on in corners, and the band frays a little.' }]
	},
	{
		id: 'kinsman-takes-over',
		text: '{leader}, of no line anyone can name, now leads, and the old families watch.',
		when: [{ event: 'succession' }, { leader: { line: 'kinsman' } }],
		answers: [
			{ id: 'spear', text: 'Rule by right of the spear', then: [{ set: { custom: 'rule', part: 'source', value: 'war' } }, { log: '{leader} rules because nobody dares say otherwise.' }] },
			{ id: 'marry', text: 'Marry into the old line', then: [{ set: { custom: 'marriage', part: 'band', value: 'own' } }, { log: 'A marriage within the band ties the new leader to the old names.' }] },
			{ id: 'elect', text: 'Let the families elect the next leader', then: [{ set: { custom: 'rule', part: 'chosen', value: 'election' } }, { log: 'The families are promised the choice of the next leader.' }] },
			{ id: 'gifts', text: 'Buy their loyalty with gifts', then: [{ prosperity: -1 }, { log: 'Herds and goods go to the old families, and they are quiet for it.' }] }
		],
		lie: [{ raise: 'old-families' }]
	},
	{
		id: 'old-families',
		text: 'The old families keep their own hearth and their own counsel, and the band is two bands under one name.',
		when: [],
		raisedOnly: true,
		once: true,
		answers: [
			{ id: 'council', text: 'Give them a seat beside you', then: [{ set: { custom: 'rule', part: 'seat', value: 'council' } }, { log: 'The old families sit in council with the leader from now.' }] },
			{ id: 'elders', text: 'Let the elders judge between you', then: [{ set: { custom: 'rule', part: 'source', value: 'age' } }, { log: 'The elders judge, and both sides abide by it.' }] },
			{ id: 'rite', text: 'Let them keep their own hearth-rite', then: [{ set: { custom: 'cult', part: 'officiant', value: 'household-head' } }, { log: 'Each household head keeps the daily rite at their own hearth.' }] },
			{ id: 'face', text: 'Face them down', then: [{ prosperity: -1 }, { log: 'The old families are faced down, and some of them do not forget it.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'Two bands under one name, and the name wears thin.' }]
	},
	{
		id: 'sisters-child-inherits',
		text: "{leader}, the old leader's sister's child, takes the seat as the mothers' line requires.",
		when: [{ event: 'succession' }, { custom: 'descent', part: 'heirs', about: 'female' }],
		cooldown: 4,
		chance: 0.5,
		answers: [
			{ id: 'honour', text: 'Honour the mothers', then: [{ prosperity: 0.5 }, { log: "The mothers are honoured, and the band is glad of its own rule." }] },
			{ id: 'line', text: "Make the mothers' line the band's line for good", then: [{ set: { custom: 'descent', part: 'line', value: 'mother' } }, { log: 'From now a child belongs to the mother\'s line.' }] },
			{ id: 'sons', text: "Let the fathers' sons inherit from now on", then: [{ set: { custom: 'descent', part: 'heirs', value: 'children' } }, { log: "From now a leader's own children inherit." }] },
			{ id: 'feast', text: 'Keep the peace with a feast', then: [{ prosperity: -0.5 }, { set: { custom: 'sacrifice', part: 'manner', value: 'feast' } }, { log: 'A feast is given, and what is offered is shared from now.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: "The old leader's own children sulk, and take some of the band's goodwill with them." }]
	},
	{
		id: 'heirs-contest-the-seat',
		text: 'The estate passes equally, and two heirs each claim the seat.',
		when: [{ event: 'succession' }, { custom: 'descent', part: 'share', about: 'equality' }],
		cooldown: 5,
		chance: 0.6,
		answers: [
			{ id: 'council', text: 'Hold a council of both', then: [{ set: { custom: 'rule', part: 'seat', value: 'council' } }, { log: 'The two heirs sit in council, and the seat is a bench.' }] },
			{ id: 'eldest', text: 'The eldest takes all', then: [{ set: { custom: 'descent', part: 'share', value: 'eldest' } }, { log: 'The eldest takes all, and the rule is fixed for those who follow.' }] },
			{ id: 'youngest', text: 'The youngest keeps the hearth', then: [{ set: { custom: 'descent', part: 'share', value: 'youngest' } }, { log: 'The youngest keeps the hearth, and the elder goes out to make their own.' }] },
			{ id: 'lots', text: 'Draw lots before the gods', then: [{ set: { custom: 'rule', part: 'chosen', value: 'lot' } }, { log: 'Lots are drawn before the gods, and the gods will choose from now.' }] },
			{ id: 'again', text: 'Set the seat aside and let the rule choose again', then: [{ succession: true }] }
		],
		lie: [{ prosperity: -1 }, { log: 'The quarrel festers, and the band pays for it.' }]
	},
	// Round 2: the customs themselves.
	{
		id: 'blood-price-unpaid',
		text: "A killing among your people, and the killer's kin cannot pay the blood-price.",
		when: [{ custom: 'justice', part: 'remedy', about: 'wealth' }],
		once: true,
		chance: 0.35,
		answers: [
			{ id: 'exile', text: 'Take exile instead', then: [{ set: { custom: 'justice', part: 'remedy', value: 'exile' } }, { log: 'The killer goes into exile, and exile is the remedy from now.' }] },
			{ id: 'feud', text: 'Let the feud run', then: [{ set: { custom: 'justice', part: 'remedy', value: 'feud' } }, { log: 'The dead man\'s kin take their own remedy, and the band lets them.' }] },
			{ id: 'herds', text: "Pay it from the leader's own herds", then: [{ prosperity: -1 }, { log: '{leader} pays the blood-price, and the band is the poorer for it.' }] },
			{ id: 'assembly', text: 'Make the assembly judge the debt', then: [{ set: { custom: 'justice', part: 'finding', value: 'assembly' } }, { log: 'The assembly judges the debt, and guilt is theirs to find from now.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'Nothing is paid, and bad blood runs between the families.' }]
	},
	{
		id: 'wives-quarrel-over-heirs',
		text: "The leader's wives quarrel over whose child inherits.",
		when: [{ custom: 'marriage', part: 'count', about: 'hierarchy' }],
		once: true,
		chance: 0.35,
		answers: [
			{ id: 'eldest', text: 'The eldest inherits', then: [{ set: { custom: 'descent', part: 'share', value: 'eldest' } }, { log: 'The eldest child inherits, whoever the mother.' }] },
			{ id: 'equal', text: 'All inherit equally', then: [{ set: { custom: 'descent', part: 'share', value: 'equal' } }, { log: 'The estate is to be divided equally among every child.' }] },
			{ id: 'one', text: 'One spouse from now on', then: [{ set: { custom: 'marriage', part: 'count', value: 'one' } }, { log: 'From now a leader takes one spouse, and the quarrel has no heirs.' }] },
			{ id: 'lots', text: 'Lots before the gods', then: [{ set: { custom: 'rule', part: 'chosen', value: 'lot' } }, { log: 'The gods choose by lot, and no wife can argue with them.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The quarrel runs on through the household and out of it.' }]
	},
	{
		id: 'ordeal-drowns-the-innocent',
		text: 'The ordeal by water drowns a man most believe innocent.',
		when: [{ custom: 'justice', part: 'finding', about: 'chance' }],
		once: true,
		chance: 0.35,
		answers: [
			{ id: 'assembly', text: 'Let the assembly judge from now', then: [{ set: { custom: 'justice', part: 'finding', value: 'assembly' } }, { log: 'The water is left alone; the assembly finds guilt from now.' }] },
			{ id: 'oath', text: 'Let the accused swear with oath-helpers', then: [{ set: { custom: 'justice', part: 'finding', value: 'oath' } }, { log: 'An accused swears with oath-helpers from now, and the gods hear the lie if there is one.' }] },
			{ id: 'fire', text: 'Cleanse the band by fire', then: [{ set: { custom: 'justice', part: 'cleansing', value: 'fire' } }, { log: 'The band passes through fire, and fire is the cleansing from now.' }] },
			{ id: 'appease', text: 'Keep the ordeal and appease the gods with a whole offering', then: [{ prosperity: -0.5 }, { set: { custom: 'sacrifice', part: 'share', value: 'whole' } }, { log: 'A whole offering goes to the gods, and the ordeal stands.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The drowned man\'s kin do not forget, and the band is a little less whole.' }]
	},
	{
		id: 'feud-bleeds-the-band',
		text: 'A feud between two families has cost three lives this year.',
		when: [{ custom: 'justice', part: 'remedy', about: 'violence' }],
		once: true,
		chance: 0.35,
		answers: [
			{ id: 'price', text: 'Impose a blood-price', then: [{ set: { custom: 'justice', part: 'remedy', value: 'price' } }, { log: 'A price is set on each death, and the feud becomes a debt.' }] },
			{ id: 'exile', text: 'Exile the killers', then: [{ set: { custom: 'justice', part: 'remedy', value: 'exile' } }, { log: 'The killers go out, and exile is the remedy from now.' }] },
			{ id: 'council', text: 'Seat both families in council', then: [{ set: { custom: 'rule', part: 'seat', value: 'council' } }, { log: 'Both families sit in council, and have to look at each other.' }] },
			{ id: 'assembly', text: 'Make the assembly find guilt', then: [{ set: { custom: 'justice', part: 'finding', value: 'assembly' } }, { log: 'The assembly finds guilt from now, so that a killing is judged before it is answered.' }] }
		],
		lie: [{ prosperity: -1 }, { log: 'The feud runs on, and the band buries more of its own.' }]
	},
	{
		id: 'oath-breaker',
		text: 'A man who swore before the gods has broken his word, and the band looks to see what follows.',
		when: [{ custom: 'oath', present: true }],
		once: true,
		chance: 0.35,
		answers: [
			{ id: 'outlawry', text: 'Outlawry', then: [{ set: { custom: 'oath', part: 'penalty', value: 'outlawry' } }, { log: 'The breaker is put outside the law, and that is the penalty from now.' }] },
			{ id: 'fine', text: 'A fine', then: [{ set: { custom: 'oath', part: 'penalty', value: 'fine' } }, { log: 'The breaker pays, and a broken oath has a price from now.' }] },
			{ id: 'curse', text: 'The poets curse him', then: [{ set: { custom: 'oath', part: 'penalty', value: 'curse' } }, { log: 'The poets make a song of him, and nobody will forget it.' }] },
			{ id: 'death', text: 'Death', then: [{ set: { custom: 'oath', part: 'penalty', value: 'death' } }, { log: 'The breaker dies for it, and the oath is heavier from now.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'Nothing follows, and every oath weighs a little less.' }]
	},
	// Round 3: contact, arrivals and a chain.
	{
		id: 'kin-keep-the-old-way',
		text: 'Your kin across the hills still burn their dead, as far as anyone knows; your own people stopped.',
		when: [{ neighbour: { custom: 'funeral', part: 'act', about: 'fire' } }, { not: { custom: 'funeral', part: 'act', about: 'fire' } }],
		cooldown: 5,
		chance: 0.6,
		answers: [
			{ id: 'burn', text: 'Take up burning again', then: [{ set: { custom: 'funeral', part: 's1.act', value: 'burn' } }, { log: 'The pyres are lit again, as the kin still light them.' }] },
			{ id: 'teach', text: 'Send elders to teach them your way', then: [{ prosperity: -0.5 }, { log: 'Elders go across the hills; some come back, and the kin keep their pyres.' }] },
			{ id: 'marry', text: 'Marry among them', then: [{ set: { custom: 'marriage', part: 'band', value: 'kin' } }, { log: 'Marriages are made across the hills, and the two bands are one kin again in the children.' }] },
			{ id: 'apart', text: 'Keep apart', then: [{ set: { custom: 'guest', part: 'stance', value: 'bar' } }, { log: 'The hills stay between you, and the door is barred to all who cross them.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'Nothing is said of it, and the two ways drift further apart.' }]
	},
	{
		id: 'strangers-who-were-kin',
		text: 'A band comes over the ridge whom your elders call kin, but their ways are not what the elders remember.',
		when: [{ stale: 3 }],
		cooldown: 5,
		chance: 0.6,
		answers: [
			{ id: 'kin', text: 'Treat them as kin', then: [{ set: { custom: 'guest', part: 'stance', value: 'welcome' } }, { log: 'They are taken in as kin, whatever their ways have become.' }] },
			{ id: 'strangers', text: 'Treat them as strangers', then: [{ set: { custom: 'guest', part: 'stance', value: 'bar' } }, { raise: 'kin-turned-away' }] },
			{ id: 'tale', text: 'Send for their tale', then: [{ set: { custom: 'memory', part: 'what', value: ['deeds', 'lineages'] } }, { log: 'Their tale is heard and kept beside your own, deeds and lineages both.' }] },
			{ id: 'hostages', text: 'Exchange hostages', then: [{ set: { custom: 'guest', part: 'basis', value: 'hostage' } }, { log: 'Hostages cross both ways, and the ridge is safe to cross after them.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'They camp a season on the ridge and move on, unrecognised.' }]
	},
	{
		id: 'kin-turned-away',
		text: 'The band your elders called kin is turned from the door, and the elders say the ancestors watch.',
		when: [],
		raisedOnly: true,
		once: true,
		answers: [
			{ id: 'gifts', text: 'Make amends with gifts', then: [{ prosperity: -1 }, { log: 'Gifts go over the ridge after them, and the ancestors are quiet.' }] },
			{ id: 'bones', text: "Swear friendship on the ancestors' bones", then: [{ set: { custom: 'oath', part: 'on', value: 'bones' } }, { log: "Friendship is sworn on the ancestors' bones, and oaths are sworn on them from now." }] },
			{ id: 'sing', text: 'Let the poets sing of it', then: [{ set: { custom: 'memory', part: 'what', value: ['deeds'] } }, { log: 'The poets make a song of the turning-away, and the deed is kept.' }] },
			{ id: 'hold', text: 'Hold to it', then: [{ set: { custom: 'guest', part: 'stance', value: 'bar' } }, { log: 'The door stays shut, and the elders say no more.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The elders mutter about the ancestors, and the band half believes them.' }]
	},
	{
		id: 'the-marsh-takes-the-dead',
		text: 'The marsh will not hold a grave; the dead rise with the water.',
		when: [{ seat: ['marsh'] }, { custom: 'funeral', part: 'act', about: 'earth' }],
		cooldown: 6,
		answers: [
			{ id: 'bog', text: 'Give them to the bog', then: [{ set: { custom: 'funeral', part: 's1.place', value: 'water/bog' } }, { log: 'The dead go into the bog, which keeps what it is given.' }] },
			{ id: 'burn', text: 'Burn them', then: [{ set: { custom: 'funeral', part: 's1.act', value: 'burn' } }, { log: 'The dead are burnt on the dry hummocks, and the marsh takes only ash.' }] },
			{ id: 'mound', text: 'Raise a mound', then: [{ set: { custom: 'funeral', part: 's1.place', value: 'mound' } }, { log: 'A mound is raised above the water, and the dead lie dry in it.' }] },
			{ id: 'carry', text: 'Carry them to dry ground', then: [{ prosperity: -0.5 }, { log: 'The dead are carried a day to dry ground, every time.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The dead keep rising, and the living keep seeing them.' }]
	},
	{
		id: 'no-wood-for-the-pyre',
		text: 'There is no wood for the pyre on this land.',
		when: [{ seat: ['steppe', 'desert'] }, { custom: 'funeral', part: 'act', about: 'fire' }],
		cooldown: 6,
		answers: [
			{ id: 'expose', text: 'Expose them to the sky', then: [{ set: { custom: 'funeral', part: 's1.act', value: 'expose' } }, { log: 'The dead are laid out for the sky and the birds.' }] },
			{ id: 'bury', text: 'Bury them', then: [{ set: { custom: 'funeral', part: 's1.act', value: 'inter' } }, { log: 'The dead go into the ground, since the ground is what there is.' }] },
			{ id: 'trade', text: 'Trade for wood', then: [{ prosperity: -1 }, { log: 'Wood is bought dear from far off, and the pyres burn.' }] },
			{ id: 'dung', text: 'Burn dung and bone, and make do', then: [{ prosperity: -0.5 }, { log: 'The pyres burn low on dung and bone, and the dead are burnt badly but burnt.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The dead wait for wood that does not come.' }]
	},
	{
		id: 'the-river-takes-the-fields',
		text: 'The river rises and takes the sown fields.',
		when: [{ seat: ['river'] }, { custom: 'livelihood', part: 'source', about: 'grain' }],
		cooldown: 6,
		answers: [
			{ id: 'herds', text: 'Keep herds instead', then: [{ set: { custom: 'livelihood', part: 's1.source', value: 'herds/large' } }, { log: 'The band turns from the fields to the herds, which can walk away from water.' }] },
			{ id: 'fish', text: 'Fish the flood', then: [{ set: { custom: 'livelihood', part: 's1.source', value: 'catch' } }, { log: 'The flood is fished, and the catch feeds the band.' }] },
			{ id: 'offer', text: 'Offer the first of the harvest to the river', then: [{ prosperity: -0.5 }, { set: { custom: 'sacrifice', part: 'offering', value: 'harvest' } }, { log: 'The first of the harvest goes to the river, and the river is asked to be kind.' }] },
			{ id: 'uphill', text: 'Move the fields uphill', then: [{ prosperity: -1 }, { log: 'New fields are cut above the flood line, at a cost.' }] }
		],
		lie: [{ prosperity: -1 }, { log: 'The fields are lost for the year, and the band goes hungry.' }]
	},
	// Round 4: wide conditions.
	{
		id: 'sea-god-far-from-the-sea',
		text: 'Your people pray to the Sea, and no one living has seen it.',
		when: [{ not: { seat: ['coast'] } }, { custom: 'highGod', part: 'domain', about: 'sea' }],
		once: true,
		answers: [
			{ id: 'river', text: 'Pray to the river instead', then: [{ set: { custom: 'highGod', part: 'domain', value: 'river' } }, { log: 'The River is the greatest power now; it, at least, is here.' }] },
			{ id: 'sky', text: 'Pray to the sky', then: [{ set: { custom: 'highGod', part: 'domain', value: 'sky' } }, { log: 'The Sky is the greatest power now; it is over every land.' }] },
			{ id: 'seek', text: 'Send the young to find the sea', then: [{ prosperity: -1 }, { log: 'Young people go to find the sea; some come back, with a jar of it.' }] },
			{ id: 'tell', text: 'Keep the Sea and tell of it', then: [{ set: { custom: 'memory', part: 'what', value: ['deeds', 'lineages'] } }, { log: 'The Sea is kept in the telling, with the deeds and the lineages.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The prayers go on to a Sea nobody can picture, and mean a little less each year.' }]
	},
	{
		id: 'no-wine-on-this-land',
		text: 'The vines do not grow here, and the sacred wine runs out.',
		when: [{ seat: ['steppe', 'forest', 'marsh'] }, { custom: 'substance', part: 'kind', about: 'vine' }],
		once: true,
		answers: [
			{ id: 'mead', text: 'Mead', then: [{ set: { custom: 'substance', part: 'kind', value: 'drink/mead' } }, { log: 'Mead is the sacred drink from now; the bees do not mind the land.' }] },
			{ id: 'milk', text: "Mare's milk", then: [{ set: { custom: 'substance', part: 'kind', value: 'drink/mare-milk' } }, { log: "Fermented mare's milk is the sacred drink from now." }] },
			{ id: 'trade', text: 'Trade for it dear', then: [{ prosperity: -1 }, { log: 'Wine comes from far off at a price, and the rite keeps its taste.' }] },
			{ id: 'herb', text: 'Herb smoke instead', then: [{ set: { custom: 'substance', part: 'kind', value: 'plant/herb' } }, { set: { custom: 'substance', part: 'manner', value: 'inhaled' } }, { log: 'The rite takes herb smoke instead of wine, and the smoke is sacred from now.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The rite goes on with less wine each year, then with none.' }]
	},
	{
		id: 'herds-sicken-in-the-marsh',
		text: 'The herds sicken on wet ground.',
		when: [{ seat: ['marsh'] }, { custom: 'livelihood', part: 'source', about: 'herds' }],
		cooldown: 6,
		answers: [
			{ id: 'fish', text: 'Fish instead', then: [{ set: { custom: 'livelihood', part: 's1.source', value: 'catch' } }, { log: 'The band turns to the water for its food.' }] },
			{ id: 'hoe', text: 'Hoe crops instead', then: [{ set: { custom: 'livelihood', part: 's1.source', value: 'crop/hoe' } }, { log: 'Gardens are cut on the hummocks, and the band is fed from them.' }] },
			{ id: 'drive', text: 'Drive the herds to drier ground each season', then: [{ prosperity: -1 }, { log: 'The herds are driven out and back each year, and the band with them.' }] },
			{ id: 'drown', text: 'Drown a beast for the marsh', then: [{ prosperity: -0.5 }, { set: { custom: 'sacrifice', part: 'manner', value: 'drowned' } }, { log: 'A beast is given to the marsh, and the marsh is asked to spare the rest.' }] }
		],
		lie: [{ prosperity: -1 }, { log: 'The herds dwindle, and the band with them.' }]
	},
	{
		id: 'the-rite-has-no-priest',
		text: 'The priest who kept the daily rite is dead, and no one was taught it.',
		when: [{ custom: 'cult', part: 'officiant', about: 'priest/self' }],
		cooldown: 6,
		chance: 0.5,
		answers: [
			{ id: 'woman', text: 'The eldest woman keeps it', then: [{ set: { custom: 'cult', part: 'officiant', value: 'elder-woman' } }, { log: 'The eldest woman keeps the daily rite from now.' }] },
			{ id: 'heads', text: 'Each household head keeps it', then: [{ set: { custom: 'cult', part: 'officiant', value: 'household-head' } }, { log: 'Every household head keeps the daily rite at their own hearth.' }] },
			{ id: 'children', text: 'The children keep it', then: [{ set: { custom: 'cult', part: 'officiant', value: 'children' } }, { log: 'The children keep the daily rite, and learn it by keeping it.' }] },
			{ id: 'leader', text: 'The leader takes the rite', then: [{ set: { custom: 'rule', part: 'source', value: 'sacred' } }, { log: '{leader} takes the rite, and rules by it from now.' }] }
		],
		lie: [{ lose: 'cult' }, { log: 'Nobody keeps the daily rite, and after a while nobody remembers there was one.' }]
	},
	{
		id: 'the-young-come-back-changed',
		text: 'The young come back from raiding with herds that are not theirs and ways that are not yours.',
		when: [{ custom: 'youth', part: 'rite', about: 'violence' }],
		cooldown: 5,
		chance: 0.6,
		answers: [
			{ id: 'spear', text: 'Keep the herds and rule by the spear', then: [{ set: { custom: 'rule', part: 'source', value: 'war' } }, { log: 'The herds are kept, and the raiders are the band\'s strength from now.' }] },
			{ id: 'return', text: 'Give the herds back', then: [{ prosperity: -1 }, { log: 'The herds go back over the hills, with apologies.' }] },
			{ id: 'craft', text: 'End the raiding; apprentice them', then: [{ set: { custom: 'youth', part: 's1.rite', value: 'craft' } }, { log: 'The young are bound to a craft from now, and the spears hang up.' }] },
			{ id: 'feast', text: 'Make a feast of the return', then: [{ prosperity: -0.5 }, { set: { custom: 'sacrifice', part: 'manner', value: 'feast' } }, { log: 'The return is feasted, and what is offered is shared from now.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The young keep their new ways, and the old look away.' }]
	},
	{
		id: 'no-one-saw-the-first-homeland',
		text: 'No one leading now ever saw the first homeland.',
		when: [{ leader: { generation: [3, 99] } }],
		once: true,
		answers: [
			{ id: 'names', text: 'Keep the names of the dead', then: [{ set: { custom: 'memory', part: 'what', value: ['dead', 'lineages'] } }, { log: 'The names of the dead are kept with the lineages, back to the scattering.' }] },
			{ id: 'face', text: 'Face the dead towards the first homeland', then: [{ set: { custom: 'funeral', part: 's1.orientation', value: 'homeland/first' } }, { log: 'The dead are laid facing the first homeland, though nobody living could point to it.' }] },
			{ id: 'let-go', text: 'Let the old land go', then: [{ set: { custom: 'funeral', part: 's1.orientation', value: 'homeland/last-seat' } }, { log: 'The dead face the last seat, which the living remember.' }] },
			{ id: 'seek', text: 'Send a party back to find it', then: [{ prosperity: -1 }, { log: 'A party goes back along the old road; what they find is not what the elders said.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The first homeland becomes a word, and then a word that needs explaining.' }]
	},
	{
		id: 'no-one-to-marry-out-to',
		text: 'Your custom takes spouses from another people, and no other people is near.',
		when: [{ custom: 'marriage', part: 'people', about: 'stranger' }, { contact: 'none' }],
		cooldown: 5,
		answers: [
			{ id: 'within', text: 'Marry within the band', then: [{ set: { custom: 'marriage', part: 'people', value: 'own' } }, { log: 'Spouses are taken from among your own people from now.' }] },
			{ id: 'far', text: 'Send the young far to find spouses', then: [{ prosperity: -1 }, { log: 'The young go far for spouses, and not all of them come back.' }] },
			{ id: 'wait', text: 'Wait a generation', then: [{ prosperity: -0.5 }, { log: 'A generation goes unwed, and the band is smaller for it.' }] },
			{ id: 'welcome', text: 'Make kin of the next strangers who come', then: [{ set: { custom: 'guest', part: 'stance', value: 'welcome' } }, { log: 'The door is opened, in the hope that spouses walk through it.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The custom stands and nobody marries, which the custom did not intend.' }]
	},
	// Round 5: more wide conditions.
	{
		id: 'strangers-eat-the-band-out',
		text: 'Strangers come and keep coming, and the stores go with them.',
		when: [{ custom: 'guest', part: 'stance', about: 'sanctuary' }, { contact: 'some' }],
		cooldown: 5,
		chance: 0.4,
		answers: [
			{ id: 'bar', text: 'Bar the door', then: [{ set: { custom: 'guest', part: 'stance', value: 'bar' } }, { log: 'The door is barred, and the strangers go elsewhere.' }] },
			{ id: 'meal', text: 'Shelter for one meal only', then: [{ set: { custom: 'guest', part: 'unit', value: 'meals' } }, { set: { custom: 'guest', part: 'count', value: 'one' } }, { log: 'A stranger gets one meal and the road, from now.' }] },
			{ id: 'gift', text: 'Ask a gift at the door', then: [{ set: { custom: 'guest', part: 'gift/stranger', value: 'wealth/metal' } }, { log: 'A stranger brings a ring to the door, or does not come in.' }] },
			{ id: 'own', text: "Feed them from the leader's own", then: [{ prosperity: -1 }, { log: '{leader} feeds the strangers from their own stores, and goes short.' }] }
		],
		lie: [{ prosperity: -1 }, { log: 'The strangers eat, and the band goes hungry before the spring.' }]
	},
	{
		id: 'a-kind-of-person-without-a-name',
		text: 'Among your people is someone the kinds of people do not name, and the rites do not know what to do with them.',
		when: [{ unrecognised: true }],
		once: true,
		answers: [
			{ id: 'both', text: 'Recognise those who are both', then: [{ set: { custom: 'gender', part: 'kinds', value: ['male', 'female', 'both'] } }, { log: 'Those who are both are named, and the rites make room.' }] },
			{ id: 'neither', text: 'Recognise those who are neither', then: [{ set: { custom: 'gender', part: 'kinds', value: ['male', 'female', 'neither'] } }, { log: 'Those who are neither are named, and the rites make room.' }] },
			{ id: 'priest', text: 'Make them a priest, outside the kinds', then: [{ set: { custom: 'cult', part: 'officiant', value: 'priest' } }, { log: 'They keep the daily rite, outside the kinds and above them.' }] },
			{ id: 'away', text: 'Send them away', then: [{ prosperity: -0.5 }, { log: 'They go, and the band is poorer by one and by more than one.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'Nobody says what they are, and the rites go on around them.' }]
	},
	{
		id: 'brothers-share-a-wife',
		text: 'The brothers who share one wife quarrel over whose son is whose.',
		when: [{ custom: 'marriage', part: 'plural', about: 'male' }],
		cooldown: 6,
		chance: 0.5,
		answers: [
			{ id: 'all', text: "All sons are all brothers'", then: [{ set: { custom: 'descent', part: 'share', value: 'equal' } }, { log: 'Every son is every brother\'s, and the estate is divided among them all.' }] },
			{ id: 'eldest', text: "The eldest brother's", then: [{ set: { custom: 'descent', part: 'share', value: 'eldest' } }, { log: 'The sons are the eldest brother\'s, and the eldest inherits.' }] },
			{ id: 'one', text: 'One husband from now', then: [{ set: { custom: 'marriage', part: 'count', value: 'one' } }, { log: 'One husband to a wife from now, and no quarrel over sons.' }] },
			{ id: 'mother', text: "Let the mothers' line decide", then: [{ set: { custom: 'descent', part: 'line', value: 'mother' } }, { log: 'A child belongs to the mother\'s line, and the brothers need not ask.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The brothers quarrel on, and the sons grow up listening.' }]
	},
	{
		id: 'a-poet-dies-half-taught',
		text: 'A poet dies with a lineage half-taught.',
		when: [{ custom: 'memory', part: 'medium', about: 'voice' }],
		cooldown: 6,
		chance: 0.5,
		answers: [
			{ id: 'stone', text: 'Carve the names in stone', then: [{ set: { custom: 'memory', part: 'medium', value: 'stone' } }, { log: 'The names go into stone, which does not die half-taught.' }] },
			{ id: 'dance', text: 'Dance them', then: [{ set: { custom: 'memory', part: 'medium', value: 'dance' } }, { log: 'The lineages are danced, and the dancers teach the dance.' }] },
			{ id: 'two', text: 'Train two poets for every one', then: [{ prosperity: -0.5 }, { log: 'Two are trained for every poet, and the band feeds them.' }] },
			{ id: 'let-go', text: 'Let the lineages go', then: [{ set: { custom: 'memory', part: 'what', value: ['deeds'] } }, { log: 'The lineages are let go; the deeds are kept.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The half-taught lineage is sung wrong from now, and nobody knows it.' }]
	},
	{
		id: 'two-powers-one-hearth',
		text: 'The daily rite is for the hearth-fire, but the greatest power is another, and the priest asks which the band truly serves.',
		when: [{ custom: 'cult', part: 'figure', about: 'hearth' }, { not: { custom: 'highGod', part: 'domain', about: 'fire' } }],
		cooldown: 6,
		chance: 0.4,
		answers: [
			{ id: 'fire', text: 'Make Fire the greatest power', then: [{ set: { custom: 'highGod', part: 'domain', value: 'fire' } }, { log: 'Fire is the greatest power from now, and the hearth is its seat.' }] },
			{ id: 'dawn', text: 'Honour the Dawn daily instead', then: [{ set: { custom: 'cult', part: 'figure', value: 'dawn' } }, { log: 'The daily rite turns to the Dawn.' }] },
			{ id: 'both', text: 'Keep both and feed both', then: [{ prosperity: -0.5 }, { log: 'Both powers are fed, and the band feeds them.' }] },
			{ id: 'priest', text: 'Let the priest decide', then: [{ set: { custom: 'cult', part: 'officiant', value: 'priest' } }, { log: 'The priest keeps the rite, and decides whom it is for.' }] }
		],
		lie: [{ prosperity: -0.5 }, { log: 'The question goes unanswered, and the priest asks it again at every meal.' }]
	}
];
