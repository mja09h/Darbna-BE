import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import { Server } from "socket.io";
import { setupSocket } from "./socket";
import mapRouter from "./apis/map/map.route";
import connectDB from "./database";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import usersRoutes from "./apis/users/users.routes";
import authRoutes from "./apis/auth/auth.routes";
import path from "path";
import routesRoutes from "./apis/routes/routes.routes";
import pinsRoutes from "./apis/pins/pins.route";
import sosRoutes from "./apis/SOS/SOS.route";
import { startAlertExpirationJob } from "./jobs/alertExpiration";
import foldersRoutes from "./apis/folders/folders.routes";
import savedRoutesRoutes from "./apis/savedRoutes/savedRoutes.routes";
import subscriptionsRoutes from "./apis/subscriptions/subscriptions.routes";

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

// Add CORS middleware BEFORE other middleware
app.use(
  cors({
    origin: "*", // Allow all origins (or specify your React Native app's origin)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --- START: Changes from Reference Document ---
// 1. Set the Socket.IO instance on the app object for use in controllers
app.set("io", io);

// 2. Add the SOS Alert route from the guide.
// NOTE: This replaces the existing /api/sos route to align with the guide's structure.
app.use("/api/sos", sosRoutes);

// 3. Basic root route from the guide
app.get("/", (req, res) => {
  res.send("Darbna API is running...");
});

// 4. Basic Socket.IO connection handler from the guide
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
// --- END: Changes from Reference Document ---

// Existing routes from the original app.ts (excluding the replaced /api/sos)
app.use("/api/users", usersRoutes);
app.use("/api/map", mapRouter);
app.use("/api/auth", authRoutes);
// app.use("/api/sos", sosRoutes); // Replaced by sosAlertRoutes above
app.use("/api/routes", routesRoutes);
app.use("/api/pins", pinsRoutes);
app.use("/api/folders", foldersRoutes);
app.use("/api/savedRoutes", savedRoutesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";

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

    // Then setup Socket.IO (The original setupSocket call is kept for existing functionality)
    setupSocket(io);
    console.log("Socket.IO initialized");

    // ✨ NEW: START BACKGROUND JOB FOR ALERT EXPIRATION
    // This job runs periodically to check for expired SOS alerts and notify users
    startAlertExpirationJob(io);
    console.log("Alert expiration job started");
    // ✨ END: BACKGROUND JOB INITIALIZATION

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
