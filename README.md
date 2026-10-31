# Nexachain AI — Backend API

Express.js and MongoDB backend for the Nexachain investment/referral technical-assessment demo.

## Stack

- Node.js 20+, Express 4, Mongoose 8
- MongoDB Atlas or MongoDB replica set (transactions are used)
- JWT authentication and bcrypt password hashing
- Zod validation, Helmet, CORS allowlist, rate limiting
- node-cron for daily ROI processing

## Features

- Registration, login, JWT-protected current-user API
- Investment creation and paginated investment history
- Dashboard summary, history, and earnings-chart APIs
- Direct referral, referral tree, and level-income APIs
- Transactional wallet debit and referral commission distribution
- Daily ROI history and wallet credits with idempotency protection
- IST calendar-day calculations and configurable node-cron timezone

## Setup (Windows PowerShell)

```powershell
Copy-Item .env.example .env
# Edit .env and set MONGODB_URI and a strong JWT_SECRET (32+ characters)
npm ci
npm run seed # optional demo data; use only on a test database
npm run dev
```

API runs at `http://localhost:5000`; health endpoint is `/api/health`.

## Tests

```powershell
npm test
```

`npm test` runs the automated utility tests. `npm run test:manual` runs a database-backed manual ROI test and can modify wallet/ledger data; run it only against a disposable test database, never production.

## Environment variables

| Name | Purpose | Example/default |
|---|---|---|
| `NODE_ENV` | Runtime mode | `development` |
| `PORT` | HTTP port | `5000` locally |
| `MONGODB_URI` | MongoDB connection | Set privately |
| `JWT_SECRET` | JWT signing key (32+ chars) | Set privately |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `CLIENT_ORIGIN` | Allowed frontend origins, comma-separated | `http://localhost:5173` |
| `MIN_INVESTMENT` | Minimum demo investment | `1000` |
| `MAX_INVESTMENT` | Maximum demo investment | `1000000` |
| `DEFAULT_DAILY_ROI_PERCENT` | Demo daily ROI percentage | `0.5` |
| `LEVEL_COMMISSION_RATES` | Commission percentages by ancestor level | `5,2,1` |
| `DEMO_INITIAL_WALLET_BALANCE` | Simulated initial wallet balance | `100000` |
| `ROI_CRON_ENABLED` | Disable only when exactly `false` | `true` |
| `CRON_TIMEZONE` | node-cron timezone | `Asia/Kolkata` |

Never commit `.env` or real credentials. `.env.example` contains placeholders only.

## API documentation

See [`docs/API.md`](docs/API.md). Business assumptions are in [`docs/BUSINESS_RULES.md`](docs/BUSINESS_RULES.md), and test instructions are in [`docs/TESTING.md`](docs/TESTING.md).

## Deployment

The supplied Dockerfile is intended for Cloud Run. Configure all environment variables in the deployment platform and set `CLIENT_ORIGIN` to the exact deployed frontend origin. MongoDB Atlas must permit the Cloud Run service to connect.

Live API: https://nexachain-backend-git-525634051724.asia-south1.run.app

## Important limitations

- This is a simulated assessment/demo platform. It has no real deposit, withdrawal, payment, or payout integration. Example ROI and referral percentages are assumptions, not guaranteed returns.
- node-cron runs inside the API process. Cloud Run can stop/restart instances, so in-process cron is not durable and may miss a scheduled execution. A production deployment should use a dedicated scheduler/worker and distributed locking/monitoring.
- MongoDB transactions require a replica-set or sharded-cluster deployment.
- The assessment does not define timezone; this implementation uses Asia/Kolkata for the ROI scheduler and ROI calendar-day calculations.
- Frontend repository: **add your actual frontend GitHub URL here**.
