import type { Culture, GameState, SerializedCulture, SerializedGameState } from '$lib/types';
import { rngFrom } from './engine';

export const SCHEMA_VERSION = 1;

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
