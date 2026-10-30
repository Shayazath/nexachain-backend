import mongoose from "mongoose";
const { Schema, model } = mongoose;
const walletTransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["InvestmentDebit", "ROI", "LevelIncome", "Adjustment"],
      required: true,
    },
    amount: { type: Schema.Types.Decimal128, required: true },
    balanceAfter: { type: Schema.Types.Decimal128, required: true },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    idempotencyKey: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 200 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_d, r) {
        for (const k of ["amount", "balanceAfter"])
          if (r[k] != null) r[k] = Number(r[k].toString());
        return r;
      },
    },
  },
);
walletTransactionSchema.index({ user: 1, createdAt: -1 });
export const WalletTransaction = model(
  "WalletTransaction",
  walletTransactionSchema,
);
