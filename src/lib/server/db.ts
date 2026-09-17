import { MongoClient, type Collection, type Db } from 'mongodb';
import { env } from '$env/dynamic/private';
import type { RunDocument, ScoreDocument } from '$lib/types';

export type RunDoc = Omit<RunDocument, '_id'> & { _id: string };
export type ScoreDoc = Omit<ScoreDocument, '_id'> & { _id: string };

const globalForMongo = globalThis as typeof globalThis & { __mongoClient?: MongoClient };

export function getClient(): MongoClient {
	if (!globalForMongo.__mongoClient) {
		if (!env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
		globalForMongo.__mongoClient = new MongoClient(env.MONGODB_URI);
	}
	return globalForMongo.__mongoClient;
}

export function db(): Db {
	return getClient().db(env.MONGODB_DB || 'urheimat');
}

let indexesEnsured: Promise<void> | undefined;

function ensureIndexes(): Promise<void> {
	if (!indexesEnsured) {
		indexesEnsured = Promise.all([
			db()
				.collection<RunDoc>('runs')
				.createIndex({ playerId: 1, seed: 1 }, { unique: true }),
			db().collection<RunDoc>('runs').createIndex({ playerId: 1, updatedAt: -1 })
		])
			.then(() => undefined)
			.catch((err) => {
				indexesEnsured = undefined;
				throw err;
			});
	}
	return indexesEnsured;
}

export async function runs(): Promise<Collection<RunDoc>> {
	await ensureIndexes();
	return db().collection<RunDoc>('runs');
}

export async function scores(): Promise<Collection<ScoreDoc>> {
	return db().collection<ScoreDoc>('scores');
}
