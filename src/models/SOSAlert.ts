// src/models/SOSAlert.ts
import { Schema, model, Document } from "mongoose";

export interface ISOSAlert extends Document {
  user: Schema.Types.ObjectId;
  location: {
    type: string;
    coordinates: [number, number];
  };
  status: "ACTIVE" | "RESOLVED";
  helpers: Schema.Types.ObjectId[]; // <-- ADDED
  resolvedAt?: Date;
  expireAt: Date; // <-- ADDED
  createdAt: Date;
}

const SOSAlertSchema = new Schema<ISOSAlert>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    status: { type: String, enum: ["ACTIVE", "RESOLVED"], default: "ACTIVE" },
    helpers: [{ type: Schema.Types.ObjectId, ref: "User" }], // <-- ADDED
    resolvedAt: { type: Date },
    expireAt: {
      // <-- ADDED
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      expires: 0, // TTL index
    },
  },
  { timestamps: true }
);

SOSAlertSchema.index({ location: "2dsphere" });
SOSAlertSchema.index({ status: 1, createdAt: -1 });

export default model<ISOSAlert>("SOSAlert", SOSAlertSchema);
