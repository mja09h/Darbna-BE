import { Response } from "express";
import { AuthRequest } from "../../types/User";
import SavedRoute from "../../models/SavedRoute";
import Route from "../../models/Routes";

// Save a route
export const saveRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { routeId, folderId, difficulty, terrain, notes, tags } = req.body;
    const userId = req.user?._id;

    if (!routeId || !folderId) {
      return res
        .status(400)
        .json({ message: "Route ID and Folder ID are required" });
    }

    // Check if route already saved
    const existingSavedRoute = await SavedRoute.findOne({
      userId,
      routeId,
      folderId,
    });

    if (existingSavedRoute) {
      return res
        .status(400)
        .json({ message: "Route already saved in this folder" });
    }

    const savedRoute = new SavedRoute({
      userId,
      routeId,
      folderId,
      difficulty,
      terrain,
      notes,
      tags,
    });

    await savedRoute.save();
    res.status(201).json({ success: true, data: savedRoute });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all saved routes for a user
export const getSavedRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const {
      folderId,
      search,
      difficulty,
      terrain,
      sort = "newest",
    } = req.query;

    let query: any = { userId };

    if (folderId) {
      query.folderId = folderId;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (terrain) {
      query.terrain = terrain;
    }

    let savedRoutes = await SavedRoute.find(query)
      .populate("routeId")
      .populate("folderId");

    // Search by route name
    if (search) {
      savedRoutes = savedRoutes.filter((sr: any) =>
        sr.routeId?.name
          ?.toLowerCase()
          .includes((search as string).toLowerCase())
      );
    }

    // Sort
    if (sort === "oldest") {
      savedRoutes.sort(
        (a: any, b: any) => a.savedAt.getTime() - b.savedAt.getTime()
      );
    } else {
      savedRoutes.sort(
        (a: any, b: any) => b.savedAt.getTime() - a.savedAt.getTime()
      );
    }

    res.status(200).json({ success: true, data: savedRoutes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get saved route by ID
export const getSavedRouteById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const savedRoute = await SavedRoute.findById(id)
      .populate("routeId")
      .populate("folderId");

    if (!savedRoute) {
      return res.status(404).json({ message: "Saved route not found" });
    }

    res.status(200).json({ success: true, data: savedRoute });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update saved route metadata
export const updateSavedRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { difficulty, terrain, notes, tags, folderId } = req.body;

    const savedRoute = await SavedRoute.findByIdAndUpdate(
      id,
      { difficulty, terrain, notes, tags, folderId },
      { new: true }
    )
      .populate("routeId")
      .populate("folderId");

    if (!savedRoute) {
      return res.status(404).json({ message: "Saved route not found" });
    }

    res.status(200).json({ success: true, data: savedRoute });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete saved route
export const deleteSavedRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const savedRoute = await SavedRoute.findByIdAndDelete(id);

    if (!savedRoute) {
      return res.status(404).json({ message: "Saved route not found" });
    }

    res.status(200).json({ success: true, message: "Saved route deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle favorite
export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const savedRoute = await SavedRoute.findById(id);

    if (!savedRoute) {
      return res.status(404).json({ message: "Saved route not found" });
    }

    savedRoute.isFavorite = !savedRoute.isFavorite;
    await savedRoute.save();

    res.status(200).json({ success: true, data: savedRoute });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
