import mongoose from "mongoose";

// Predefined categories for pins - Remote/Outdoor/Nature locations
export const PIN_CATEGORIES = [
    "mountain",
    "desert",
    "valley",
    "canyon",
    "cave",
    "waterfall",
    "lake",
    "river",
    "spring",
    "oasis",
    "forest",
    "trail",
    "campsite",
    "viewpoint",
    "rock_formation",
    "wildlife_area",
    "emergency_shelter",
    "landmark",
    "other"
] as const;

export type PinCategory = typeof PIN_CATEGORIES[number];

const pinSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    images: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        enum: PIN_CATEGORIES,
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
}, {
    timestamps: true
});

// Create a 2dsphere index for geospatial queries
pinSchema.index({ location: "2dsphere" });

const Pin = mongoose.model('Pin', pinSchema);

export default Pin;