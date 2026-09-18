# GitHub OAuth and Atlas setup

The auth code is wired and tested, but three steps need credentials that only
you can create. Until they are done the game runs anonymously: the sign-in
control stays hidden and `/api/runs` answers 401.

## 1. GitHub OAuth app (local)

1. Go to <https://github.com/settings/developers> → **New OAuth App**.
2. Application name: `Urheimat (local)`.
3. Homepage URL: `http://localhost:5173`.
4. Under **Redirect URIs**, put `http://localhost:5173/auth/callback/github` in
   the **Redirect URI** box. Leave **Allow wildcard matching** unticked.
5. Leave **Enable Device Flow** off; it is for input-constrained devices, not
   web apps. Leave **Expire user access tokens** ticked: the adapter stores the
   refresh token, so nothing here needs doing by hand.
6. **Register application**, then **Generate a new client secret**.
7. Copy both values into `.env`:

```bash
AUTH_SECRET=$(openssl rand -hex 32)
AUTH_GITHUB_ID=<client id>
AUTH_GITHUB_SECRET=<client secret>
```

GitHub's newer registration form calls this field **Redirect URI**, under a
**Redirect URIs** heading. Older documentation, this file included until now,
calls it the **Authorization callback URL**. Same field, and it accepts up to
ten entries now rather than one.

The path is `/auth/callback/github`, not `/api/auth/...`; `@auth/sveltekit`
mounts at `/auth` unless `basePath` is overridden.

## 2. GitHub OAuth app (production)

The form now accepts up to ten redirect URIs, so adding the production one to
the local app is possible. Register a second app anyway: one app means one
client secret, and a leaked local secret would then be usable against
production.

- Homepage URL: `https://urheimat.vercel.app`
- Redirect URI: `https://urheimat.vercel.app/auth/callback/github`

## 3. Atlas cluster

The local containerised instance is not reachable from Vercel, so the deploy
needs a hosted database.

1. Create a free M0 cluster at <https://cloud.mongodb.com>.
2. Database Access: add a user with **Read and write to any database**.
3. Network Access: add `0.0.0.0/0` (Vercel's egress IPs are not fixed on the
   free plan).
4. Copy the connection string; it becomes `MONGODB_URI` in Vercel.

## 4. Vercel environment variables

Set these for Production (and Preview, if you want sign-in on preview deploys):

| Variable | Value |
|---|---|
| `MONGODB_URI` | the Atlas connection string |
| `MONGODB_DB` | `urheimat` |
| `AUTH_SECRET` | a fresh `openssl rand -hex 32`, not the local one |
| `AUTH_GITHUB_ID` | the production OAuth app's client id |
| `AUTH_GITHUB_SECRET` | the production OAuth app's client secret |

`AUTH_TRUST_HOST` is not needed on Vercel; the config sets `trustHost` already.

Preview deploys get a different URL each time, so OAuth will fail there unless
you add that exact redirect URI to an OAuth app. Verifying on production is the
simpler path.

## 5. Verify

Locally, with `bun run db:up` running and `.env` filled in:

```bash
bun run dev
```

Check the printed URL is actually `http://localhost:5173`. If port 5173 is
taken, Vite moves to 5174 without complaint, and GitHub then rejects the
sign-in with a redirect URI mismatch. Free the port, or run
`bun run dev --port 5173 --strictPort` so it fails loudly instead.

1. The sign-in control appears top-right (it is hidden when credentials are unset).
2. Sign in with GitHub; your GitHub name replaces the button.
3. `curl -s http://localhost:5173/api/runs` → 401 (no cookie).
4. The same request in the signed-in browser → `{"runs":[...]}`, containing only
   your own runs.

Then repeat 1 to 3 against the deployed URL.

## What was verified without these credentials

Against the local containerised MongoDB with a seeded user and session:

- Anonymous request to `/api/runs` → 401.
- Signed-in request → only that player's own runs; another player's run and a
  legacy document with no `playerId` were both excluded.
- A bogus session cookie → 401.
- The session payload sent to the browser carries `user.id`, name and email, and
  no `sessionToken`.
- With no auth credentials set at all, the game page still serves 200.

The untested remainder is the GitHub OAuth round trip itself, which is what the
steps above exist to check.
