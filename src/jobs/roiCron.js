
import cron from "node-cron";
import { processDailyRoi } from "../services/roiService.js";

let roiTask = null;
let isRunning = false;

export function startRoiCron() {
  if (process.env.ROI_CRON_ENABLED === "false") {
    console.log("ROI cron disabled");
    return null;
  }

  // Prevent duplicate scheduler initialization.
  if (roiTask) {
    console.log("ROI cron is already running");
    return roiTask;
  }

  const timezone = process.env.CRON_TIMEZONE || "UTC";

  roiTask = cron.schedule(
    "0 0 * * *",
    async () => {
      if (isRunning) {
        console.warn("Previous ROI job is still running. Skipping this execution.");
        return;
      }

      isRunning = true;

      console.log(
        `[ROI CRON] Starting daily ROI processing at ${new Date().toISOString()}`,
      );

      try {
        const result = await processDailyRoi();

        console.log("[ROI CRON] Processing completed:", JSON.stringify(result));
      } catch (error) {
        console.error("[ROI CRON] Daily ROI job failed:", error);
      } finally {
        isRunning = false;
      }
    },
    { timezone },
  );

  console.log(
    `[ROI CRON] Scheduled daily at 00:00 (${timezone})`,
  );

  return roiTask;
}

export function stopRoiCron() {
  if (roiTask) {
    roiTask.stop();
    roiTask = null;
    console.log("[ROI CRON] Scheduler stopped");
  }
}
