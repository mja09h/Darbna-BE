// src/controllers/sosAlertController.ts
import { Request, Response } from "express";
import SOSAlert from "../../models/SOSAlert";
import { sendSosAlertToAllUsers } from "../../pushNotifications"; // We will create this service later
import { AuthRequest } from "../../types/User";

/**
 * @desc    Create a new SOS alert
 * @route   POST /api/sos/create
 * @access  Private (requires authentication)
 */
export const createSOSAlert = async (req: AuthRequest, res: Response) => {
  const { latitude, longitude } = req.body;
  // The `user` object is attached to the request by your authentication middleware
  const userId = req.user?._id;

  try {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ message: "Invalid coordinates provided" });
    }

    const newAlert = new SOSAlert({
      user: userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
      },
    });
    await newAlert.save();

    // Populate the user's info to send back in the response and to real-time listeners
    const alertWithUser = await newAlert.populate("user", "username _id");

    // --- Real-Time Notifications ---
    const io = req.app.get("io"); // Get the Socket.IO instance
    io.emit("new-sos-alert", alertWithUser); // Notify active web/app clients
    sendSosAlertToAllUsers(alertWithUser); // Send push notifications to offline/background clients
    // --------------------------------

    res.status(201).json(alertWithUser);
  } catch (error) {
    console.error("Error creating SOS alert:", error);
    res.status(500).json({ message: "Server error while creating SOS alert" });
  }
};

/**
 * @desc    Get all active SOS alerts
 * @route   GET /api/sos/active
 * @access  Public
 */
export const getActiveSOSAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await SOSAlert.find({ status: "ACTIVE" })
      .populate("user", "username _id") // Replace user ID with username and ID
      .sort({ createdAt: -1 }) // Show newest alerts first
      .limit(50);

    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching active alerts" });
  }
};

/**
 * @desc    Resolve an SOS alert
 * @route   POST /api/sos/resolve
 * @access  Private (requires authentication)
 */
export const resolveSOSAlert = async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  const { alertId } = req.body;

  try {
    const alert = await SOSAlert.findById(alertId);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    // Authorization check: Only the user who created the alert can resolve it
    if (alert.user.toString() !== userId?.toString()) {
      return res
        .status(403)
        .json({ message: "User not authorized to resolve this alert" });
    }

    if (alert.status === "RESOLVED") {
      return res
        .status(400)
        .json({ message: "Alert has already been resolved" });
    }

    alert.status = "RESOLVED";
    alert.resolvedAt = new Date();
    await alert.save();

    // --- Real-Time Notification ---
    const io = req.app.get("io");
    io.emit("sos-alert-resolved", { alertId: alert._id.toString() });
    // -----------------------------

    res.status(200).json(alert);
  } catch (error) {
    console.error("Error resolving SOS alert:", error);
    res.status(500).json({ message: "Server error while resolving alert" });
  }
};
