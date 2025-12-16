import mongoose, { Schema, Document } from "mongoose";

export interface IPoint extends Document {
  latitude: number;
  longitude: number;
  timestamp: Date;
  elevation?: number;
  speed?: number;
}

export interface IRoute extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  path: {
    type: "LineString";
    coordinates: [number, number][];
  };
  startTime: Date;
  endTime?: Date;
  distance: number;
  duration: number;
  points: IPoint[];

  // NEW FIELDS
  isPublic: boolean;
  routeType: string;
  screenshot?: {
    url: string;
    uploadedAt: Date;
  };
  images?: Array<{
    url: string;
    uploadedAt: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const pointSchema: Schema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  elevation: { type: Number },
  speed: { type: Number },
});

const routeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    path: {
      type: {
        type: String,
        enum: ["LineString"],
        required: true,
      },
      coordinates: {
        type: [[Number]], // Array of [longitude, latitude] pairs
        required: true,
      },
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    distance: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    points: [pointSchema],
    isPublic: { type: Boolean, default: false },
    routeType: {
      type: String,
      enum: ["Running", "Cycling", "Walking", "Hiking", "Other"],
      required: true,
    },
    screenshot: {
      url: { type: String },
      uploadedAt: { type: Date },
    },
    images: [
      {
        url: { type: String },
        uploadedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

routeSchema.index({ path: "2dsphere" });

const Route = mongoose.model<IRoute>("Route", routeSchema);

export default Route;
