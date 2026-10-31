# Business Rules and Assumptions

This document separates requirements stated in the assessment from implementation choices made where the assessment did not define a policy.

## Assessment requirements

The assessment requests:
- User, Investment, Referral/Level Income, and ROI History models.
- Registration/login and JWT-protected APIs.
- Investment create/list and dashboard totals.
- Direct referrals and complete referral tree.
- Daily ROI for active investments, stored history, and wallet updates.
- Referral hierarchy traversal and level-based income crediting.
- Duplicate prevention and transaction consistency.
- A node-cron job every day at 12:00 AM.

The assessment does not specify the timezone for 12:00 AM, ROI percentage, investment duration, commission percentages, eligibility criteria, or real-money handling.

## Implementation assumptions in this repository

### Demo wallet and investment

- New users receive the configured `DEMO_INITIAL_WALLET_BALANCE` simulated balance.
- An investment is funded from the existing wallet; no payment/deposit integration exists.
- Default amount bounds are 1,000 to 1,000,000 unless overridden.
- Default daily ROI is 0.5%; default duration is 30 days.
- ROI is calculated as `investment amount × daily ROI percentage / 100`.
- ROI is rounded to two decimal places.
- Investment creation, wallet debit, and referral distribution run in a MongoDB transaction.

### Daily ROI

- Scheduler expression: `0 0 * * *`.
- Scheduler timezone defaults to `Asia/Kolkata`, configurable through `CRON_TIMEZONE`.
- The ROI service keys each record by investment ID and IST calendar date.
- ROI history and wallet transaction records have unique idempotency keys.
- The ROI service stores the IST day-start instant as a BSON Date; MongoDB displays/stores that instant in UTC. For example, IST midnight is the previous day at 18:30 UTC.
- The service marks an investment Completed after processing its final eligible IST calendar day.
- The ROI service checks that the investment and user are Active before crediting.

### Referral income

- Commission rates come from `LEVEL_COMMISSION_RATES`, default `5,2,1`.
- Each configured rate is applied to the original investment amount for its corresponding ancestor level.
- Referral commissions are one-time per source investment, recipient, and level; they are not recurring daily ROI.
- The hierarchy traversal stops when there is no parent or the configured maximum (up to 20 levels) is reached.
- A missing ancestor stops traversal. The current service does not explicitly skip a suspended ancestor; confirm the intended business policy before production use.

### Data and consistency

- Monetary fields use MongoDB Decimal128.
- Unique idempotency keys and MongoDB transactions protect wallet and history consistency.
- Transactions require MongoDB replica-set/sharded-cluster support.
- Dates are stored as BSON Date instants, conventionally represented in UTC; application calendar-day logic uses IST for ROI.

## Not implemented / outside assessment scope

- Real deposits, withdrawals, bank/payment gateway integration, KYC, or payout.
- Admin console, manual wallet adjustments, cancellation/refund workflow.
- Email/phone verification, password reset, refresh-token/revocation workflow.
- Formal financial/compliance approval or guarantee of returns.
