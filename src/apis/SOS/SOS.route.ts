import { Router } from "express";
import {
  createSOSAlert,
  getActiveSOSAlerts,
  resolveSOSAlert,
  offerHelp,
  cancelHelp,
} from "./SOS.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.post("/create", authMiddleware, createSOSAlert);
router.get("/active", authMiddleware, getActiveSOSAlerts);
router.put("/:alertId/resolve", authMiddleware, resolveSOSAlert);
router.post("/:alertId/help", authMiddleware, offerHelp);
router.post("/:alertId/cancel-help", authMiddleware, cancelHelp);

export default router;
