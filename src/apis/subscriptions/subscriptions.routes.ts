import { Router } from "express";
import { auth } from "../../middlewares/auth";
import {
    getSubscriptionStatus,
    getPaymentInfo,
    upgradeToPremium,
    downgradeToFree,
    updateCardInfo,
    deleteCardInfo,
} from "./subscriptions.controller";

const router = Router();

// All subscription routes require authentication
router.get("/status", auth, getSubscriptionStatus);
router.get("/payment-info", auth, getPaymentInfo);
router.post("/upgrade", auth, upgradeToPremium);
router.post("/downgrade", auth, downgradeToFree);
router.put("/card", auth, updateCardInfo);
router.delete("/card", auth, deleteCardInfo);

export default router;

