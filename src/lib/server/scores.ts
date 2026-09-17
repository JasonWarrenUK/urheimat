import type { ScoreDoc } from './db';
import { scores as scoresCollection } from './db';

export async function recordScore(score: Omit<ScoreDoc, '_id' | 'createdAt'>): Promise<void> {
	const collection = await scoresCollection();
	await collection.insertOne({
		...score,
		_id: crypto.randomUUID(),
		createdAt: new Date()
	});
}
