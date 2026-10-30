import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
await connectDB();
const email = "demo@nexachain.local";
let user = await User.findOne({ email }).select("+passwordHash");
if (!user) {
  user = await User.create({
    fullName: "Demo Investor",
    email,
    mobileNumber: "+910000000000",
    passwordHash: await bcrypt.hash("DemoPass123!", 12),
    referralCode: "NEXADEMO",
    walletBalance: "100000.00",
  });
  console.log("Demo user created");
} else console.log("Demo user already exists");
console.log("Demo login: demo@nexachain.local / DemoPass123!");
await mongoose.disconnect();
