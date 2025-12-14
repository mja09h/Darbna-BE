import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { Location } from "./models/Location";
import { ILocation } from "./models/Location";

// Define types for socket events for type safety
interface ServerToClientEvents {
  "new-location": (location: ILocation) => void;
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
  // You can add custom properties to the socket object here
}

export const setupSocket = (
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) => {
  io.on("connection", (socket: Socket) => {
    console.log(`A user connected with socket id: ${socket.id}`);

    socket.on("update-location", async (data) => {
      const { userId, longitude, latitude } = data;

      // Validate userId is a valid ObjectId string
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        socket.emit("error", { message: "Invalid userId format" });
        return;
      }

      // Just pass the string - Mongoose will convert it automatically
      const location = new Location({
        userId: userId as any, // Mongoose will handle the conversion
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      });

      try {
        const newLocation = await location.save();
        socket.broadcast.emit("new-location", newLocation);
      } catch (err) {
        console.error("Error saving location:", err);
        socket.emit("error", { message: "Failed to save location" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User with socket id ${socket.id} disconnected`);
    });
  });
};
