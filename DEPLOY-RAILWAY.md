# Deploy to Railway

## 1. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USER/bibus-stock-control.git
git push -u origin master
```

## 2. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select repository **`bibus-stock-control`** (search the full name — `bibus` alone may not match)
3. Railway builds via **`Dockerfile`** (`railway.toml` → `builder = DOCKERFILE`)

### Repository not listed on Railway?

1. Open [GitHub → Settings → Applications → Railway](https://github.com/settings/installations) (install [Railway GitHub App](https://github.com/apps/railway-app) if missing).
2. Click **Configure** on Railway → **Repository access**:
   - **All repositories**, or
   - **Only select repositories** → add **`bibus-stock-control`**
3. Back in Railway: **New Project** → refresh the repo list (or log out/in with the same GitHub account `alex39730365`).
4. Still missing? Use **Empty Project** → service **Settings** → **Connect Repo** → pick `alex39730365/bibus-stock-control`.

Repo URL: https://github.com/alex39730365/bibus-stock-control

## 3. Environment variables

In Railway → your service → **Variables**, add:

| Variable | Example | Required |
|----------|---------|----------|
| `ADMIN_USERNAME` | `admin` | Yes |
| `ADMIN_PASSWORD` | strong password | Yes |
| `ADMIN_SECRET` | long random string (32+ chars) | Yes |
| `NODE_ENV` | `production` | Yes |
| `PORT` | `3000` | **Yes** — must match Networking target port |
| `HOSTNAME` | `0.0.0.0` | Recommended on Railway |
| `DATA_PATH` | `/data` | Yes (with volume) |

## 4. Persistent volume (important)

Without a volume, stock data resets on redeploy.

1. Railway → service → **Volumes** → **Add Volume**
2. Mount path: `/data`
3. Set variable: `DATA_PATH` = `/data`
4. Redeploy

On first start, bundled `data/inventory.json` is copied into the volume if empty.

## 5. Public URL

Railway → **Settings** → **Networking** → **Generate Domain**

### Port (fixes “Application failed to respond”)

Railway sets a **`PORT`** variable (often **not** 3000). The app must use the **same** port:

1. **Variables** → note **`PORT`** (e.g. `8080`), **or** add `PORT` = `3000` and redeploy.
2. **Generate Domain** → enter that **exact** number (not a guess).
3. After this repo update, `npm start` binds to `$PORT` automatically.

Quick test URL: `https://your-app.up.railway.app/api/health` → should return `{"ok":true}`.

Open `https://your-app.up.railway.app/login` → sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

**`DATA_PATH=/data` without a Volume:** remove `DATA_PATH` until the volume exists, or add a Volume at `/data`.

## 6. Updates

Push to GitHub → Railway redeploys automatically.

## Troubleshooting

- **Build fails:** check **Deployments** logs
- **Empty inventory:** confirm volume mounted at `/data` and `DATA_PATH=/data`, or use **Data Import** in the app
- **502 on start:** wait for healthcheck; ensure `ADMIN_SECRET` is set
