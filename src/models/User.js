import mongoose from "mongoose";
const { Schema, model } = mongoose;
const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobileNumber: { type: String, required: true, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true, select: false },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    walletBalance: { type: Schema.Types.Decimal128, default: "0.00" },
    totalRoiEarned: { type: Schema.Types.Decimal128, default: "0.00" },
    totalLevelIncomeEarned: { type: Schema.Types.Decimal128, default: "0.00" },
    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        for (const k of [
          "walletBalance",
          "totalRoiEarned",
          "totalLevelIncomeEarned",
        ])
          if (ret[k] != null) ret[k] = Number(ret[k].toString());
        return ret;
      },
    },
  },
);
userSchema.index({ referredBy: 1, createdAt: -1 });
export const User = model("User", userSchema);
