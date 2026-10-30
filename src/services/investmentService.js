import mongoose from "mongoose";
import { Investment } from "../models/Investment.js";
import { User } from "../models/User.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { distributeLevelIncome } from "./referralService.js";
import { roundMoney } from "../utils/money.js";
import { HttpError } from "../utils/httpError.js";
export async function createInvestment(
  userId,
  { amount, planName = "Demo Plan", dailyRoiPercent, durationDays = 30 },
) {
  const value = Number(amount),
    min = Number(process.env.MIN_INVESTMENT || 1000),
    max = Number(process.env.MAX_INVESTMENT || 1000000);
  const roi =
    dailyRoiPercent === undefined
      ? Number(process.env.DEFAULT_DAILY_ROI_PERCENT || 0.5)
      : Number(dailyRoiPercent);
  if (!Number.isFinite(value) || value < min || value > max)
    throw new HttpError(
      400,
      `Investment amount must be between ${min} and ${max}`,
    );
  if (!Number.isFinite(roi) || roi < 0 || roi > 100)
    throw new HttpError(400, "Daily ROI percentage must be between 0 and 100");
  if (
    !Number.isInteger(Number(durationDays)) ||
    Number(durationDays) < 1 ||
    Number(durationDays) > 3650
  )
    throw new HttpError(400, "Duration must be 1 to 3650 days");
  const session = await mongoose.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new HttpError(404, "User not found");
      const balance = Number(user.walletBalance.toString());
      if (balance < value)
        throw new HttpError(
          400,
          "Insufficient wallet balance. Demo investments require funds already in the wallet.",
        );
      const start = new Date();
      const end = new Date(start.getTime() + Number(durationDays) * 86400000);
      const [investment] = await Investment.create(
        [
          {
            user: user._id,
            amount: value.toFixed(2),
            plan: {
              name: planName,
              dailyRoiPercent: roi,
              durationDays: Number(durationDays),
            },
            startDate: start,
            endDate: end,
            dailyRoiPercent: roi,
            status: "Active",
          },
        ],
        { session },
      );
      created = investment;
      const next = roundMoney(balance - value);
      user.walletBalance = next.toFixed(2);
      await user.save({ session });
      await WalletTransaction.create(
        [
          {
            user: user._id,
            type: "InvestmentDebit",
            amount: (-value).toFixed(2),
            balanceAfter: next.toFixed(2),
            referenceId: investment._id,
            idempotencyKey: `investment-debit:${investment._id}`,
            description: `Investment: ${planName}`,
          },
        ],
        { session },
      );
      await distributeLevelIncome({
        investor: user,
        investment,
        session,
        now: start,
      });
    });
  } finally {
    await session.endSession();
  }
  return Investment.findById(created._id).populate("user", "fullName email");
}
