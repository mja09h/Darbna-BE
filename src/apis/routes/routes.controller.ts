import { Response } from "express";
import Route from "../../models/Routes";
import { AuthRequest } from "../../types/User";

export const createRoute = async (req: AuthRequest, res: Response) => {
  try {
    console.log("=== CREATE ROUTE REQUEST ===");
    console.log("Full req.body:", JSON.stringify(req.body, null, 2));
    console.log("User ID:", req.user?._id);

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
      startPoint,
      endPoint,
    } = req.body;

    const userId = req.user?._id;

    // Detailed logging for each field
    console.log("\n=== FIELD VALIDATION ===");
    console.log("name:", name, "| type:", typeof name, "| exists:", !!name);
    console.log("path:", path, "| type:", typeof path, "| exists:", !!path);
    console.log(
      "startTime:",
      startTime,
      "| type:",
      typeof startTime,
      "| exists:",
      !!startTime
    );
    console.log(
      "points:",
      points,
      "| type:",
      typeof points,
      "| isArray:",
      Array.isArray(points),
      "| length:",
      points?.length
    );
    console.log(
      "distance:",
      distance,
      "| type:",
      typeof distance,
      "| isNumber:",
      typeof distance === "number"
    );
    console.log(
      "duration:",
      duration,
      "| type:",
      typeof duration,
      "| isNumber:",
      typeof duration === "number"
    );
    console.log("isPublic:", isPublic, "| type:", typeof isPublic);
    console.log("routeType:", routeType, "| type:", typeof routeType);
    console.log("startPoint:", startPoint, "| type:", typeof startPoint);
    console.log("endPoint:", endPoint, "| type:", typeof endPoint);

    // Validation with detailed error messages
    console.log("\n=== VALIDATION CHECKS ===");

    if (!name) {
      console.log("❌ FAILED: name is missing or falsy");
      return res.status(400).json({
        message: "Missing or invalid required fields",
        detail: "name is required",
      });
    }
    console.log("✓ name validation passed");

    if (!path) {
      console.log("❌ FAILED: path is missing or falsy");
      return res.status(400).json({
        message: "Missing or invalid required fields",
        detail: "path is required",
      });
    }
    console.log("✓ path validation passed");

    if (!startTime) {
      console.log("❌ FAILED: startTime is missing or falsy");
      return res.status(400).json({
        message: "Missing or invalid required fields",
        detail: "startTime is required",
      });
    }
    console.log("✓ startTime validation passed");

    if (!points) {
      console.log("❌ FAILED: points is missing or falsy");
      return res.status(400).json({
        message: "Missing or invalid required fields",
        detail: "points is required",
      });
    }
    console.log("✓ points validation passed");

    if (typeof distance !== "number") {
      console.log(
        "❌ FAILED: distance is not a number, received:",
        typeof distance
      );
      return res.status(400).json({
        message: "Missing or invalid required fields",
        detail: `distance must be a number, received ${typeof distance}`,
      });
    }
    console.log("✓ distance validation passed");

    if (typeof duration !== "number") {
      console.log(
        "❌ FAILED: duration is not a number, received:",
        typeof duration
      );
      return res.status(400).json({
        message: "Missing or invalid required fields",
        detail: `duration must be a number, received ${typeof duration}`,
      });
    }
    console.log("✓ duration validation passed");

    // Validate path structure
    if (!path.coordinates || !Array.isArray(path.coordinates)) {
      console.log("❌ FAILED: path.coordinates is not an array");
      return res.status(400).json({
        message: "Path coordinates must be an array",
      });
    }
    console.log("✓ path.coordinates is array");

    // Validate that LineString has at least 2 coordinates
    if (path.coordinates.length < 2) {
      console.log(
        "❌ FAILED: path.coordinates has less than 2 points, length:",
        path.coordinates.length
      );
      return res.status(400).json({
        message:
          "GeoJSON LineString must have at least 2 coordinates (vertices)",
      });
    }
    console.log("✓ path.coordinates has at least 2 points");

    // Validate each coordinate is a valid [longitude, latitude] pair
    for (let i = 0; i < path.coordinates.length; i++) {
      const coord = path.coordinates[i];
      if (
        !Array.isArray(coord) ||
        coord.length !== 2 ||
        typeof coord[0] !== "number" ||
        typeof coord[1] !== "number"
      ) {
        console.log("❌ FAILED: coordinate at index", i, "is invalid:", coord);
        return res.status(400).json({
          message:
            "Each coordinate must be an array of two numbers [longitude, latitude]",
          detail: `Coordinate at index ${i} is invalid: ${JSON.stringify(
            coord
          )}`,
        });
      }
    }
    console.log("✓ all coordinates are valid");

    // Convert isPublic to boolean - default to false (private) if not provided
    let isPublicBool: boolean;
    if (typeof isPublic === "string") {
      isPublicBool = isPublic.toLowerCase() === "true";
    } else if (typeof isPublic === "boolean") {
      isPublicBool = isPublic;
    } else if (isPublic === undefined || isPublic === null) {
      isPublicBool = false;
    } else {
      console.log(
        "❌ FAILED: isPublic must be a boolean or string 'true'/'false', received:",
        typeof isPublic,
        isPublic
      );
      return res.status(400).json({ message: "isPublic must be a boolean" });
    }
    console.log("✓ isPublic validation passed, converted to:", isPublicBool);

    if (
      !routeType ||
      !["Running", "Cycling", "Walking", "Hiking", "Other"].includes(routeType)
    ) {
      console.log(
        "❌ FAILED: Invalid route type:",
        routeType,
        "| valid types: Running, Cycling, Walking, Hiking, Other"
      );
      return res.status(400).json({
        message: "Invalid route type",
        detail: `routeType must be one of: Running, Cycling, Walking, Hiking, Other. Received: ${routeType}`,
      });
    }
    console.log("✓ routeType validation passed");

    // Description is optional, but if provided, validate it
    if (description !== undefined && description !== null) {
      const descStr = String(description);
      if (descStr.trim().length === 0) {
        console.log("❌ FAILED: Description cannot be empty if provided");
        return res.status(400).json({
          message: "Description cannot be empty if provided",
        });
      }

      if (descStr.length > 250) {
        console.log(
          "❌ FAILED: Description must not exceed 250 characters, length:",
          descStr.length
        );
        return res.status(400).json({
          message: "Description must not exceed 250 characters",
        });
      }
    }
    console.log("✓ description validation passed");

    console.log("\n=== ALL VALIDATIONS PASSED, CREATING ROUTE ===");

    // Calculate start and end points if not provided
    let calculatedStartPoint = startPoint;
    let calculatedEndPoint = endPoint;

    // If start point not provided, use first coordinate from path
    if (!calculatedStartPoint && path.coordinates.length > 0) {
      calculatedStartPoint = {
        longitude: path.coordinates[0][0],
        latitude: path.coordinates[0][1],
      };
    }

    // If end point not provided, use last coordinate from path
    if (!calculatedEndPoint && path.coordinates.length > 0) {
      calculatedEndPoint = {
        longitude: path.coordinates[path.coordinates.length - 1][0],
        latitude: path.coordinates[path.coordinates.length - 1][1],
      };
    }

    console.log("Calculated startPoint:", calculatedStartPoint);
    console.log("Calculated endPoint:", calculatedEndPoint);

    const newRoute = await Route.create({
      userId,
      name,
      description: description || undefined,
      path,
      startTime,
      points,
      distance,
      duration,
      isPublic: isPublicBool,
      routeType,
      startPoint: calculatedStartPoint,
      endPoint: calculatedEndPoint,
    });

    console.log("✓ Route created successfully, ID:", newRoute._id);
    res.status(201).json(newRoute);
  } catch (error) {
    console.log("❌ ERROR CREATING ROUTE:", error);
    console.log("Error details:", JSON.stringify(error, null, 2));
    return res.status(500).json({
      message: "Error creating route",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get all routes for a user (UPDATED: now returns both private and public)
export const getUserRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Return ALL user routes (both private and public)
    const routes = await Route.find({
      userId,
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

// Update a route (UPDATED: supports all editable fields)
export const updateRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      isPublic,
      routeType,
      difficulty,
      location,
      terrain,
      elevationGain,
      estimatedTime,
    } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Authorization check: only creator can edit
    if (route.userId.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({
        message: "Unauthorized: You can only edit your own routes",
      });
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) {
      // Convert to boolean
      if (typeof isPublic === "string") {
        updateData.isPublic = isPublic.toLowerCase() === "true";
      } else if (typeof isPublic === "boolean") {
        updateData.isPublic = isPublic;
      }
    }
    if (routeType !== undefined) {
      // Validate routeType
      if (
        !["Running", "Cycling", "Walking", "Hiking", "Other"].includes(
          routeType
        )
      ) {
        return res.status(400).json({
          message: "Invalid route type",
          detail: `routeType must be one of: Running, Cycling, Walking, Hiking, Other`,
        });
      }
      updateData.routeType = routeType;
    }
    if (difficulty !== undefined) {
      // Validate difficulty
      if (!["Easy", "Moderate", "Hard"].includes(difficulty)) {
        return res.status(400).json({
          message: "Invalid difficulty",
          detail: `difficulty must be one of: Easy, Moderate, Hard`,
        });
      }
      updateData.difficulty = difficulty;
    }
    if (location !== undefined) updateData.location = location;
    if (terrain !== undefined) {
      // Validate terrain
      if (!["road", "trail", "mixed"].includes(terrain)) {
        return res.status(400).json({
          message: "Invalid terrain",
          detail: `terrain must be one of: road, trail, mixed`,
        });
      }
      updateData.terrain = terrain;
    }
    if (elevationGain !== undefined) updateData.elevationGain = elevationGain;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;

    const updatedRoute = await Route.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      message: "Route updated successfully",
      route: updatedRoute,
    });
  } catch (error: any) {
    console.error("Error updating route:", error);
    res.status(500).json({
      message: "Error updating route",
      error: error.message,
    });
  }
};

// Delete a route
export const deleteRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (route.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your own routes",
      });
    }

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

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (route.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const currentImageCount =
      (route.images?.length || 0) + (route.screenshot ? 1 : 0);

    const uploadedFiles = req.files as Express.Multer.File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    if (currentImageCount + uploadedFiles.length > 4) {
      return res.status(400).json({
        message: `Can only upload ${
          4 - currentImageCount
        } more images (max 4 total including screenshot)`,
      });
    }

    const imageUrls = uploadedFiles.map((file) => ({
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
    }));

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

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (route.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const uploadedFile = req.file as Express.Multer.File;

    if (!uploadedFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const screenshotUrl = `/uploads/${uploadedFile.filename}`;

    const updatedRoute = await Route.findByIdAndUpdate(
      routeId,
      {
        screenshot: {
          url: screenshotUrl,
          uploadedAt: new Date(),
        },
      },
      { new: true }
    );

    res.status(200).json(updatedRoute);
  } catch (error) {
    res.status(500).json({ message: "Error uploading screenshot", error });
  }
};

// Get public routes for community page (UPDATED: populate user info)
export const getPublicRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const routes = await Route.find({ isPublic: true })
      .populate("userId", "username name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Route.countDocuments({ isPublic: true });

    // Transform to include user info in the expected format
    const transformedRoutes = routes.map((route: any) => ({
      ...route.toObject(),
      user: route.userId
        ? {
            _id: route.userId._id,
            username: route.userId.username,
            name: route.userId.name,
          }
        : undefined,
    }));

    res.status(200).json({
      routes: transformedRoutes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
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

// Get directions to a route
export const getRouteDirections = async (req: AuthRequest, res: Response) => {
  try {
    const { routeId } = req.params;
    const { userLat, userLng } = req.query;

    if (!routeId || !userLat || !userLng) {
      return res.status(400).json({
        message: "Missing required parameters: routeId, userLat, userLng",
      });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.status(200).json({
      route,
      userLocation: {
        latitude: parseFloat(userLat as string),
        longitude: parseFloat(userLng as string),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting directions", error });
  }
};
