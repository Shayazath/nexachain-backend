import { z } from "zod";
import { Investment } from "../models/Investment.js";
import { createInvestment } from "../services/investmentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const schema = z.object({
  amount: z.coerce.number().positive(),
  planName: z.string().trim().min(2).max(80).optional(),
  dailyRoiPercent: z.coerce.number().min(0).max(100).optional(),
  durationDays: z.coerce.number().int().min(1).max(3650).optional(),
});
export const create = asyncHandler(async (req, res) => {
  const investment = await createInvestment(
    req.user._id,
    schema.parse(req.body),
  );
  res.status(201).json({ success: true, data: { investment } });
});
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const filter = { user: req.user._id };
  if (["Active", "Completed", "Cancelled"].includes(req.query.status))
    filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Investment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Investment.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: { items, total, page, limit, pages: Math.ceil(total / limit) },
  });
});
