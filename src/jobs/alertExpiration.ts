// src/jobs/alertExpiration.ts
import cron from "node-cron";
import SOSAlert from "../models/SOSAlert";
import { sendAlertExpiredNotification } from "../pushNotifications";
import { Server } from "socket.io";

export const startAlertExpirationJob = (io: Server) => {
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    const expiredAlerts = await SOSAlert.find({
      expireAt: { $lte: now },
      status: "ACTIVE",
    }).populate("user", "username pushToken");

    for (const alert of expiredAlerts) {
      await sendAlertExpiredNotification(alert.user);
      io.emit("sos-alert-expired", { alertId: alert._id.toString() });
      alert.status = "RESOLVED";
      alert.resolvedAt = now;
      await alert.save();
    }
  });
  console.log("Alert expiration job scheduled.");
};
