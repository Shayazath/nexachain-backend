import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import {startRoiCron, stopRoiCron } from "./jobs/roiCron.js";
const port = Number(process.env.PORT || 5000);
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("JWT_SECRET must be at least 32 characters");
  await connectDB();
  const app = createApp();
  const server = app.listen(port, () =>
    console.log(`API listening on http://localhost:${port}`),
  );
  startRoiCron();
  const shutdown = async () => {
    console.log("Shutting down server...");

    stopRoiCron();

    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
      } catch (error) {
        console.error("Shutdown error:", error);
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} catch (e) {
  console.error("Startup failed:", e.message);
  process.exit(1);
}
