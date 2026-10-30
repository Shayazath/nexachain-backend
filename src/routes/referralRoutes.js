import { Router } from "express";
import { direct, tree, income } from "../controllers/referralController.js";
import { protect } from "../middleware/auth.js";
const router = Router();
router.use(protect);
router.get("/direct", direct);
router.get("/tree", tree);
router.get("/income", income);
export default router;
