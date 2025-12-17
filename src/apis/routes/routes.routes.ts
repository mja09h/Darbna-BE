import { Router } from "express";
import { auth } from "../../middlewares/auth";
import upload from "../../middlewares/multer";
import {
  createRoute,
  getUserRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getRoutesNearLocation,
  uploadRouteImages,
  uploadRouteScreenshot,
  getPublicRoutes,
} from "./routes.controller";

const router = Router();

// All routes require authentication
// router.use(auth);

// Create a new route
router.post("/", createRoute);

// Get all routes for the current user (private routes)
router.get("/", getUserRoutes);

// Get all public routes for community page
router.get("/public", getPublicRoutes);

// Get routes near a specific location
router.get("/nearby", getRoutesNearLocation);

// Upload screenshot for a route
router.post(
  "/:routeId/screenshot",
  upload.single("screenshot"),
  uploadRouteScreenshot
);

// Upload images for a route
router.post("/:routeId/images", upload.array("images", 4), uploadRouteImages);

// Get a specific route by ID
router.get("/:id", getRouteById);

// Update a route
router.put("/:id", updateRoute);

// Delete a route
router.delete("/:id", deleteRoute);

export default router;
