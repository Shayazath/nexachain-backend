# Nexachain AI — MERN Investment & Referral Demo

A full-stack implementation of the 7-page MERN Stack Developer Technical Assessment: MongoDB/Mongoose schemas, Express REST APIs, JWT authentication, investment and referral business logic, ROI scheduler, and a responsive React dashboard.

> **Demo only.** The PDF does not specify real financial terms. Example ROI and referral rates are configurable and are not promises of returns. There are no real-money deposit, withdrawal, or payout integrations.

## Features

- User registration/login with bcrypt password hashing and JWT-protected endpoints.
- Mongoose User, Investment, ROIHistory, LevelIncome, and WalletTransaction models with references and indexes.
- Dashboard summary cards, 30-day earnings chart, ROI/referral history, wallet ledger.
- Investment creation and paginated history.
- Direct referrals, nested referral tree, referral code sharing, level income history.
- Midnight `node-cron` ROI processing, unique idempotency keys and MongoDB transactions.
- Helmet security headers, CORS allowlist, rate limiting, request validation, centralized error responses.
- API documentation, business assumptions and basic automated unit tests.

## Requirements

- Node.js 20+ and npm
- MongoDB replica set (local replica set or MongoDB Atlas). Transactions require replica-set/sharded-cluster support.

## Setup (Windows PowerShell)

1. Install Node.js and MongoDB, or create a MongoDB Atlas database.
2. In the project root:

   ```powershell
   Copy-Item .env.example server/.env
   ```

3. Edit `server/.env`: set `MONGODB_URI` and replace `JWT_SECRET` with a random secret of at least 32 characters. The local URI in the example requires a replica set named `rs0`; Atlas connection strings generally already support transactions.
4. Install packages:

   ```powershell
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

5. Seed a local demo account (optional):

   ```powershell
   npm run seed --prefix server
   ```

   Demo login: `demo@nexachain.local` / `DemoPass123!`. Seed data is only a simulated wallet balance. Change/remove these credentials before exposing any environment.
6. Start API and frontend in separate PowerShell terminals:

   ```powershell
   npm run dev --prefix server
   npm run dev --prefix client
   ```

   Open `http://localhost:5173`. API health: `http://localhost:5000/api/health`.

## Root convenience scripts

After installing root dependencies, `npm run dev` runs both apps. `npm test` runs backend unit tests; `npm run build` builds the React app.

## Environment variables

See `.env.example` and `docs/BUSINESS_RULES.md` for all variables and assumptions. Keep `.env` out of version control.

## API documentation

See [`docs/API.md`](docs/API.md) for endpoints, authentication, and request examples. See [`docs/BUSINESS_RULES.md`](docs/BUSINESS_RULES.md) for unspecified policy assumptions and [`docs/TESTING.md`](docs/TESTING.md) for checks.

## Architecture

- `server/src/models`: persistence schemas and indexes
- `server/src/controllers`: HTTP handlers and validation
- `server/src/services`: authentication, investment, ROI and referral business logic
- `server/src/jobs`: midnight ROI scheduler
- `client/src/pages`: login, registration, dashboard, investments, referrals and transaction activity

## Important deployment notes

- Run only one active scheduler instance unless you add distributed job locking. Unique idempotency keys prevent duplicate ledger credits, but a production deployment should also use a dedicated worker/lock strategy and alerting.
- The midnight cron runs in the configured timezone while ROI records use UTC day keys; align this policy before launch.
- Configure TLS, strong secrets, secure deployment environment variables, backups, monitoring, audit controls, and proper legal/compliance review before any real-money usage.
- Production hardening still needed for business-approved cancellation/refund rules, admin operations, deposit/withdrawal/payment integration, email verification, password recovery, and formal integration/load/security tests.
