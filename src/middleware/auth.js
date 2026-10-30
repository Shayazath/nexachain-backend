import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
export const protect = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) throw new HttpError(401, "Authentication token is required");
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
  const user = await User.findById(payload.sub).select("-passwordHash");
  if (!user || user.status !== "Active")
    throw new HttpError(401, "Account is unavailable");
  req.user = user;
  next();
});
