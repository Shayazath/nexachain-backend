import mongoose from "mongoose";
const { Schema, model } = mongoose;
const levelIncomeSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceInvestment: {
      type: Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
    },
    level: { type: Number, required: true, min: 1 },
    incomeAmount: { type: Schema.Types.Decimal128, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Credited", "Reversed"],
      default: "Credited",
    },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_d, r) {
        if (r.incomeAmount != null)
          r.incomeAmount = Number(r.incomeAmount.toString());
        return r;
      },
    },
  },
);
levelIncomeSchema.index({ recipient: 1, date: -1 });
levelIncomeSchema.index(
  { sourceInvestment: 1, level: 1, recipient: 1 },
  { unique: true },
);
export const LevelIncome = model("LevelIncome", levelIncomeSchema);
