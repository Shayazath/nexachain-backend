
import { Investment } from "../models/Investment.js";
import { ROIHistory } from "../models/ROIHistory.js";
import { LevelIncome } from "../models/LevelIncome.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  istDayKey,
  istDayStart,
  istNextDayStart,
} from "../utils/date.js";

const num = (v) => Number(v?.toString?.() ?? v ?? 0);

const IST_TIMEZONE = "Asia/Kolkata";

export const summary = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  // Today's IST date boundaries.
  const todayKey = istDayKey();
  const todayStart = istDayStart(todayKey);
  const tomorrowStart = istNextDayStart(todayKey);

  const [investments, roi, level, dailyRoi, counts] = await Promise.all([
    Investment.aggregate([
      { $match: { user: uid, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "Active"] }, 1, 0],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),

    ROIHistory.aggregate([
      { $match: { user: uid, status: "Credited" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$roiAmount" } },
        },
      },
    ]),

    LevelIncome.aggregate([
      { $match: { recipient: uid, status: "Credited" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$incomeAmount" } },
        },
      },
    ]),

    // Daily ROI calculated using IST calendar-day boundaries.
    ROIHistory.aggregate([
      {
        $match: {
          user: uid,
          status: "Credited",
          date: {
            $gte: todayStart,
            $lt: tomorrowStart,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$roiAmount" } },
        },
      },
    ]),

    Investment.aggregate([
      { $match: { user: uid } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalInvestments: num(investments[0]?.total),
      activeInvestments: investments[0]?.active || 0,
      investmentCount: investments[0]?.count || 0,
      totalRoiEarned: num(roi[0]?.total),
      totalLevelIncomeEarned: num(level[0]?.total),
      dailyRoi: num(dailyRoi[0]?.total),
      walletBalance: num(req.user.walletBalance),
      investmentStatusCounts: Object.fromEntries(
        counts.map((c) => [c._id, c.count])
      ),
    },
  });
});

export const histories = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

  const [roi, level, transactions] = await Promise.all([
    ROIHistory.find({ user: uid })
      .populate("investment", "amount plan.name")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    LevelIncome.find({ recipient: uid })
      .populate("generatedBy", "fullName referralCode")
      .populate("sourceInvestment", "amount")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    WalletTransaction.find({ user: uid })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      roiHistory: roi,
      levelIncomeHistory: level,
      walletTransactions: transactions,
    },
  });
});

export const earningsChart = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  // Calculate the beginning of the last 30 IST calendar days.
  const todayKey = istDayKey();
  const todayStart = istDayStart(todayKey);

  const since = new Date(
    todayStart.getTime() - 29 * 24 * 60 * 60 * 1000
  );

  const [roi, level] = await Promise.all([
    ROIHistory.aggregate([
      {
        $match: {
          user: uid,
          date: { $gte: since },
          status: "Credited",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: IST_TIMEZONE,
            },
          },
          amount: {
            $sum: { $toDouble: "$roiAmount" },
          },
        },
      },
    ]),

    LevelIncome.aggregate([
      {
        $match: {
          recipient: uid,
          date: { $gte: since },
          status: "Credited",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: IST_TIMEZONE,
            },
          },
          amount: {
            $sum: { $toDouble: "$incomeAmount" },
          },
        },
      },
    ]),
  ]);

  const map = new Map();

  for (const x of roi) {
    map.set(x._id, {
      date: x._id,
      roi: x.amount,
      levelIncome: 0,
    });
  }

  for (const x of level) {
    if (!map.has(x._id)) {
      map.set(x._id, {
        date: x._id,
        roi: 0,
        levelIncome: 0,
      });
    }

    map.get(x._id).levelIncome = x.amount;
  }

  res.json({
    success: true,
    data: [...map.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  });
});
