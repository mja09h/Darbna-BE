import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcrypt";

// Define the interface for the User document
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  googleId?: string;
  authProvider: "local" | "google";
  profilePicture: string;
  coverPicture: string;
  bio: string;
  isAdmin: boolean;
  password?: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  pushToken?: string;
  lastSOSSentAt?: Date;
  isVerified?: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordResetCode?: string;
  passwordResetCodeExpires?: Date;
  subscriptionPlan?: "free" | "premium";
  subscriptionStatus?: "active" | "cancelled";
  cardInfo?: {
    cardNumber: string; // encrypted
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string; // encrypted
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    cardType: string;
    lastFourDigits: string; // for display purposes
  };
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
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
      required: true,
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
    authProvider: {
      type: String,
      enum: ["local", "google"],
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    passwordResetCode: {
      type: String,
    },
    passwordResetCodeExpires: {
      type: Date,
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    cardInfo: {
      cardNumber: {
        type: String,
      },
      cardHolderName: {
        type: String,
      },
      expiryMonth: {
        type: Number,
      },
      expiryYear: {
        type: Number,
      },
      cvv: {
        type: String,
      },
      billingAddress: {
        street: {
          type: String,
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        zip: {
          type: String,
        },
        country: {
          type: String,
        },
      },
      cardType: {
        type: String,
      },
      lastFourDigits: {
        type: String,
      },
    },
    subscriptionStartDate: {
      type: Date,
    },
    subscriptionEndDate: {
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
