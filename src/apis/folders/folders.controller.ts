import { Response } from "express";
import { AuthRequest } from "../../types/User";
import RouteFolder from "../../models/RouteFolder";

// Create a new folder
export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color, parentFolderId } = req.body;
    const userId = req.user?._id;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = new RouteFolder({
      userId,
      name,
      description,
      color,
      parentFolderId,
    });

    await folder.save();
    res.status(201).json({ success: true, data: folder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all folders for a user
export const getFolders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const folders = await RouteFolder.find({ userId });
    res.status(200).json({ success: true, data: folders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get folder by ID
export const getFolderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const folder = await RouteFolder.findById(id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.status(200).json({ success: true, data: folder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update folder
export const updateFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const folder = await RouteFolder.findByIdAndUpdate(
      id,
      { name, description, color },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.status(200).json({ success: true, data: folder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete folder
export const deleteFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const folder = await RouteFolder.findByIdAndDelete(id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.status(200).json({ success: true, message: "Folder deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
