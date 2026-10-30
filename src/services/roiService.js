import mongoose from "mongoose";
import { Investment } from "../models/Investment.js";
import { User } from "../models/User.js";
import { ROIHistory } from "../models/ROIHistory.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { roundMoney } from "../utils/money.js";
import {
  istDayKey,
  istDayStart,
  istNextDayStart,
} from "../utils/date.js";

// One ROI record per investment per IST calendar day.
export async function processInvestmentRoi(investmentId, day = new Date()) {
  const dateKey = istDayKey(day);
  const date = istDayStart(dateKey);
  const nextDay = istNextDayStart(dateKey);

  const session = await mongoose.startSession();
  let credited = 0;

  try {
    await session.withTransaction(async () => {
      const inv = await Investment.findById(investmentId).session(session);

      if (!inv || inv.status !== "Active") return;

      const investmentStartDay = istDayStart(istDayKey(inv.startDate));
      const investmentEndDay = istDayStart(istDayKey(inv.endDate));

      // Process only dates within the investment's IST calendar-day period.
      if (
        date < investmentStartDay ||
        date >= investmentEndDay
      ) {
        return;
      }

      const user = await User.findById(inv.user).session(session);

      if (!user || user.status !== "Active") return;

      const key = `roi:${inv._id}:${dateKey}`;

      // Prevent duplicate ROI credit.
      if (
        await ROIHistory.findOne({ idempotencyKey: key }).session(session)
      ) {
        return;
      }

      const amount = roundMoney(
        (Number(inv.amount.toString()) * inv.dailyRoiPercent) / 100
      );

      if (amount <= 0) return;

      const balance = roundMoney(
        Number(user.walletBalance.toString()) + amount
      );

      user.walletBalance = balance.toFixed(2);

      user.totalRoiEarned = roundMoney(
        Number(user.totalRoiEarned.toString()) + amount
      ).toFixed(2);

      await user.save({ session });

      await ROIHistory.create(
        [
          {
            user: user._id,
            investment: inv._id,
            roiAmount: amount.toFixed(2),
            date,
            status: "Credited",
            idempotencyKey: key,
          },
        ],
        { session }
      );

      await WalletTransaction.create(
        [
          {
            user: user._id,
            type: "ROI",
            amount: amount.toFixed(2),
            balanceAfter: balance.toFixed(2),
            referenceId: inv._id,
            idempotencyKey: key,
            description: `Daily ROI ${dateKey}`,
          },
        ],
        { session }
      );

      credited = amount;

      // Complete the investment after its final eligible IST day.
      if (nextDay >= investmentEndDay) {
        inv.status = "Completed";
        await inv.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }

  return {
    investmentId: String(investmentId),
    date: dateKey,
    credited,
  };
}

export async function processDailyRoi(day = new Date()) {
  const dateKey = istDayKey(day);

  const date = istDayStart(dateKey);
  const nextDay = istNextDayStart(dateKey);

  const investments = await Investment.find({
    status: "Active",
    startDate: { $lt: nextDay },
    endDate: { $gt: date },
  })
    .select("_id")
    .lean();

  const results = [];

  for (const inv of investments) {
    try {
      results.push(
        await processInvestmentRoi(inv._id, day)
      );
    } catch (error) {
      if (error.code === 11000) continue;

      console.error(`ROI failed for investment ${inv._id}`, error);

      results.push({
        investmentId: String(inv._id),
        error: "processing_failed",
      });
    }
  }

  return {
    date: dateKey,
    processed: results.length,
    credited: results.filter((x) => x.credited > 0).length,
    results,
  };
}