import { describe, expect, it } from 'vitest';
import * as fixtures from '../../../tests/fixtures/ladder';
import type { GameState, Storylet } from '$lib/types';
import { liveTier } from './condition';
import { begin, newGame, startTiles } from './engine';
import { ROUTES, ladderStep, moveRoute, newState } from './ladder';
import { STORYLETS, answer, fire, namedRoutes } from './storylets';

function fresh() {
	const st = newGame(fixtures.seed);
	const t = startTiles(st);
	begin(st, t[0].x, t[0].y);
	return { st, c: st.cultures[st.playerId as number] };
}

describe('building and surfacing', () => {
	it('surfaces a fed route at tier one, and reads that tier as a condition', () => {
		const { st, c } = fresh();
		expect(liveTier(c, 'always')).toBe(0);
		ladderStep(st, c, [fixtures.always]);
		expect(liveTier(c, 'always')).toBe(1);
		expect(st.bandEvents.filter((e) => e.kind === 'ladder').map((e) => e.reason)).toEqual(['always:1']);
	});
	it('fades a pull nothing feeds and steps the tier down once it has faded', () => {
		const { st, c } = fresh();
		c.condition.ladders.never = { strength: 0.15, refusals: 2, surfaced: false, resolved: false };
		ladderStep(st, c, [fixtures.never]);
		expect(c.condition.ladders.never.strength).toBe(0);
		expect(c.condition.ladders.never.refusals).toBe(1);
		ladderStep(st, c, [fixtures.never]);
		expect(c.condition.ladders.never.refusals).toBe(0);
	});
});

describe('what an answer does to a route', () => {
	it('refuses: the route goes back at half strength and the next surfacing is the next tier', () => {
		const { st, c } = fresh();
		ladderStep(st, c, [fixtures.always]);
		moveRoute(c, 'always', 'refuse');
		const after = c.condition.ladders.always;
		expect(after.strength).toBe(0.5);
		expect(after.refusals).toBe(1);
		ladderStep(st, c, [fixtures.always]);
		expect(liveTier(c, 'always')).toBe(2);
	});
	it('forces the outcome when the last tier is refused', () => {
		const { st, c } = fresh();
		ladderStep(st, c, [fixtures.always]);
		moveRoute(c, 'always', 'refuse');
		ladderStep(st, c, [fixtures.always]);
		moveRoute(c, 'always', 'refuse');
		const forced = ladderStep(st, c, [fixtures.always]);
		expect(forced.map((r) => r.id)).toEqual(['always']);
		expect(c.condition.ladders.always).toEqual(newState());
	});
	it('eases: strength falls by the amount given and the route no longer surfaces on that step', () => {
		const { st, c } = fresh();
		ladderStep(st, c, [fixtures.always]);
		moveRoute(c, 'always', 'ease', 5);
		expect(c.condition.ladders.always.strength).toBe(0);
		expect(liveTier(c, 'always')).toBe(0);
		expect(st.bandEvents.length).toBe(1);
	});
	it('resolves: the outcome happens at the next step', () => {
		const { st, c } = fresh();
		ladderStep(st, c, [fixtures.always]);
		moveRoute(c, 'always', 'resolve');
		expect(ladderStep(st, c, [fixtures.always]).map((r) => r.id)).toEqual(['always']);
	});
	it('lets an AI band let a surfaced route lie at once', () => {
		const { st } = fresh();
		const ai = st.cultures.find((k) => !k.isPlayer)!;
		ladderStep(st, ai, [fixtures.always]);
		expect(ai.condition.ladders.always.refusals).toBe(1);
		expect(liveTier(ai, 'always')).toBe(0);
	});
});

describe('through the storylet engine', () => {
	const at = (id: string, tier: number, then: Storylet['answers'][number]['then']): Storylet => ({ id, text: id, when: [{ ladder: { route: 'always', tier } }], answers: [{ id: 'a', text: 'A', then }] });
	it('refuses every route a situation names when it is let lie', () => {
		const { st, c } = fresh();
		const corpus = [at('s1', 1, [])];
		ladderStep(st, c, [fixtures.always]);
		st.situations = fire(st, c, corpus);
		answer(st, c, { move: null, answers: {} }, corpus);
		expect(c.condition.ladders.always.refusals).toBe(1);
	});
	it('applies the answer the player chose and leaves a route alone it does not name', () => {
		const { st, c } = fresh();
		const corpus = [at('s1', 1, [{ ladder: { route: 'always', do: 'ease', by: 5 } }])];
		ladderStep(st, c, [fixtures.always]);
		st.situations = fire(st, c, corpus);
		answer(st, c, { move: null, answers: { [st.situations[0].id]: 'a' } }, corpus);
		expect(c.condition.ladders.always.refusals).toBe(0);
		expect(c.condition.ladders.always.strength).toBe(0);
	});
	it('puts ladder situations outside the cap, and the most specific storylet replaces the singles it names', () => {
		const { st, c } = fresh();
		c.condition.ladders.famine = { strength: 1, refusals: 0, surfaced: true, resolved: false };
		c.condition.ladders.shunned = { strength: 1, refusals: 0, surfaced: true, resolved: false };
		const single = (route: string): Storylet => ({ id: route, text: route, when: [{ ladder: { route, tier: 1 } }], answers: [{ id: 'a', text: 'A', then: [] }] });
		const pair: Storylet = { id: 'pair', text: 'both', when: [{ ladder: { route: 'famine', tier: 1 } }, { ladder: { route: 'shunned', tier: 1 } }], answers: [{ id: 'a', text: 'A', then: [] }] };
		expect(fire(st, c, [single('famine'), single('shunned'), pair]).map((s) => s.storylet)).toEqual(['pair']);
		expect(fire(st, c, [single('famine'), single('shunned')]).map((s) => s.storylet)).toEqual(['famine', 'shunned']);
	});
});

describe('the corpus', () => {
	it('states what every answer to a ladder situation does to every route it names', () => {
		STORYLETS.filter((s) => namedRoutes(s).length).forEach((s) => {
			s.answers.forEach((a) => {
				namedRoutes(s).forEach((route) => {
					const stated = a.then.some((k) => 'ladder' in k && k.ladder.route === route);
					expect(stated, `${s.id} / ${a.id} says nothing about ${route}`).toBe(true);
				});
			});
		});
	});
	it('has a storylet for every tier of every route', () => {
		ROUTES.forEach((route) => {
			for (let tier = 1; tier <= route.tiers; tier++) {
				const has = STORYLETS.some((s) => s.when.some((w) => 'ladder' in w && w.ladder.route === route.id && w.ladder.tier === tier));
				expect(has, `${route.id} has no storylet for tier ${tier}`).toBe(true);
			}
		});
	});
});
