# BIBUS Stock Control Program (Admin)

Administrator stock control system for BIBUS METALS high-performance materials.

## Features

- **Admin login** — session-protected console
- **Stock Items** — search, filter by region (BMAG / BMCN), pagination
- **Stock Movements** — stock in, stock out, quantity adjust with audit log
- **Data Import** — Excel upload (centralization format)
- **AXAPTA codes** — article codes parsed (BA → bar, etc.)

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: change admin password
npm run dev
```

Open **http://localhost:3000** → sign in:

| Field | Default |
|-------|---------|
| Username | `admin` |
| Password | `admin123` |

## Environment (.env.local)

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_SECRET=long-random-secret-string
```

## Admin menu

| Page | Purpose |
|------|---------|
| Dashboard | Stats, low-stock alerts, region breakdown |
| Stock Items | Browse/edit stock, **stock in/out** per line |
| Stock Movements | Full audit trail (who, when, delta) |
| Data Import | Excel bulk import |

## Deploy

| Platform | Guide |
|----------|--------|
| **Cloudflare** | [DEPLOY-CLOUDFLARE.md](./DEPLOY-CLOUDFLARE.md) |
| **Vercel** | Import GitHub repo + Upstash env vars (same Redis keys) |

Both use **Upstash Redis** for stock data. URL will differ (`workers.dev` vs `vercel.app`).

## Data storage

| Environment | Storage |
|-------------|---------|
| Local `npm run dev` | `data/inventory.json`, `data/movements.json` |
| Vercel | **Upstash Redis** (required) — seeded from bundled `data/` on first use |

## API (auth required)

- `POST /api/auth/login` — sign in
- `POST /api/auth/logout` — sign out
- `GET /api/inventory?page=1&limit=50` — paginated list
- `POST /api/movements` — `{ itemId, type: "in"|"out"|"adjust", quantity, reason }`
