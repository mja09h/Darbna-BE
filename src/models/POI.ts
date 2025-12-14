import { Schema, model, Document } from "mongoose";

interface IGeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface IPOI extends Document {
  name: string;
  description?: string;
  location: IGeoJSONPoint;
}

export const poiSchema = new Schema<IPOI>({
  name: { type: String, required: true },
  description: String,
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
});

poiSchema.index({ location: "2dsphere" });

export const POI = model<IPOI>("POI", poiSchema);
