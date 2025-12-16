// src/services/pushNotifications.ts
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import User from "./models/Users";
import SOSAlert from "./models/SOSAlert";
import { ISOSAlert } from "./models/SOSAlert";

// Create a new Expo client. You should do this only once in your app.
const expo = new Expo();

export const sendSosAlertToAllUsers = async (alert: ISOSAlert) => {
  console.log("Preparing to send push notifications for new alert...");

  try {
    // 1. Find all users who have a push token, excluding the user who sent the alert.
    const usersWithPushTokens = await User.find({
      pushToken: { $exists: true, $ne: null },
      _id: { $ne: alert.user }, // Exclude the sender
    });

    if (usersWithPushTokens.length === 0) {
      console.log(
        "No users with push tokens found. Skipping push notifications."
      );
      return;
    }

    // 2. Create the notification messages to send.
    const messages: ExpoPushMessage[] = [];
    for (const user of usersWithPushTokens) {
      // Ensure the token is a valid Expo push token.
      if (!Expo.isExpoPushToken(user.pushToken!)) {
        console.error(
          `Push token ${user.pushToken} is not a valid Expo push token`
        );
        continue;
      }

      messages.push({
        to: user.pushToken!,
        sound: "default", // Use a default notification sound
        title: "🚨 New SOS Alert",
        body: `${(alert.user as any).username} has sent an emergency alert!`,
        data: { alertId: alert._id.toString() }, // Pass the alert ID to the app
        badge: 1, // Set the app icon badge number
      });
    }

    // 3. The Expo push notification service has a limit of 100 messages per request.
    // We chunk the messages into arrays of 100 to send them in batches.
    const chunks = expo.chunkPushNotifications(messages);
    console.log(
      `Sending ${messages.length} notifications in ${chunks.length} chunk(s).`
    );

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("Push notification tickets received:", ticketChunk);
        // You can save these tickets to a database to check for errors later.
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }
  } catch (error) {
    console.error("Error in sendSosAlertToAllUsers service:", error);
  }
};

export const sendHelpOfferNotification = async (
  user: any,
  helperUsername: string
) => {
  console.log("Preparing to send help offer notification...");

  try {
    if (!user.pushToken) {
      console.log("User has no push token. Skipping notification.");
      return;
    }

    // Ensure the token is a valid Expo push token.
    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(
        `Push token ${user.pushToken} is not a valid Expo push token`
      );
      return;
    }

    const message: ExpoPushMessage = {
      to: user.pushToken,
      sound: "default",
      title: "✅ Help is on the way!",
      body: `${helperUsername} is offering to help you`,
      badge: 1,
    };

    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log("Help offer notification ticket received:", ticket);
  } catch (error) {
    console.error("Error in sendHelpOfferNotification service:", error);
  }
};

// ✨ NEW: Send notification when an SOS alert expires after 2 hours
export const sendAlertExpiredNotification = async (sosSender: any) => {
  console.log("Preparing to send alert expired notification...");

  try {
    if (!sosSender.pushToken) {
      console.log("User has no push token. Skipping notification.");
      return;
    }

    // Ensure the token is a valid Expo push token.
    if (!Expo.isExpoPushToken(sosSender.pushToken)) {
      console.error(
        `Push token ${sosSender.pushToken} is not a valid Expo push token`
      );
      return;
    }

    const message: ExpoPushMessage = {
      to: sosSender.pushToken,
      sound: "default",
      title: "⏰ SOS Alert Expired",
      body: "Your SOS alert has expired after 2 hours.",
      badge: 1,
    };

    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log("Alert expired notification ticket received:", ticket);
  } catch (error) {
    console.error("Error in sendAlertExpiredNotification service:", error);
  }
};
