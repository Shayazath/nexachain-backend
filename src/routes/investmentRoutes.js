import { Router } from "express";
import { create, list } from "../controllers/investmentController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.post("/", create);
router.get("/", list);

export default router;
