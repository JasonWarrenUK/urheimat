import { describe, expect, it, vi } from 'vitest';

const toArray = vi.fn();

vi.mock('./db', () => ({
	runs: async () => ({
		find: () => ({ project: () => ({ toArray }) })
	})
}));

import { listRuns } from './runs';

describe('listRuns', () => {
	it('degrades a malformed document instead of throwing', async () => {
		toArray.mockResolvedValueOnce([
			{ seed: 1, era: 2, over: false, updatedAt: new Date('2026-01-01') }
		]);

		const result = await listRuns('player-1');

		expect(result).toEqual([
			{ seed: 1, era: 2, over: false, peopleName: '', updatedAt: new Date('2026-01-01') }
		]);
	});

	it('returns peopleName for a well-formed document', async () => {
		toArray.mockResolvedValueOnce([
			{
				seed: 1,
				era: 2,
				over: false,
				state: { peopleName: 'The Urheim' },
				updatedAt: new Date('2026-01-01')
			}
		]);

		const result = await listRuns('player-1');

		expect(result[0].peopleName).toBe('The Urheim');
	});
});
