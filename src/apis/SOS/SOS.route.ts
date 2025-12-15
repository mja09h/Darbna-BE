import { Router } from "express";
import { createSOSAlert, getActiveSOSAlerts, resolveSOSAlert } from "./SOS.controller";

const router = Router();

router.post("/create", createSOSAlert);
router.get("/active", getActiveSOSAlerts);
router.post("/resolve", resolveSOSAlert);

export default router;