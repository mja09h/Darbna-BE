import { Router } from "express";
import {
  createSOSAlert,
  getActiveSOSAlerts,
  resolveSOSAlert,
  offerHelp,
  cancelHelp,
} from "./SOS.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

// Public endpoint - anyone can view active SOS alerts for safety reasons
// Note: This endpoint requires location query params but no auth token
router.get("/active", getActiveSOSAlerts);

// Protected endpoints - require authentication
router.post("/create", auth, createSOSAlert);
router.put("/:alertId/resolve", auth, resolveSOSAlert);
router.post("/:alertId/help", auth, offerHelp);
router.post("/:alertId/cancel-help", auth, cancelHelp);

export default router;
