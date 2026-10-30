import dotenv from "dotenv";
dotenv.config({ path: new URL("./.env", import.meta.url) });

import mongoose from "mongoose";
import { connectDB } from "./src/config/db.js";
import { processInvestmentRoi } from "./src/services/roiService.js";

const investmentId = "6ae4d37d0e695b22e0e52ca1";

try {
  await connectDB();

  // Both calls use the same UTC calendar date.
  const testDate = new Date();

  const first = await processInvestmentRoi(investmentId, testDate);
  const second = await processInvestmentRoi(investmentId, testDate);

  console.log("First run:", first);
  console.log("Second run:", second);

  if (first.credited > 0 && second.credited === 0) {
    console.log("PASS: duplicate ROI credit was prevented.");
  } else if (first.credited === 0 && second.credited === 0) {
    console.log(
      "No new ROI credited. Check eligibility and existing history."
    );
  } else {
    console.error("Unexpected result: investigate before proceeding.");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("ROI test failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
