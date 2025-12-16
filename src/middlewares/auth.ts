import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/Users";
import dotenv from "dotenv";
import { AuthRequest } from "../types/User";
import mongoose from "mongoose";
import { IUser } from "../types/User";

dotenv.config();

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mreq = req as AuthRequest;
    const header = mreq.header("authorization");
    const [scheme, token] = header?.split(" ") || [];

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    mreq.user = {
      _id: payload._id as unknown as mongoose.Types.ObjectId,
      username: payload.username as string,
      email: payload.email as string,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      comparePassword: async () => false,
    } as unknown as IUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export { auth, auth as authMiddleware };
