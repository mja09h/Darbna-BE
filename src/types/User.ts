import { Request } from 'express';

export interface UserType {
    _id: string;
    username: string;
    email: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AuthRequest extends Request {
    user?: UserType;
}