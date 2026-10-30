import mongoose from "mongoose";
import { Investment } from "../models/Investment.js";
import { User } from "../models/User.js";
import { ROIHistory } from "../models/ROIHistory.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { roundMoney } from "../utils/money.js";
import { utcDayKey } from "../utils/date.js";
// A day is keyed by UTC calendar date. One ROI record per investment/day is enforced by a unique index.
export async function processInvestmentRoi(investmentId, day = new Date()) {
  const dateKey = utcDayKey(day);
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const session = await mongoose.startSession();
  let credited = 0;
  try {
    await session.withTransaction(async () => {
      const inv = await Investment.findById(investmentId).session(session);
      if (
        !inv ||
        inv.status !== "Active" ||
        date < new Date(utcDayKey(inv.startDate) + "T00:00:00.000Z") ||
        date >= new Date(utcDayKey(inv.endDate) + "T00:00:00.000Z")
      )
        return;
      const user = await User.findById(inv.user).session(session);
      if (!user || user.status !== "Active") return;
      const key = `roi:${inv._id}:${dateKey}`;
      if (await ROIHistory.findOne({ idempotencyKey: key }).session(session))
        return;
      const amount = roundMoney(
        (Number(inv.amount.toString()) * inv.dailyRoiPercent) / 100,
      );
      if (amount <= 0) return;
      const balance = roundMoney(
        Number(user.walletBalance.toString()) + amount,
      );
      user.walletBalance = balance.toFixed(2);
      user.totalRoiEarned = roundMoney(
        Number(user.totalRoiEarned.toString()) + amount,
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
        { session },
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
        { session },
      );
      credited = amount;
      if (
        new Date(dateKey + "T00:00:00.000Z").getTime() + 86400000 >=
        new Date(utcDayKey(inv.endDate) + "T00:00:00.000Z").getTime()
      ) {
        inv.status = "Completed";
        await inv.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }
  return { investmentId: String(investmentId), date: dateKey, credited };
}
export async function processDailyRoi(day = new Date()) {
  const dateKey = utcDayKey(day);
  const investments = await Investment.find({
    status: "Active",
    startDate: { $lt: new Date(`${dateKey}T23:59:59.999Z`) },
    endDate: { $gt: new Date(`${dateKey}T00:00:00.000Z`) },
  })
    .select("_id")
    .lean();
  const results = [];
  for (const inv of investments) {
    try {
      results.push(await processInvestmentRoi(inv._id, day));
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
