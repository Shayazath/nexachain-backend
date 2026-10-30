import { User } from "../models/User.js";
import { LevelIncome } from "../models/LevelIncome.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { roundMoney } from "../utils/money.js";
// Demo rule: configured rates apply to the original investment amount at each ancestor level.
export function getLevelRates() {
  return String(process.env.LEVEL_COMMISSION_RATES || "5,2,1")
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 100)
    .slice(0, 20);
}
export async function distributeLevelIncome({
  investor,
  investment,
  session,
  now = new Date(),
}) {
  const rates = getLevelRates();
  let ancestorId = investor.referredBy;
  const results = [];
  for (let i = 0; i < rates.length && ancestorId; i++) {
    const ancestor = await User.findById(ancestorId).session(session);
    if (!ancestor) break;
    const level = i + 1;
    const amount = roundMoney(
      (Number(investment.amount.toString()) * rates[i]) / 100,
    );
    if (amount > 0) {
      const key = `level:${investment._id}:${ancestor._id}:${level}`;
      const existing = await LevelIncome.findOne({
        idempotencyKey: key,
      }).session(session);
      if (!existing) {
        const newBalance = roundMoney(
          Number(ancestor.walletBalance.toString()) + amount,
        );
        ancestor.walletBalance = newBalance.toFixed(2);
        ancestor.totalLevelIncomeEarned = roundMoney(
          Number(ancestor.totalLevelIncomeEarned.toString()) + amount,
        ).toFixed(2);
        await ancestor.save({ session });
        await LevelIncome.create(
          [
            {
              recipient: ancestor._id,
              generatedBy: investor._id,
              sourceInvestment: investment._id,
              level,
              incomeAmount: amount.toFixed(2),
              date: now,
              status: "Credited",
              idempotencyKey: key,
            },
          ],
          { session },
        );
        await WalletTransaction.create(
          [
            {
              user: ancestor._id,
              type: "LevelIncome",
              amount: amount.toFixed(2),
              balanceAfter: newBalance.toFixed(2),
              referenceId: investment._id,
              idempotencyKey: key,
              description: `Level ${level} income`,
            },
          ],
          { session },
        );
        results.push({ level, amount, recipient: ancestor._id });
      }
    }
    ancestorId = ancestor.referredBy;
  }
  return results;
}
export async function getReferralTree(rootId) {
  const root = await User.findById(rootId).select(
    "fullName email referralCode createdAt",
  );
  if (!root) return null;
  const users = await User.find({ referredBy: { $ne: null } })
    .select("fullName email referralCode referredBy status createdAt")
    .lean();
  const map = new Map();
  for (const u of users) {
    const key = String(u.referredBy);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(u);
  }
  const build = (u, seen = new Set(), depth = 0) => {
    const id = String(u._id);
    if (seen.has(id) || depth > 50) return { ...u, children: [] };
    const next = new Set(seen);
    next.add(id);
    return {
      ...u,
      children: (map.get(id) || []).map((c) => build(c, next, depth + 1)),
    };
  };
  return build(root.toObject ? root.toObject() : root);
}
