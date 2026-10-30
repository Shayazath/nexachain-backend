import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
export const createReferralCode = () =>
  crypto.randomBytes(5).toString("hex").toUpperCase();
export async function registerUser({
  fullName,
  email,
  mobileNumber,
  password,
  referralCode,
}) {
  email = String(email).trim().toLowerCase();
  if (await User.exists({ email }))
    throw new HttpError(409, "Email is already registered");
  let parent = null;
  if (referralCode) {
    parent = await User.findOne({
      referralCode: String(referralCode).toUpperCase(),
      status: "Active",
    });
    if (!parent) throw new HttpError(400, "Referral code is invalid");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const initialBalance = Number(
    process.env.DEMO_INITIAL_WALLET_BALANCE ?? 100000,
  );
  if (!Number.isFinite(initialBalance) || initialBalance < 0) {
    throw new Error("Invalid demo wallet balance configuration");
  }
  let user;
  for (let i = 0; i < 3; i++) {
    try {
      user = await User.create({
        fullName,
        email,
        mobileNumber,
        passwordHash,
        walletBalance: initialBalance,
        referralCode: createReferralCode(),
        referredBy: parent?._id,
      });
      break;
    } catch (e) {
      if (e.code === 11000 && e.keyPattern?.referralCode && i < 2) continue;
      throw e;
    }
  }
  return user;
}
export async function loginUser({ email, password }) {
  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new HttpError(401, "Invalid email or password");
  if (user.status !== "Active")
    throw new HttpError(403, "Account is suspended");
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
  user.passwordHash = undefined;
  return { token, user };
}
