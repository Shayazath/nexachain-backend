import { User } from "../models/User.js";
import { LevelIncome } from "../models/LevelIncome.js";
import { getReferralTree } from "../services/referralService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const direct = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [items, total] = await Promise.all([
    User.find({ referredBy: req.user._id })
      .select("fullName email referralCode status createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments({ referredBy: req.user._id }),
  ]);
  res.json({ success: true, data: { items, total, page, limit } });
});
export const tree = asyncHandler(async (req, res) => {
  const data = await getReferralTree(req.user._id);
  res.json({ success: true, data });
});
export const income = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [items, total] = await Promise.all([
    LevelIncome.find({ recipient: req.user._id })
      .populate("generatedBy", "fullName email referralCode")
      .populate("sourceInvestment", "amount")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LevelIncome.countDocuments({ recipient: req.user._id }),
  ]);
  res.json({ success: true, data: { items, total, page, limit } });
});
