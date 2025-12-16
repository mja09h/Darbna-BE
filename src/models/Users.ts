import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

// Define the interface for the User document
export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  googleId?: string;
  appleId?: string;
  authProvider: "local" | "google" | "apple";
  profilePicture: string;
  coverPicture: string;
  bio: string;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  isAdmin: boolean;
  password?: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  pushToken?: string;
  lastSOSSentAt?: Date;
  comparePassword(password: string): Promise<boolean>;
}

// Define the Mongoose Schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
      // select: false,
    },
    googleId: {
      type: String,
    },
    appleId: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    followers: {
      type: [Types.ObjectId],
      ref: "User",
      default: [],
    },
    following: {
      type: [Types.ObjectId],
      ref: "User",
      default: [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    pushToken: {
      type: String,
    },
    lastSOSSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for password hashing
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = function (
  password: string
): Promise<boolean> {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(password, this.password);
};

// 2dsphere index for location-based queries
UserSchema.index({ location: "2dsphere" });

// Export the model
export default model<IUser>("User", UserSchema);
