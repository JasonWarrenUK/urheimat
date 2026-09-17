import { beforeEach, describe, expect, it, vi } from 'vitest';

const createIndex = vi.fn();

vi.mock('mongodb', () => ({
	MongoClient: class {
		db() {
			return { collection: () => ({ createIndex }) };
		}
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: { MONGODB_URI: 'mongodb://localhost:27017', MONGODB_DB: 'urheimat-test' }
}));

describe('ensureIndexes memoisation', () => {
	beforeEach(() => {
		vi.resetModules();
		createIndex.mockReset();
		delete (globalThis as { __mongoClient?: unknown }).__mongoClient;
	});

	it('retries after a transient failure instead of caching the rejection', async () => {
		createIndex.mockRejectedValueOnce(new Error('connection refused')).mockResolvedValue(undefined);

		const { runs } = await import('./db');

		await expect(runs()).rejects.toThrow('connection refused');
		expect(createIndex).toHaveBeenCalledTimes(2);

		await expect(runs()).resolves.toBeDefined();
		expect(createIndex).toHaveBeenCalledTimes(4);
	});

	it('only ensures indexes once per process on the happy path', async () => {
		createIndex.mockResolvedValue(undefined);

		const { runs } = await import('./db');

		await runs();
		await runs();
		expect(createIndex).toHaveBeenCalledTimes(2);
	});
});
