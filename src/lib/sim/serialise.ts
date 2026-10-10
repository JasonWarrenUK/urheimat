import type { Culture, GameState, SerializedCulture, SerializedGameState } from '$lib/types';
import { rngFrom } from './engine';

// 2: Treatment of the dead rebuilt as three stages of six parts (was three parts).
// 3: Every part holds a set of value indices (was one index), so a saved run's traits gain a level;
//    where the dead go is no longer a custom (it lives on the funeral acts as readings).
// 4: Every band has a leading family and a leader; a run is 15 steps of 25 years.
export const SCHEMA_VERSION = 4;

export function serialiseState(st: GameState): SerializedGameState {
	const { rng, cultures, ...rest } = st;
	return {
		...rest,
		rngState: rng.state,
		cultures: cultures.map(serialiseCulture)
	};
}

export function deserialiseState(
	s: SerializedGameState,
	schemaVersion: number
): GameState | null {
	if (schemaVersion !== SCHEMA_VERSION) return null;
	const { rngState, cultures, ...rest } = s;
	return {
		...rest,
		rng: rngFrom(s.seed, rngState),
		cultures: cultures.map(deserialiseCulture)
	};
}

function serialiseCulture(c: Culture): SerializedCulture {
	const { held, ...rest } = c;
	return { ...rest, held: [...held] };
}

function deserialiseCulture(c: SerializedCulture): Culture {
	const { held, ...rest } = c;
	return { ...rest, held: new Set(held) };
}
