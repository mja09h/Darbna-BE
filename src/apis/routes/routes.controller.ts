import { Response } from "express";
import Route from "../../models/Routes";
import { AuthRequest } from "../../types/User";

export const createRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, path, startTime, points } = req.body;
    const userId = req.user?._id;

    if (!name || !path || !startTime || !points) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newRoute = await Route.create({
      userId,
      name,
      description,
      path,
      startTime,
      points,
    });

    res.status(201).json(newRoute);
  } catch (error) {
    res.status(500).json({ message: "Error creating route", error });
  }
};

// Get all routes for a user
export const getUserRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const routes = await Route.find({ userId });
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
