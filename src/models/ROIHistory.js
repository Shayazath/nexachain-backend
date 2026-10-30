import mongoose from "mongoose";
const { Schema, model } = mongoose;
const roiSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    investment: {
      type: Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
      index: true,
    },
    roiAmount: { type: Schema.Types.Decimal128, required: true },
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
        if (r.roiAmount != null) r.roiAmount = Number(r.roiAmount.toString());
        return r;
      },
    },
  },
);
roiSchema.index({ user: 1, date: -1 });
roiSchema.index({ investment: 1, date: 1 }, { unique: true });
export const ROIHistory = model("ROIHistory", roiSchema);
