# Deploy to Vercel

## 1. Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import GitHub repo **`alex39730365/bibus-stock-control`**
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (first deploy may fail until KV is added — step 2)

## 2. Upstash Redis (required for stock data)

Serverless cannot persist JSON files on disk. Use **Upstash Redis**:

1. Vercel project → **Storage** → **Create Database** → **Upstash Redis**  
   (or [Marketplace → Redis](https://vercel.com/marketplace?category=storage&search=redis))
2. **Connect to Project**
3. This adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (legacy `KV_*` names also work)
4. **Redeploy**

On first API call, bundled `data/inventory.json` is copied into Redis.

## 3. Environment variables

**Settings** → **Environment Variables**:

| Variable | Example | Required |
|----------|---------|----------|
| `ADMIN_USERNAME` | `admin` | Yes |
| `ADMIN_PASSWORD` | strong password | Yes |
| `ADMIN_SECRET` | 32+ char random string | Yes |
| `UPSTASH_REDIS_REST_URL` | (from Redis store) | Yes on Vercel |
| `UPSTASH_REDIS_REST_TOKEN` | (from Redis store) | Yes on Vercel |

Set automatically when you connect Upstash Redis.

## 4. Open the app

`https://your-project.vercel.app/login` — sign in with your admin credentials.

## 5. Updates

Push to GitHub `main` → Vercel redeploys automatically.

## Local development

- **Without Redis:** uses `data/*.json` on disk (default).
- **With Redis:** copy `UPSTASH_REDIS_REST_*` from Vercel into `.env.local` to match production.

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Custom domain (optional)

Vercel → **Settings** → **Domains** → add your domain.
