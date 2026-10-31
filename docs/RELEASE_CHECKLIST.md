# Final Release Checklist

## Repository hygiene

- [ ] Remove `.env`, `.env.production`, credentials, local logs, and database dumps from Git tracking.
- [ ] Rotate any MongoDB password/JWT secret/API credential that was included in a shared archive or committed history.
- [ ] Keep `.env.example` with placeholder values only.
- [ ] Verify `.gitignore` at repository root and in both apps.
- [ ] Remove the unused `file:..` package dependency from client/server manifests if there is no root package; regenerate package-lock files and run clean installs.
- [ ] Ensure README links point to files that exist.

## Functional verification

- [ ] Registration and login work.
- [ ] JWT protection works.
- [ ] Investment create/list work and wallet debit is consistent.
- [ ] Referral direct/tree/income views work.
- [ ] ROI and level-income histories match wallet transactions.
- [ ] Repeated ROI run does not duplicate credits.
- [ ] Dashboard daily ROI and chart use the same IST calendar policy as the ROI service.
- [ ] Frontend production build succeeds.

## Deployment

- [ ] Cloud Run `CRON_TIMEZONE=Asia/Kolkata`.
- [ ] Cloud Run `ROI_CRON_ENABLED=true`.
- [ ] Cloud Run `CLIENT_ORIGIN` contains the exact deployed Vercel origin.
- [ ] Vercel `VITE_API_URL` points to the deployed Cloud Run API.
- [ ] MongoDB Atlas network access is restricted appropriately; avoid permanent `0.0.0.0/0` access where possible.
- [ ] Confirm Cloud Run logs show the API ready and cron scheduled in Asia/Kolkata.
- [ ] Remember: an in-process cron on Cloud Run can miss runs during instance shutdown/restart. A durable external scheduler/worker is recommended for production.

## Submission

- [ ] Public/private GitHub access is set as requested by the assessor.
- [ ] README, API reference, business rules, and testing guide are committed.
- [ ] Confirm actual live URLs and demo credentials (if sharing them) immediately before sending.
- [ ] Do not include production secrets or real user data in the submission.
