# GitHub OAuth and Atlas setup

The auth code is wired and tested, but three steps need credentials that only
you can create. Until they are done the game runs anonymously: the sign-in
control stays hidden and `/api/runs` answers 401.

## 1. GitHub OAuth app (local)

1. Go to <https://github.com/settings/developers> → **New OAuth App**.
2. Application name: `Urheimat (local)`.
3. Homepage URL: `http://localhost:5173`.
4. Authorization callback URL: `http://localhost:5173/auth/callback/github`.
5. Register, then **Generate a new client secret**.
6. Copy both values into `.env`:

```bash
AUTH_SECRET=$(openssl rand -hex 32)
AUTH_GITHUB_ID=<client id>
AUTH_GITHUB_SECRET=<client secret>
```

The callback path is `/auth/callback/github`, not `/api/auth/...`; `@auth/sveltekit`
mounts at `/auth` unless `basePath` is overridden.

## 2. GitHub OAuth app (production)

Register a second app rather than adding a second callback to the first, so a
leaked local secret cannot be used against production.

- Homepage URL: `https://urheimat.vercel.app`
- Callback URL: `https://urheimat.vercel.app/auth/callback/github`

## 3. Atlas cluster

The local Docker instance is not reachable from Vercel, so the deploy needs a
hosted database.

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
you add that exact callback URL to an OAuth app. Verifying on production is the
simpler path.

## 5. Verify

Locally, with `bun run db:up` running and `.env` filled in:

```bash
bun run dev
```

1. The sign-in control appears top-right (it is hidden when credentials are unset).
2. Sign in with GitHub; your GitHub name replaces the button.
3. `curl -s http://localhost:5173/api/runs` → 401 (no cookie).
4. The same request in the signed-in browser → `{"runs":[...]}`, containing only
   your own runs.

Then repeat 1 to 3 against the deployed URL.

## What was verified without these credentials

Against the local Docker MongoDB with a seeded user and session:

- Anonymous request to `/api/runs` → 401.
- Signed-in request → only that player's own runs; another player's run and a
  legacy document with no `playerId` were both excluded.
- A bogus session cookie → 401.
- The session payload sent to the browser carries `user.id`, name and email, and
  no `sessionToken`.
- With no auth credentials set at all, the game page still serves 200.

The untested remainder is the GitHub OAuth round trip itself, which is what the
steps above exist to check.
