import type { Culture, GameState, LadderRoute } from '$lib/types';
import { emit } from './history';
import { holds } from './storylets';

// The generic ladder engine (6SL.6). A route is data (types.ts LadderRoute): conditions feed a pull,
// the pull climbs tiers, and the last tier forces an outcome. Death (6SL.19) and split (6SL.10) add
// routes and storylets and touch none of this. The situations at each tier are storylets that hold a
// `{ ladder: { route, tier } }` condition, so the 6SL.5 engine raises them.
//
// The pull follows 6SL.3's pattern (pressures.ts: accumulate, fade, surface), kept separate because
// a pressure's pull is on one part of one custom and a route's is on the band.
//
// STUD: one example route, famine, wired end to end so the skeleton can be walked. It is replaced by
// 6SL.19's routes. Strengths, tiers and fade are TUNING STUBs.

// A pull below this is nothing.
const GONE = 0.1;

export const famine: LadderRoute = {
	id: 'famine',
	kind: 'death',
	// TUNING STUB: hungry with the buffer spent.
	feeds: [{ when: [{ strand: { id: 'food', below: 1 } }, { strand: { id: 'buffer', below: 0.01 } }], by: 1 }],
	tiers: [1, 2, 3],
	fade: 0.5,
	forced: { death: true }
};

export const ROUTES: readonly LadderRoute[] = [famine];

// Builds or fades every route's pull on the band and returns the routes whose last tier was reached
// this step, for the engine to carry out.
export function ladderStep(st: GameState, c: Culture, routes: readonly LadderRoute[] = ROUTES): LadderRoute[] {
	const forced: LadderRoute[] = [];
	routes.forEach((route) => {
		const state = (c.condition.ladders[route.id] ??= { strength: 0, tier: 0, refusals: 0 });
		const fed = route.feeds.filter((f) => f.when.every((w) => holds(st, c, w))).reduce((n, f) => n + f.by, 0);
		state.strength = fed > 0 ? state.strength + fed : state.strength * route.fade;
		if (state.strength < GONE) state.strength = 0;
		const tier = route.tiers.filter((t) => state.strength >= t).length;
		if (tier !== state.tier) emit(st, 'ladder', c.id, `${route.id}:${tier}`);
		state.tier = tier;
		if (tier === route.tiers.length) forced.push(route);
	});
	return forced;
}

// A refused situation: the route keeps its pull and its refusals count. STUD: how a refusal changes
// the pull, and what eases a route, are open (6SL.19 and 6SL.10 decide), so nothing calls this yet.
export function refuseRoute(c: Culture, route: string): void {
	const state = c.condition.ladders[route];
	if (state) state.refusals++;
}
