import type { Culture, GameState, LadderMove, LadderRoute, LadderState } from '$lib/types';
import { FAMINE } from './figures';
import { emit } from './history';
import { holds } from './storylets';

// The generic ladder engine (6SL.6). A route is data (types.ts LadderRoute): conditions feed a pull,
// the pull surfaces as a situation, each refusal sends it back weakened and raises the tier of the
// next, and refusing the last tier forces an outcome. Death (6SL.19) and split (6SL.10) add routes and
// storylets and touch none of this. The situation at each tier is a storylet that holds a
// `{ ladder: { route, tier } }` condition, so the 6SL.5 engine raises it; a combination of routes is a
// storylet that holds several, and the most specific wins (storylets.ts).
//
// Two variables per route. Strength gates surfacing, on 6SL.3's pattern (pressures.ts: a pull builds
// while its source holds, halves when it does not, surfaces at a hold). Refusals set the tier.

// A pull below this is nothing.
const GONE = 0.1;
// What a refusal leaves of the pull, as 6SL.3's refused pulls go back at half strength.
const REFUSED = 0.5;

// STUD: one example route, famine, replaced by 6SL.19's routes. Strengths are TUNING figures
// (figures.ts).
export const famine: LadderRoute = {
	id: 'famine',
	kind: 'death',
	// Hungry with the reserve spent.
	feeds: [{ when: [{ strand: { id: 'food', below: 1 } }, { strand: { id: 'buffer', below: 0.01 } }], by: FAMINE.feed }],
	hold: FAMINE.hold,
	tiers: FAMINE.tiers,
	fade: FAMINE.fade,
	forced: { death: true }
};

export const ROUTES: readonly LadderRoute[] = [famine];

export const newState = (): LadderState => ({ strength: 0, refusals: 0, surfaced: false, resolved: false });
const stateOf = (c: Culture, route: string): LadderState => (c.condition.ladders[route] ??= newState());

// What an answer does to a route in play. `by` is how much strength an easing takes off.
export function moveRoute(c: Culture, route: string, move: LadderMove, by = 1): void {
	const state = stateOf(c, route);
	if (move === 'refuse') {
		state.refusals++;
		state.strength *= REFUSED;
	} else if (move === 'ease') state.strength = Math.max(0, state.strength - by);
	else state.resolved = true;
	state.surfaced = false;
}

// One step of every route on a band, after the player's answers have been applied. Builds or fades the
// pull, steps a faded route's tier down, surfaces a route whose pull has reached its hold and returns
// the routes whose outcome is forced this step: a resolved route, or one whose last tier was refused.
// An AI band's surfaced route is let lie at once (4k, 4m), which is a refusal.
export function ladderStep(st: GameState, c: Culture, routes: readonly LadderRoute[] = ROUTES): LadderRoute[] {
	const forced: LadderRoute[] = [];
	routes.forEach((route) => {
		const state = stateOf(c, route.id);
		if (state.resolved) {
			forced.push(route);
			c.condition.ladders[route.id] = newState();
			return;
		}
		const fed = route.feeds.filter((f) => f.when.every((w) => holds(st, c, w))).reduce((n, f) => n + f.by, 0);
		state.strength = fed > 0 ? state.strength + fed : state.strength * route.fade;
		if (state.strength < GONE) {
			state.strength = 0;
			if (state.refusals > 0) state.refusals--;
		}
		state.surfaced = state.strength >= route.hold;
		if (!state.surfaced) return;
		const tier = state.refusals + 1;
		if (tier > route.tiers) {
			forced.push(route);
			c.condition.ladders[route.id] = newState();
			return;
		}
		emit(st, 'ladder', c.id, `${route.id}:${tier}`);
		if (!c.isPlayer) moveRoute(c, route.id, 'refuse');
	});
	return forced;
}
