import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket";
import mapRouter from "./apis/map/map.route";
import connectDB from "./database";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import usersRoutes from "./apis/users/users.routes";

import path from "path";

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, "../.env") });

// Add unhandled error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "localhost";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", usersRoutes);
app.use("/api/map", mapRouter);
app.use(notFound);
app.use(errorHandler);

// Initialize Socket.IO and database, then start server
const startServer = async () => {
  try {
    console.log("Starting server...");
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

    // Check if MONGO_URI exists before attempting connection
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    // Connect to database FIRST
    await connectDB();
    console.log("Database connected successfully");
    
    // Then setup Socket.IO
    setupSocket(io);
    console.log("Socket.IO initialized");

    // Finally start the server
    server.listen(Number(PORT), HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
      console.log(`Socket.IO is running on ws://${HOST}:${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
};

startServer();
