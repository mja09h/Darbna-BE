import { Response } from "express";
import Route from "../../models/Routes";
import { AuthRequest } from "../../types/User";

export const createRoute = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      path,
      startTime,
      points,
      distance,
      duration,
      isPublic,
      routeType,
    } = req.body;
    const userId = req.user?._id;

    // Validation
    if (
      !name ||
      !path ||
      !startTime ||
      !points ||
      typeof distance !== "number" ||
      typeof duration !== "number"
    ) {
      return res
        .status(400)
        .json({ message: "Missing or invalid required fields" });
    }

    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ message: "isPublic must be a boolean" });
    }

    if (
      !routeType ||
      !["Running", "Cycling", "Walking", "Hiking", "Other"].includes(routeType)
    ) {
      return res.status(400).json({ message: "Invalid route type" });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ message: "Description is required" });
    }

    if (description.length > 250) {
      return res
        .status(400)
        .json({ message: "Description must not exceed 250 characters" });
    }

    const newRoute = await Route.create({
      userId,
      name,
      description,
      path,
      startTime,
      points,
      distance,
      duration,
      isPublic,
      routeType,
    });

    res.status(201).json(newRoute);
  } catch (error) {
    res.status(500).json({ message: "Error creating route", error });
  }
};

// Get all routes for a user (private routes only)
export const getUserRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const routes = await Route.find({ userId, isPublic: false }).sort({
      createdAt: -1,
    });
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching routes", error });
  }
};

// Get a single route by ID
export const getRouteById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.status(200).json(route);
  } catch (error) {
    res.status(500).json({ message: "Error fetching route", error });
  }
};

// Update a route with new points
export const updateRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, path, endTime, distance, duration, points } =
      req.body;

    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Verify user ownership
    if (route.userId.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedRoute = await Route.findByIdAndUpdate(
      id,
      {
        name,
        description,
        path,
        endTime,
        distance,
        duration,
        $push: { points: { $each: points } },
      },
      { new: true }
    );

    res.status(200).json(updatedRoute);
  } catch (error) {
    res.status(500).json({ message: "Error updating route", error });
  }
};

// Delete a route
export const deleteRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Verify user ownership
    if (route.userId.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Route.findByIdAndDelete(id);

    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting route", error });
  }
};

// Get routes near a location (geospatial query)
export const getRoutesNearLocation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ message: "Missing longitude or latitude" });
    }

    const routes = await Route.find({
      path: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              parseFloat(longitude as string),
              parseFloat(latitude as string),
            ],
          },
          $maxDistance: parseInt(maxDistance as string),
        },
      },
    });

    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching nearby routes", error });
  }
};

// Upload images for a route
export const uploadRouteImages = async (req: AuthRequest, res: Response) => {
  try {
    const { routeId } = req.params;
    const userId = req.user?._id;

    // Find the route
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Verify ownership
    if (route.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check current image count (including screenshot)
    const currentImageCount =
      (route.images?.length || 0) + (route.screenshot ? 1 : 0);

    // Files are uploaded via multer middleware
    const uploadedFiles = req.files as Express.Multer.File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Check total doesn't exceed 4 (including screenshot)
    if (currentImageCount + uploadedFiles.length > 4) {
      return res.status(400).json({
        message: `Can only upload ${
          4 - currentImageCount
        } more images (max 4 total including screenshot)`,
      });
    }

    // Process uploaded files and get URLs
    const imageUrls = uploadedFiles.map((file) => ({
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
    }));

    // Update route with new images
    const updatedRoute = await Route.findByIdAndUpdate(
      routeId,
      {
        $push: { images: { $each: imageUrls } },
      },
      { new: true }
    );

    res.status(200).json(updatedRoute);
  } catch (error) {
    res.status(500).json({ message: "Error uploading images", error });
  }
};

// Upload screenshot for a route
export const uploadRouteScreenshot = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { routeId } = req.params;
    const userId = req.user?._id;

    // Find the route
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Verify ownership
    if (route.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get uploaded file
    const file = req.file as Express.Multer.File;
    if (!file) {
      return res.status(400).json({ message: "No screenshot provided" });
    }

    // Create screenshot object
    const screenshotData = {
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
    };

    // Update route with screenshot
    const updatedRoute = await Route.findByIdAndUpdate(
      routeId,
      {
        screenshot: screenshotData,
      },
      { new: true }
    );

    res.status(200).json(updatedRoute);
  } catch (error) {
    res.status(500).json({ message: "Error uploading screenshot", error });
  }
};

// Get all public routes for community page
export const getPublicRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const routes = await Route.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("userId", "name profilePicture"); // Populate user info

    const total = await Route.countDocuments({ isPublic: true });

    res.status(200).json({
      routes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching public routes", error });
  }
};
