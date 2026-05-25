# Deploy to Cloudflare (Workers / Pages)

Uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare/get-started).  
Your URL will be something like:

**`https://bibus-stock-control.<your-subdomain>.workers.dev`**

(`vercel.app` will no longer apply.)

## 1. Upstash Redis (same as Vercel)

1. [console.upstash.com](https://console.upstash.com) → your Redis DB  
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

## 2. Deploy from GitHub (recommended)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**  
2. **Connect to Git** → `alex39730365/bibus-stock-control`  
3. **Project type:** choose **Workers** (not “static site” only).  
   This app has API routes + login — `Build output directory: /` will **not** work.

4. **Build settings** (fill exactly):

| Field | Value |
|-------|--------|
| Framework preset | **None** ← do **not** use old “Next.js (Pages)” preset |
| **Build command** | `npm install && npm run build:cf` |
| **Build output directory** | **leave empty** (do **not** use `/`) |
| **Deploy command** (if shown) | `npx opennextjs-cloudflare deploy` |

If there is only one command field, use:

```bash
npm install && npm run build:cf && npx opennextjs-cloudflare deploy
```

`wrangler.jsonc` is already in the repo — Cloudflare will use it.

5. **Environment variables** → **Variables and Secrets** (Production):

| Variable | Value |
|----------|--------|
| `ADMIN_USERNAME` | your admin ID |
| `ADMIN_PASSWORD` | strong password |
| `ADMIN_SECRET` | 32+ char random (run a generator — **not** a PowerShell command string) |
| `UPSTASH_REDIS_REST_URL` | from Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | from Upstash |
| `NODE_VERSION` | `20` |

6. Deploy → open the `*.workers.dev` URL → `/login`

### Build failed with “export const runtime = 'edge'” (⚡️)

That message is from **`@cloudflare/next-on-pages`** (old Pages adapter).  
**Do not add** `export const runtime = 'edge'` to the code.

Fix:

1. Framework preset → **None**
2. Build command → **`npm install && npm run build:cf`**
3. **Never** use `npx @cloudflare/next-on-pages` or only `npm run build` with output directory `/`
4. Use **Workers** (Git), not a static “upload folder `/`” project

## 3. Deploy from your PC (CLI)

```bash
npm install
npx wrangler login
cp .dev.vars.example .dev.vars   # fill in secrets
npm run deploy:cf
```

## 4. After deploy

- Login: `/login`  
- Health: `/api/health`  
- Old Vercel URL: optional redirect in Vercel dashboard (if project still exists)

## 5. Local preview (Cloudflare runtime)

```bash
npm run preview:cf
```

Uses Wrangler locally (closer to production than `npm run dev`).

## Notes

- `npm run dev` still works for daily development (Node.js).
- Stock data lives in **Upstash Redis**, not on Cloudflare disk.
- Vercel `vercel.json` is not used on Cloudflare.
