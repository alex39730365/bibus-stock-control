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
3. **Build settings:**
   - Framework preset: **Next.js** (or Workers)
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`  
     (or use automatic Workers Builds if offered)
4. **Environment variables** (Production):

| Variable | Value |
|----------|--------|
| `ADMIN_USERNAME` | your admin ID |
| `ADMIN_PASSWORD` | strong password |
| `ADMIN_SECRET` | 32+ char random |
| `UPSTASH_REDIS_REST_URL` | from Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | from Upstash |
| `NODE_VERSION` | `20` |

5. Deploy → open the `*.workers.dev` URL → `/login`

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
