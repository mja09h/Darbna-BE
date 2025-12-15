// src/models/SOSAlert.ts
import { Schema, model, Document } from "mongoose";

export interface ISOSAlert extends Document {
  user: Schema.Types.ObjectId; // Reference to the User who sent it
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: "ACTIVE" | "RESOLVED";
  resolvedAt?: Date;
  createdAt: Date;
}

const SOSAlertSchema = new Schema<ISOSAlert>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // This links the alert to a user
      required: true,
    },
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
    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED"],
      default: "ACTIVE",
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt

// Add indexes for faster queries
SOSAlertSchema.index({ location: "2dsphere" });
SOSAlertSchema.index({ status: 1, createdAt: -1 });

export default model<ISOSAlert>("SOSAlert", SOSAlertSchema);
