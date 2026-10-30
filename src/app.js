import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import investmentRoutes from "./routes/investmentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
        .split(",")
        .map((x) => x.trim()),
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    authRoutes,
  );
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.get("/api/health", (_req, res) =>
    res.json({
      success: true,
      data: { status: "ok", timestamp: new Date().toISOString() },
    }),
  );
  app.use("/api/investments", investmentRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/referrals", referralRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
