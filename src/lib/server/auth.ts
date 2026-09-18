import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/sveltekit/providers/github';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { env } from '$env/dynamic/private';
import { getClient } from './db';

/**
 * Auth.js is optional in local development: without credentials the game still
 * runs anonymously, so the handle must not throw at module-evaluation time.
 */
export function authIsConfigured(): boolean {
	return Boolean(env.AUTH_SECRET && env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET && env.MONGODB_URI);
}

export const { handle, signIn, signOut } = SvelteKitAuth(() =>
	Promise.resolve({
		// The client is created lazily inside getClient, so an unset MONGODB_URI
		// only fails on a request that actually touches auth.
		adapter: MongoDBAdapter(() => Promise.resolve(getClient()), {
			databaseName: env.MONGODB_DB || 'urheimat'
		}),
		providers: [GitHub],
		trustHost: true,
		callbacks: {
			/**
			 * The default session callback returns only name, email and image, and
			 * every ownership check keys off the user id, so the id has to be put
			 * back. Build the payload explicitly rather than spreading what the
			 * adapter hands over: that object is the raw session row, and returning
			 * it would publish `sessionToken` (a bearer credential) to the browser.
			 */
			session({ session, user }) {
				return {
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						image: user.image
					},
					expires: session.expires
				};
			}
		}
	})
);
