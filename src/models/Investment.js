import mongoose from "mongoose";
const { Schema, model } = mongoose;
const investmentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Schema.Types.Decimal128, required: true },
    plan: {
      name: { type: String, required: true, trim: true },
      dailyRoiPercent: { type: Number, required: true, min: 0, max: 100 },
      durationDays: { type: Number, required: true, min: 1, max: 3650 },
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    dailyRoiPercent: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_d, r) {
        if (r.amount != null) r.amount = Number(r.amount.toString());
        return r;
      },
    },
  },
);
investmentSchema.index({ user: 1, status: 1, startDate: -1 });
investmentSchema.index({ status: 1, endDate: 1 });
export const Investment = model("Investment", investmentSchema);
