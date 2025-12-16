import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Location } from "./models/Location";
import { ILocation } from "./models/Location";

// Define types for socket events for type safety
interface ServerToClientEvents {
  "new-location": (location: ILocation) => void;
  error: (error: { message: string }) => void;
}

interface ClientToServerEvents {
  "update-location": (data: {
    userId: string;
    longitude: number;
    latitude: number;
  }) => void;
}

interface InterServerEvents {}

interface SocketData {
  userId?: string;
}

// ✨ MODIFIED: Extended Socket interface to include userId from authentication
interface SocketWithAuth extends Socket {
  userId?: string;
}

export const setupSocket = (io: Server) => {
  // ✨ TEMPORARILY DISABLED: Authentication middleware - verify JWT token on connection
  // io.use((socket: SocketWithAuth, next) => {
  //   const token = socket.handshake.auth.token;

  //   // Check if token exists
  //   if (!token) {
  //     return next(new Error("Authentication error: No token provided"));
  //   }

  //   try {
  //     // Verify JWT token and extract userId
  //     const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
  //       userId: string;
  //     };

  //     // Attach userId to socket for later use
  //     socket.userId = decoded.userId;
  //     next();
  //   } catch (err) {
  //     return next(new Error("Invalid token: Authentication failed"));
  //   }
  // });

  // TEMPORARY: Allow all connections without authentication
  io.use((socket: SocketWithAuth, next) => {
    // Set a dummy userId for testing (you can use a test user ID)
    socket.userId = "test-user-id"; // Replace with an actual user ID from your database for testing
    next();
  });

  io.on("connection", (socket: SocketWithAuth) => {
    // ✨ MODIFIED: Added authentication check and private room joining
    if (socket.userId) {
      // Join user to their private room using userId
      socket.join(socket.userId);
      console.log(
        `✓ User ${socket.userId} authenticated and joined their private room.`
      );
    } else {
      console.warn("⚠ Socket connected without userId");
    }

    socket.on("update-location", async (data) => {
      const { userId, longitude, latitude } = data;

      // ✨ MODIFIED: Verify that the userId matches the authenticated user
      if (userId !== socket.userId) {
        socket.emit("error", {
          message: "Unauthorized: userId does not match authenticated user",
        });
        return;
      }

      // Validate userId is a valid ObjectId string
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        socket.emit("error", { message: "Invalid userId format" });
        return;
      }

      // Just pass the string - Mongoose will handle the conversion
      const location = new Location({
        userId: userId as any, // Mongoose will handle the conversion
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      });

      try {
        const newLocation = await location.save();

        // ✨ MODIFIED: Emit to the user's private room instead of broadcast
        // This ensures only the specific user receives their location update
        // For SOS notifications, emit to the user's private room
        if (socket.userId) {
          io.to(socket.userId).emit("new-location", newLocation);
        }

        console.log(
          `✓ Location updated for user ${userId} and sent to their private room`
        );
      } catch (err) {
        console.error("Error saving location:", err);
        socket.emit("error", { message: "Failed to save location" });
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `✓ User ${socket.userId} with socket id ${socket.id} disconnected`
      );
    });
  });
};
