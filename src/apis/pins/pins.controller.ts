import { Request, Response } from "express";
import mongoose from "mongoose";
import Pin, { PIN_CATEGORIES } from "../../models/Pins";
import User from "../../models/Users";


const createPin = async (req: Request, res: Response) => {
    try {
        const { title, description, category, isPublic, userId, location, latitude, longitude } = req.body;

        if (!title || !category || !userId) {
            return res.status(400).json({ message: "Missing required fields: title, category, and userId are required" });
        }

        if (!PIN_CATEGORIES.includes(category)) {
            return res.status(400).json({
                message: "Invalid category",
                validCategories: PIN_CATEGORIES
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let locationData;
        if (location && location.coordinates) {

            locationData = {
                type: "Point",
                coordinates: location.coordinates // [longitude, latitude]
            };

        } else if (latitude !== undefined && longitude !== undefined) {

            locationData = {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)] // GeoJSON: [lng, lat]
            };

        } else {
            return res.status(400).json({ message: "Location is required. Provide either location object with coordinates or latitude and longitude" });
        }

        if (isNaN(locationData.coordinates[0]) || isNaN(locationData.coordinates[1])) {
            return res.status(400).json({ message: "Invalid location coordinates" });
        }

        // Handle multiple images (max 4)
        let imagePaths: string[] = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            if (req.files.length > 4) {
                return res.status(400).json({ message: "Maximum 4 images allowed per pin" });
            }
            imagePaths = req.files.map((file: Express.Multer.File) => `/uploads/${file.filename}`);
        }

        const newPin = new Pin({
            title,
            description: description || "",
            images: imagePaths,
            category,
            isPublic: isPublic || false,
            userId,
            location: locationData
        });

        await newPin.save();

        res.status(201).json(newPin);

    } catch (error: any) {
        console.error('Create pin error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation error", error: error.message });
        }
        res.status(500).json({ message: "Error creating pin", error: error.message });
    }
}

const getPins = async (req: Request, res: Response) => {
    try {
        const pins = await Pin.find().populate("userId", "username _id");

        if (!pins) {
            return res.status(404).json({ message: "No pins found" });
        }

        res.status(200).json(pins);
    } catch (error) {
        console.error('Get pins error:', error);
        res.status(500).json({ message: "Error getting pins", error });
    }
}

const getPinById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate that id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid pin ID format. Pin ID must be a valid MongoDB ObjectId."
            });
        }

        const pin = await Pin.findById(id).populate("userId", "username _id");

        if (!pin) {
            return res.status(404).json({ message: "Pin not found" });
        }

        res.status(200).json(pin);
    } catch (error) {
        console.error('Get pin by id error:', error);
        res.status(500).json({ message: "Error getting pin by id", error });
    }
}

const updatePin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate that id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid pin ID format. Pin ID must be a valid MongoDB ObjectId."
            });
        }

        const { title, description, category, isPublic, userId, location, latitude, longitude, images } = req.body;

        const updateData: any = {};

        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description || "";
        if (category) {
            if (!PIN_CATEGORIES.includes(category)) {
                return res.status(400).json({
                    message: "Invalid category",
                    validCategories: PIN_CATEGORIES
                });
            }
            updateData.category = category;
        }
        if (isPublic !== undefined) updateData.isPublic = isPublic;
        if (userId) updateData.userId = userId;

        // Handle multiple images (max 4)
        // If images array is provided in body, use it (allows clearing images with empty array)
        if (images !== undefined && Array.isArray(images)) {
            if (images.length > 4) {
                return res.status(400).json({ message: "Maximum 4 images allowed per pin" });
            }
            updateData.images = images;
        } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            // If files are uploaded, use them
            if (req.files.length > 4) {
                return res.status(400).json({ message: "Maximum 4 images allowed per pin" });
            }
            updateData.images = req.files.map((file: Express.Multer.File) => `/uploads/${file.filename}`);
        }

        if (location || (latitude !== undefined && longitude !== undefined)) {
            let locationData;
            if (location && location.coordinates) {
                locationData = {
                    type: "Point",
                    coordinates: location.coordinates
                };
            } else if (latitude !== undefined && longitude !== undefined) {
                locationData = {
                    type: "Point",
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                };
            }
            if (locationData) {
                if (isNaN(locationData.coordinates[0]) || isNaN(locationData.coordinates[1])) {
                    return res.status(400).json({ message: "Invalid location coordinates" });
                }
                updateData.location = locationData;
            }
        }

        const pin = await Pin.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!pin) {
            return res.status(404).json({ message: "Pin not found" });
        }

        res.status(200).json(pin);
    } catch (error: any) {
        console.error('Update pin error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation error", error: error.message });
        }
        res.status(500).json({ message: "Error updating pin", error: error.message });
    }
}

const deletePin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate that id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid pin ID format. Pin ID must be a valid MongoDB ObjectId."
            });
        }

        const pin = await Pin.findByIdAndDelete(id);

        if (!pin) {
            return res.status(404).json({ message: "Pin not found" });
        }

        res.status(200).json({ message: "Pin deleted successfully" });
    } catch (error) {
        console.error('Delete pin error:', error);
        res.status(500).json({ message: "Error deleting pin", error });
    }
}

const getPinsByUserId = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Validate that userId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID format. User ID must be a valid MongoDB ObjectId."
            });
        }

        const pins = await Pin.find({ userId }).populate("userId", "username _id");

        if (!pins || pins.length === 0) {
            return res.status(404).json({ message: "No pins found for this user" });
        }

        res.status(200).json(pins);
    } catch (error) {
        console.error('Get pins by user id error:', error);
        res.status(500).json({ message: "Error getting pins by user id", error });
    }
}

const getPinsByCategory = async (req: Request, res: Response) => {
    try {
        const { category } = req.params;
        const pins = await Pin.find({ category }).populate("userId", "username _id");

        if (!pins) {
            return res.status(404).json({ message: "No pins found" });
        }

        res.status(200).json(pins);
    } catch (error) {
        console.error('Get pins by category error:', error);
        res.status(500).json({ message: "Error getting pins by category", error });
    }
}

const getPinsByTitle = async (req: Request, res: Response) => {
    try {
        const { title } = req.params;
        const pins = await Pin.find({ title }).populate("userId", "username _id");

        if (!pins) {
            return res.status(404).json({ message: "No pins found" });
        }

        res.status(200).json(pins);
    } catch (error) {
        console.error('Get pins by title error:', error);
        res.status(500).json({ message: "Error getting pins by title", error });
    }
}

const getCategories = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ categories: PIN_CATEGORIES });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: "Error getting categories", error });
    }
}

export { createPin, getPins, getPinById, updatePin, deletePin, getPinsByUserId, getPinsByCategory, getPinsByTitle, getCategories };
