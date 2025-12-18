import mongoose, { Schema, Document } from "mongoose";

export interface IRouteFolder extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  parentFolderId?: mongoose.Types.ObjectId;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RouteFolderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String },
    color: { type: String },
    parentFolderId: { type: Schema.Types.ObjectId, ref: "RouteFolder" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const RouteFolder = mongoose.model<IRouteFolder>(
  "RouteFolder",
  RouteFolderSchema
);

export default RouteFolder;
