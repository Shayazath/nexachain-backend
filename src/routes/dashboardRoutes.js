import { Router } from "express";
import {
  summary,
  histories,
  earningsChart,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";
const router = Router();
router.use(protect);
router.get("/summary", summary);
router.get("/histories", histories);
router.get("/earnings-chart", earningsChart);
export default router;
