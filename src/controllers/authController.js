import { registerUser, loginUser } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { z } from "zod";
const registration = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  mobileNumber: z.string().trim().min(7).max(20),
  password: z.string().min(8).max(72),
  referralCode: z.string().trim().optional(),
});
const login = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});
export const register = asyncHandler(async (req, res) => {
  const body = registration.parse(req.body);
  const user = await registerUser(body);
  res.status(201).json({ success: true, data: { user } });
});
export const loginHandler = asyncHandler(async (req, res) => {
  const body = login.parse(req.body);
  const data = await loginUser(body);
  res.json({ success: true, data });
});
export const me = asyncHandler(async (req, res) =>
  res.json({ success: true, data: { user: req.user } }),
);
