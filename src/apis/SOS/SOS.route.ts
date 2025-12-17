import { Router } from "express";
import { createSOSAlert, getActiveSOSAlerts, resolveSOSAlert } from "./SOS.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

// Public endpoint - anyone can view active SOS alerts for safety reasons
router.get("/active", getActiveSOSAlerts);

// Protected endpoints - require authentication
router.post("/create", auth, createSOSAlert);
router.post("/resolve", auth, resolveSOSAlert);

export default router;