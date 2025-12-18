import mongoose, { Schema, Document } from "mongoose";

export interface ISavedRoute extends Document {
  userId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  isFavorite: boolean;
  notes?: string;
  tags?: string[];
  difficulty?: "easy" | "moderate" | "hard";
  terrain?: "road" | "trail" | "mixed";
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SavedRouteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    routeId: { type: Schema.Types.ObjectId, ref: "Route", required: true },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "RouteFolder",
      required: true,
    },
    isFavorite: { type: Boolean, default: false },
    notes: { type: String },
    tags: [{ type: String }],
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
    },
    terrain: {
      type: String,
      enum: ["road", "trail", "mixed"],
    },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SavedRoute = mongoose.model<ISavedRoute>("SavedRoute", SavedRouteSchema);

export default SavedRoute;
