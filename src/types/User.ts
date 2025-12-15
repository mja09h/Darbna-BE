import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  pushToken?: string;
  comparePassword(password: string): Promise<boolean>;
}

export interface AuthRequest extends Request {
    user?: IUser;
}