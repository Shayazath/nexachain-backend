# Testing Guide

## Automated tests

From `server/`:

```powershell
npm test
```

The database-connected manual ROI test is separate: run `npm run test:manual` only against a disposable test database.

The supplied automated tests cover:
- IST day-key conversion around UTC/IST date boundaries.
- Monetary rounding to two decimal places.

These are utility-level tests; they do not constitute full API, database, integration, or end-to-end coverage.

## Manual ROI test warning

`server/test-roi-manual.js` connects to the MongoDB database configured in `server/.env` and calls the ROI service twice for a hard-coded investment ID. It can update a real database wallet and create ROI history / wallet transaction records. Run only against a disposable test database with a test investment. Do not run it against production or shared assessment data.

## Recommended end-to-end checks

1. Register a new user and verify passwordHash is not returned.
2. Log in and verify a JWT is returned.
3. Call `/auth/me` without a token (expect unauthorized) and with a valid token (expect success).
4. Create a referral parent and child; verify the child appears in the parent's direct referrals and referral tree.
5. Create an investment with sufficient demo wallet balance; verify the wallet debit and investment record.
6. Verify one-time level income records and wallet transactions are created for eligible ancestors.
7. Run ROI against a disposable eligible investment and a fixed IST date; verify one ROIHistory and one wallet transaction are created.
8. Repeat the same ROI processing date; verify no second credit is made.
9. Verify an ineligible date and a completed/suspended account are not credited.
10. Verify dashboard totals, history lists, and earnings chart against ledger records.
11. Verify frontend loading, empty, and error states.
12. Build frontend using `npm run build` in `client/`.

## Additional test coverage recommended before submission

- Auth validation, duplicate email, invalid referral code, suspended login.
- Investment min/max, insufficient balance, invalid duration/ROI.
- Referral rates at each level and no-referral case.
- ROI before start, on start date, final eligible day, and after end date in IST.
- Duplicate execution and concurrent execution.
- MongoDB transaction rollback when a ledger write fails.
- Dashboard IST day aggregation.
