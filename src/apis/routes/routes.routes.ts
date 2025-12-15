import { Router } from "express";
import { auth } from "../../middlewares/auth";
import {
  createRoute,
  getUserRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getRoutesNearLocation,
} from "./routes.controller";

const router = Router();

// All routes require authentication
router.use(auth);

// Create a new route
router.post("/", createRoute);

// Get all routes for the current user
router.get("/", getUserRoutes);

// Get routes near a specific location
router.get("/nearby", getRoutesNearLocation);

// Get a specific route by ID
router.get("/:id", getRouteById);

// Update a route
router.put("/:id", updateRoute);

// Delete a route
router.delete("/:id", deleteRoute);

export default router;
