import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/engine';
import type { GameState, Storylet } from '$lib/types';
import { begin, defaultStep, endEra, newGame, startTiles } from './engine';
import { SLOTS } from './slots';
import { answer, apply, fire, holds, unrecognisedKinds } from './storylets';

function fresh(seed = fixtures.seed): GameState {
	const st = newGame(seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	return st;
}
const player = (st: GameState) => st.cultures[st.playerId as number];
const custom = (id: string) => SLOTS.findIndex((s) => s.id === id);
const part = (si: number, id: string) => SLOTS[si].features.findIndex((f) => f.id === id);
const valueId = (si: number, fi: number, vi: number) => SLOTS[si].features[fi].values[vi].id;

describe('conditions', () => {
	it('reads tags and readings of held values, scoped to a custom or a part', () => {
		const st = fresh(),
			c = player(st);
		const si = custom('guest'),
			fi = part(si, 'stance');
		const about = SLOTS[si].features[fi].values[c.traits[si][fi][0]].about![0];
		expect(holds(st, c, { custom: 'guest', part: 'stance', about })).toBe(true);
		expect(holds(st, c, { custom: 'guest', about: 'fungus' })).toBe(false);
		expect(holds(st, c, { custom: 'rule', has: { verb: 'rule', object: 'living' } })).toBe(true);
		expect(holds(st, c, { not: { custom: 'rule', has: { verb: 'rule', object: 'living' } } })).toBe(false);
	});
	it('treats an absent custom as holding nothing, and present as the flag', () => {
		const st = fresh(),
			c = player(st);
		expect(holds(st, c, { custom: 'oath', present: true })).toBe(true);
		c.absent.push('oath');
		expect(holds(st, c, { custom: 'oath', present: true })).toBe(false);
		expect(holds(st, c, { custom: 'oath', has: { verb: 'bind' } })).toBe(false);
		expect(holds(st, c, { custom: 'nowhere', present: true })).toBe(false);
	});
	it('reads world and band state', () => {
		const st = fresh(),
			c = player(st);
		expect(holds(st, c, { year: [0, 0] })).toBe(true);
		expect(holds(st, c, { year: [25, 50] })).toBe(false);
		expect(holds(st, c, { seat: [st.map.tiles[c.y][c.x] as never] })).toBe(true);
		expect(holds(st, c, { prosperity: { above: 5, below: 7 } })).toBe(true);
		expect(holds(st, c, { leader: { generation: [1, 1], age: [18, 45] } })).toBe(true);
		expect(holds(st, c, { contact: 'some' }) || holds(st, c, { contact: 'none' })).toBe(true);
	});
	it('reads this step\'s events and the engine\'s own history', () => {
		const st = fresh(),
			c = player(st);
		expect(holds(st, c, { event: 'move' })).toBe(false);
		st.events.push('move');
		expect(holds(st, c, { event: 'move' })).toBe(true);
		st.story.push({ storylet: 'x', step: 1, answer: 'a' });
		st.era = 4;
		expect(holds(st, c, { fired: 'x' })).toBe(true);
		expect(holds(st, c, { fired: 'x', within: 2 })).toBe(false);
		expect(holds(st, c, { answered: { storylet: 'x', answer: 'a' } })).toBe(true);
		expect(holds(st, c, { answered: { storylet: 'x', answer: 'b' } })).toBe(false);
	});
	it('spots a kind of person the gender custom does not recognise', () => {
		const st = fresh(),
			c = player(st);
		const gi = custom('gender');
		c.traits[gi][0] = [SLOTS[gi].features[0].values.findIndex((v) => v.id === 'male')];
		const li = custom('livelihood'),
			fi = part(li, 's1.labour');
		c.traits[li][fi] = [SLOTS[li].features[fi].values.findIndex((v) => v.id === 'female')];
		expect(unrecognisedKinds(c)).toContain('female');
		expect(holds(st, c, { unrecognised: true })).toBe(true);
	});
});

const always: Storylet = { id: 'always', text: 'Hello {leader}', when: [], answers: [{ id: 'a', text: 'A', then: [{ prosperity: 1 }] }], lie: [{ log: 'lay' }] };
const spent: Storylet = { ...always, id: 'spent', once: true };
const cooling: Storylet = { ...always, id: 'cooling', cooldown: 3 };
const never: Storylet = { ...always, id: 'never', when: [{ year: [-2, -1] }] };

describe('firing', () => {
	it('raises every storylet whose conditions hold, names the leader, and honours once and cooldown', () => {
		const st = fresh(),
			c = player(st);
		const corpus = [always, spent, cooling, never];
		const first = fire(st, c, corpus);
		expect(first.map((s) => s.storylet)).toEqual(['always', 'spent', 'cooling']);
		expect(first[0].text).not.toContain('{leader}');
		first.forEach((s) => st.story.push({ storylet: s.storylet, step: st.era, answer: null }));
		st.era += 1;
		expect(fire(st, c, corpus).map((s) => s.storylet)).toEqual(['always']);
		st.era += 3;
		expect(fire(st, c, corpus).map((s) => s.storylet)).toEqual(['always', 'cooling']);
	});
	it('fires a raised storylet once regardless of its conditions', () => {
		const st = fresh(),
			c = player(st);
		apply(st, c, [{ raise: 'never' }]);
		expect(fire(st, c, [never]).map((s) => s.storylet)).toEqual(['never']);
		expect(fire(st, c, [never])).toEqual([]);
	});
});

describe('answers and consequences', () => {
	it('applies the chosen answer, or the lie consequences, and remembers both', () => {
		const st = fresh(),
			c = player(st);
		st.situations = fire(st, c, [always, cooling]);
		const before = c.prosperity;
		answer(st, c, { move: null, answers: { [st.situations[0].id]: 'a' } }, [always, cooling]);
		expect(c.prosperity).toBe(before + 1);
		expect(st.log.at(-1)?.text).toBe('lay');
		expect(st.story.map((r) => [r.storylet, r.answer])).toEqual([
			['always', 'a'],
			['cooling', null]
		]);
	});
	it('sets a part by value id, loses and regains a custom', () => {
		const st = fresh(),
			c = player(st);
		const si = custom('guest'),
			fi = part(si, 'stance');
		apply(st, c, [{ set: { custom: 'guest', part: 'stance', value: 'welcome' } }]);
		expect(valueId(si, fi, c.traits[si][fi][0])).toBe('welcome');
		apply(st, c, [{ lose: 'oath' }, { lose: 'oath' }]);
		expect(c.absent).toEqual(['oath']);
		apply(st, c, [{ gain: 'oath' }]);
		expect(c.absent).toEqual([]);
	});
	it('runs answers before the world moves and raises the next step\'s situations after it', () => {
		const st = fresh();
		for (let i = 0; i < 15 && !st.over; i++) endEra(st, defaultStep());
		// Every situation ever raised was recorded as let lie, and the shapes stay well-formed.
		expect(st.story.every((r) => r.answer === null)).toBe(true);
		st.situations.forEach((s) => {
			expect(s.answers.length).toBeGreaterThan(0);
			expect(s.text).not.toContain('{leader}');
		});
	});
});
