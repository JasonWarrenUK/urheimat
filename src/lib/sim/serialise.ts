import type { GameState, SerializedGameState } from '$lib/types';
import { rngFrom } from './engine';

// 2: Treatment of the dead rebuilt as three stages of six parts (was three parts).
// 3: Every part holds a set of value indices (was one index), so a saved run's traits gain a level;
//    where the dead go is no longer a custom (it lives on the funeral acts as readings).
// 4: Every band has a leading family and a leader; a run is 15 steps of 25 years; the order menu
//    is gone, so a culture no longer carries a held set and the state carries its situations.
export const SCHEMA_VERSION = 4;

export function serialiseState(st: GameState): SerializedGameState {
	const { rng, ...rest } = st;
	return { ...rest, rngState: rng.state };
}

export function deserialiseState(
	s: SerializedGameState,
	schemaVersion: number
): GameState | null {
	if (schemaVersion !== SCHEMA_VERSION) return null;
	const { rngState, ...rest } = s;
	return { ...rest, rng: rngFrom(s.seed, rngState) };
}
