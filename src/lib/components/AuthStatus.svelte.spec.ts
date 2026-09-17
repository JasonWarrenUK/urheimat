import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AuthStatus from './AuthStatus.svelte';

describe('AuthStatus', () => {
	it('renders nothing when auth is not configured', async () => {
		render(AuthStatus, { session: null, authEnabled: false });

		await expect.element(page.getByRole('button')).not.toBeInTheDocument();
	});

	it('offers sign-in when nobody is signed in', async () => {
		render(AuthStatus, { session: null, authEnabled: true });

		await expect.element(page.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
	});

	it('shows the signed-in name and a sign-out control', async () => {
		render(AuthStatus, {
			session: { user: { id: 'abc', name: 'Ada' }, expires: '' },
			authEnabled: true
		});

		await expect.element(page.getByText('Ada')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
	});
});
