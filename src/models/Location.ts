import { Schema, model, Document } from "mongoose";

interface IGeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ILocation extends Document {
  userId: Schema.Types.ObjectId;
  location: IGeoJSONPoint;
  timestamp: Date;
}

export const locationSchema = new Schema<ILocation>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  timestamp: { type: Date, default: Date.now },
});

// Create a 2dsphere index for geospatial queries
locationSchema.index({ location: "2dsphere" });

export const Location = model<ILocation>("Location", locationSchema);
