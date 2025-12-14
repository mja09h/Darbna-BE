import { Schema, model, Document } from "mongoose";

interface IGeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface IRoute extends Document {
  name: string;
  path: IGeoJSONLineString;
}

export const routeSchema = new Schema<IRoute>({
  name: { type: String, required: true },
  path: {
    type: {
      type: String,
      enum: ["LineString"],
      required: true,
    },
    coordinates: {
      type: [[Number]],
      required: true,
    },
  },
});

routeSchema.index({ path: "2dsphere" });

export const Route = model<IRoute>("Route", routeSchema);
