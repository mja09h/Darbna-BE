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
    console.log("req.body", req.body.isPublic);
    //Validation
    if (
      !name ||
      !path ||
      !startTime ||
      !points ||
      typeof distance !== "number" ||
      typeof duration !== "number"
    ) {
      console.log("Missing or invalid required fields");
      return res
        .status(400)
        .json({ message: "Missing or invalid required fields" });
    }

    // Validate path structure
    if (!path.coordinates || !Array.isArray(path.coordinates)) {
      return res
        .status(400)
        .json({ message: "Path coordinates must be an array" });
    }

    // Validate that LineString has at least 2 coordinates
    if (path.coordinates.length < 2) {
      return res.status(400).json({
        message:
          "GeoJSON LineString must have at least 2 coordinates (vertices)",
      });
    }

    // Validate each coordinate is a valid [longitude, latitude] pair
    for (const coord of path.coordinates) {
      if (
        !Array.isArray(coord) ||
        coord.length !== 2 ||
        typeof coord[0] !== "number" ||
        typeof coord[1] !== "number"
      ) {
        return res.status(400).json({
          message:
            "Each coordinate must be an array of two numbers [longitude, latitude]",
        });
      }
    }

    // Convert isPublic to boolean - default to false (private) if not provided
    let isPublicBool: boolean;
    if (typeof isPublic === "string") {
      isPublicBool = isPublic.toLowerCase() === "true";
    } else if (typeof isPublic === "boolean") {
      isPublicBool = isPublic;
    } else if (isPublic === undefined || isPublic === null) {
      // Default to false (private) if not provided
      isPublicBool = false;
    } else {
      console.log(
        "isPublic must be a boolean or string 'true'/'false', received:",
        typeof isPublic,
        isPublic
      );
      return res.status(400).json({ message: "isPublic must be a boolean" });
    }

    if (
      !routeType ||
      !["Running", "Cycling", "Walking", "Hiking", "Other"].includes(routeType)
    ) {
      console.log("Invalid route type");
      return res.status(400).json({ message: "Invalid route type" });
    }

    // Description is optional, but if provided, validate it
    if (description !== undefined && description !== null) {
      const descStr = String(description);
      if (descStr.trim().length === 0) {
        console.log("Description cannot be empty if provided");
        return res
          .status(400)
          .json({ message: "Description cannot be empty if provided" });
      }

      if (descStr.length > 250) {
        console.log("Description must not exceed 250 characters");
        return res
          .status(400)
          .json({ message: "Description must not exceed 250 characters" });
      }
    }

    const newRoute = await Route.create({
      userId,
      name,
      description: description || undefined, // Only include if provided
      path,
      startTime,
      points,
      distance,
      duration,
      isPublic: isPublicBool,
      routeType,
    });

    res.status(201).json(newRoute);
  } catch (error) {
    console.log("Error creating route", error);
    return res.status(500).json({ message: "Error creating route", error });
  }
};

// Get all routes for a user (private routes only)
export const getUserRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch only private routes for this user
    const routes = await Route.find({
      userId,
      isPublic: false,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(routes);
  } catch (error: any) {
    console.error("Error fetching user routes:", error);
    res.status(500).json({
      message: "Error fetching routes",
      error: error.message,
    });
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
    const userId = req.user?._id;

    // Validate route ID format
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find the route
    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Verify user ownership - CRITICAL SECURITY CHECK
    if (route.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your own routes",
      });
    }

    // Delete the route
    await Route.findByIdAndDelete(id);

    res.status(200).json({
      message: "Route deleted successfully",
      deletedRouteId: id,
    });
  } catch (error: any) {
    console.error("Error deleting route:", error);
    res.status(500).json({
      message: "Error deleting route",
      error: error.message,
    });
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
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string) || 10)
    );
    const skip = (pageNum - 1) * limitNum;

    // Only fetch public routes
    const routes = await Route.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("userId", "name profilePicture"); // Populate user info

    const total = await Route.countDocuments({ isPublic: true });
    const pages = Math.ceil(total / limitNum);

    // Validate page number
    if (pageNum > pages && total > 0) {
      return res.status(400).json({
        message: `Page ${pageNum} does not exist. Total pages: ${pages}`,
      });
    }

    res.status(200).json({
      routes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: pages,
      },
    });
  } catch (error: any) {
    console.error("Error fetching public routes:", error);
    res.status(500).json({
      message: "Error fetching public routes",
      error: error.message,
    });
  }
};

// Get directions to a route's starting point
export const getRouteDirections = async (req: AuthRequest, res: Response) => {
  try {
    const { routeId } = req.params;
    const { userLat, userLng } = req.query;

    // Validate parameters
    if (!routeId || routeId.length !== 24) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    if (!userLat || !userLng) {
      return res.status(400).json({
        message: "User location (userLat, userLng) is required",
      });
    }

    // Find the route
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Validate route has coordinates
    if (!route.path.coordinates || route.path.coordinates.length === 0) {
      return res.status(400).json({
        message: "Route has no coordinates",
      });
    }

    // Get the first point of the route as destination
    const [destLng, destLat] = route.path.coordinates[0];

    // Get the last point as well
    const [endLng, endLat] =
      route.path.coordinates[route.path.coordinates.length - 1];

    // Calculate simple distance using Haversine formula
    const distance = calculateHaversineDistance(
      parseFloat(userLat as string),
      parseFloat(userLng as string),
      destLat,
      destLng
    );

    // Return directions data
    res.status(200).json({
      route: {
        _id: route._id,
        name: route.name,
        description: route.description,
        distance: route.distance,
        duration: route.duration,
      },
      startPoint: {
        latitude: destLat,
        longitude: destLng,
      },
      endPoint: {
        latitude: endLat,
        longitude: endLng,
      },
      distanceFromUser: distance,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=walking`,
      appleMapsUrl: `https://maps.apple.com/?saddr=${userLat},${userLng}&daddr=${destLat},${destLng}`,
    });
  } catch (error: any) {
    console.error("Error getting directions:", error);
    res.status(500).json({
      message: "Error getting directions",
      error: error.message,
    });
  }
};

// Helper function to calculate distance between two points (Haversine formula)
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
