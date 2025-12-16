// src/apis/SOS/SOS.controller.ts
import { Request, Response } from "express";
import SOSAlert from "../../models/SOSAlert";
import User, { IUser } from "../../models/Users";
import {
  sendSosAlertToAllUsers,
  sendHelpOfferNotification,
} from "../../pushNotifications";
import mongoose from "mongoose";

const SOS_RATE_LIMIT_MINUTES = 30;

// CREATE SOS ALERT
export const createSOSAlert = async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  const userId = (req as any).user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.lastSOSSentAt) {
      const minutesSince = (Date.now() - user.lastSOSSentAt.getTime()) / 60000;
      if (minutesSince < SOS_RATE_LIMIT_MINUTES) {
        const timeLeft = SOS_RATE_LIMIT_MINUTES - Math.floor(minutesSince);
        return res
          .status(429)
          .json({ message: `Rate limit: ${timeLeft} minute(s) remaining.` });
      }
    }

    const newAlert = new SOSAlert({
      user: userId,
      location: { type: "Point", coordinates: [longitude, latitude] },
    });
    await newAlert.save();

    user.lastSOSSentAt = new Date();
    await user.save();

    const alertWithUser = await newAlert.populate("user", "username _id");
    req.app.get("io").emit("new-sos-alert", alertWithUser);
    sendSosAlertToAllUsers(alertWithUser);

    res.status(201).json(alertWithUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET ACTIVE ALERTS (WITH DISTANCE)
export const getActiveSOSAlerts = async (req: Request, res: Response) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude)
    return res.status(400).json({ message: "Current location is required" });

  const userLat = parseFloat(latitude as string);
  const userLng = parseFloat(longitude as string);

  try {
    const alerts = await SOSAlert.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [userLng, userLat] },
          distanceField: "distance",
          spherical: true,
          query: { status: "ACTIVE" },
        },
      },
      { $sort: { distance: 1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          location: 1,
          status: 1,
          createdAt: 1,
          distance: 1,
          "user._id": 1,
          "user.username": 1,
        },
      },
    ]);
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// OFFER HELP
export const offerHelp = async (req: Request, res: Response) => {
  const { alertId } = req.params;
  const helperId = (req as any).user.id;

  try {
    const alert = await SOSAlert.findById(alertId).populate(
      "user",
      "username phone pushToken"
    );
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    // Cast populated user to IUser type
    const populatedUser = alert.user as unknown as IUser;

    if (populatedUser._id.toString() === helperId)
      return res
        .status(400)
        .json({ message: "Cannot help with your own alert" });

    // Use string comparison instead of ObjectId comparison
    if (alert.helpers.some((id) => id.toString() === helperId))
      return res.status(400).json({ message: "You are already helping" });

    // Push the string ID - Mongoose will convert it
    alert.helpers.push(helperId as any);
    await alert.save();

    const helper = await User.findById(helperId, "username");
    req.app.get("io").to(populatedUser._id.toString()).emit("helper-arrived", {
      alertId: alert._id,
      helperUsername: helper?.username,
    });
    sendHelpOfferNotification(populatedUser, helper?.username || "Someone");

    res.status(200).json({
      message: "Help offer successful",
      phoneNumber: populatedUser.phone,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// CANCEL HELP
export const cancelHelp = async (req: Request, res: Response) => {
  const { alertId } = req.params;
  const helperId = (req as any).user.id;

  try {
    const alert = await SOSAlert.findById(alertId);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    const helperIndex = alert.helpers.findIndex(
      (id) => id.toString() === helperId
    );
    if (helperIndex === -1)
      return res.status(400).json({ message: "You were not helping" });

    alert.helpers.splice(helperIndex, 1);
    await alert.save();

    const helper = await User.findById(helperId, "username");
    req.app.get("io").to(alert.user.toString()).emit("helper-left", {
      alertId: alert._id,
      helperUsername: helper?.username,
    });

    res.status(200).json({ message: "You are no longer helping" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// RESOLVE SOS ALERT (Your existing code for this function can remain)
export const resolveSOSAlert = async (req: Request, res: Response) => {
  // ... your existing implementation ...
};
