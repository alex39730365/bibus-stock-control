# Deploy to Railway

## 1. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USER/bibus-stock-control.git
git push -u origin master
```

## 2. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select this repository
3. Railway detects Next.js via `railway.toml` / Nixpacks

## 3. Environment variables

In Railway → your service → **Variables**, add:

| Variable | Example | Required |
|----------|---------|----------|
| `ADMIN_USERNAME` | `admin` | Yes |
| `ADMIN_PASSWORD` | strong password | Yes |
| `ADMIN_SECRET` | long random string (32+ chars) | Yes |
| `NODE_ENV` | `production` | Yes |
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

Open `https://your-app.up.railway.app` → sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## 6. Updates

Push to GitHub → Railway redeploys automatically.

## Troubleshooting

- **Build fails:** check **Deployments** logs
- **Empty inventory:** confirm volume mounted at `/data` and `DATA_PATH=/data`, or use **Data Import** in the app
- **502 on start:** wait for healthcheck; ensure `ADMIN_SECRET` is set
