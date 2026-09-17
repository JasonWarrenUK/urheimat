import type { GameState } from '$lib/types';
import { deserialiseState, SCHEMA_VERSION, serialiseState } from '$lib/sim/serialise';
import { runs as runsCollection } from './db';

export interface RunSummary {
	seed: number;
	era: number;
	over: boolean;
	peopleName: string;
	updatedAt: Date;
}

export async function saveRun(playerId: string, state: GameState): Promise<void> {
	const collection = await runsCollection();
	const now = new Date();
	await collection.updateOne(
		{ playerId, seed: state.seed },
		{
			$set: {
				state: serialiseState(state),
				schemaVersion: SCHEMA_VERSION,
				era: state.era,
				over: state.over,
				updatedAt: now
			},
			$setOnInsert: {
				_id: crypto.randomUUID(),
				playerId,
				seed: state.seed,
				createdAt: now
			}
		},
		{ upsert: true }
	);
}

export async function loadRun(playerId: string, seed: number): Promise<GameState | null> {
	const collection = await runsCollection();
	const doc = await collection.findOne({ playerId, seed });
	if (!doc) return null;
	return deserialiseState(doc.state, doc.schemaVersion);
}

export async function loadLatestRun(playerId: string): Promise<GameState | null> {
	const collection = await runsCollection();
	const doc = await collection.findOne({ playerId }, { sort: { updatedAt: -1 } });
	if (!doc) return null;
	return deserialiseState(doc.state, doc.schemaVersion);
}

interface RunSummaryDoc {
	seed: number;
	era: number;
	over: boolean;
	state?: { peopleName: string };
	updatedAt: Date;
}

export async function listRuns(playerId: string): Promise<RunSummary[]> {
	const collection = await runsCollection();
	const docs = await collection
		.find({ playerId }, { sort: { updatedAt: -1 } })
		.project<RunSummaryDoc>({ seed: 1, era: 1, over: 1, 'state.peopleName': 1, updatedAt: 1 })
		.toArray();
	return docs.map((d) => ({
		seed: d.seed,
		era: d.era,
		over: d.over,
		peopleName: d.state?.peopleName ?? '',
		updatedAt: d.updatedAt
	}));
}

export async function deleteRun(playerId: string, seed: number): Promise<boolean> {
	const collection = await runsCollection();
	const result = await collection.deleteOne({ playerId, seed });
	return result.deletedCount > 0;
}
