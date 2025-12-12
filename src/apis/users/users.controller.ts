import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/Users';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = '956480809434-gc2alto3oma2clc1u8svqp0q0ondu3mo.apps.googleusercontent.com';
const APPLE_BUNDLE_ID = 'com.darbna.app';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
}

const createUser = async (req: Request, res: Response) => {
    try {
        const { name, country, username, email, password } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            name,
            country
        });

        const userResponse = user.toObject();
        delete (userResponse as any).password;

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
}

const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, country, username, email, bio, profilePicture, coverPicture, phone } = req.body;

        const updateData: Record<string, any> = {};

        if (name) updateData.name = name;
        if (country) updateData.country = country;
        if (username) updateData.username = username;
        if (email) updateData.email = email;


        if (bio !== undefined) updateData.bio = bio;

        if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
        if (coverPicture !== undefined) updateData.coverPicture = coverPicture;

        if (phone !== undefined) updateData.phone = phone;

        updateData.updatedAt = new Date();

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
}

const updatePassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
    } catch (error) {
        res.status(500).json({ message: 'Error updating password' });
    }
}

const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
}

const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error getting user by id' });
    }
}

const getUserByUsername = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error getting user by username' });
    }
}

const followUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (id === userId) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const targetUser = await User.findByIdAndUpdate(
            id,
            { $addToSet: { followers: userId } },
            { new: true }
        );

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndUpdate(userId, { $addToSet: { following: id } });

        res.status(200).json(targetUser);
    } catch (error) {
        res.status(500).json({ message: 'Error following user' });
    }
}

const unfollowUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const targetUser = await User.findByIdAndUpdate(
            id,
            { $pull: { followers: userId } },
            { new: true }
        );

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndUpdate(userId, { $pull: { following: id } });

        res.status(200).json(targetUser);
    } catch (error) {
        res.status(500).json({ message: 'Error unfollowing user' });
    }
}

const getFollowers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        res.status(200).json(user?.followers);
    } catch (error) {
        res.status(500).json({ message: 'Error getting followers' });
    }
}

const getFollowing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        res.status(200).json(user?.following);
    } catch (error) {
        res.status(500).json({ message: 'Error getting following' });
    }
}

const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error getting user profile' });
    }
}

const googleLogin = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(400).json({ message: 'Invalid Google token' });
        }

        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
            user = await User.create({
                email,
                name: name || 'User',
                username,
                profilePicture: picture,
                googleId,
                authProvider: 'google',
                country: '',
            });
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        }

        const token = jwt.sign(
            { _id: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        const userResponse = user.toObject();
        delete (userResponse as any).password;

        res.status(200).json({ token, user: userResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Google login failed' });
    }
};

const appleLogin = async (req: Request, res: Response) => {
    try {
        const { identityToken, email, fullName } = req.body;

        const appleUser = await appleSignin.verifyIdToken(identityToken, {
            audience: APPLE_BUNDLE_ID,
            ignoreExpiration: true,
        });

        const { sub: appleId, email: tokenEmail } = appleUser;
        const userEmail = email || tokenEmail;

        let user = await User.findOne({ appleId });

        if (!user && userEmail) {
            user = await User.findOne({ email: userEmail });
        }

        if (!user) {
            if (!userEmail) {
                return res.status(400).json({ message: 'Email required for sign up' });
            }

            const username = userEmail.split('@')[0] + Math.floor(Math.random() * 10000);
            const name = fullName ? `${fullName.givenName} ${fullName.familyName}` : 'User';

            user = await User.create({
                email: userEmail,
                name,
                username,
                appleId,
                authProvider: 'apple',
                country: '',
            });
        } else {
            if (!user.appleId) {
                user.appleId = appleId;
                await user.save();
            }
        }

        const token = jwt.sign(
            { _id: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        const userResponse = user.toObject();
        delete (userResponse as any).password;

        res.status(200).json({ token, user: userResponse });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Apple login failed' });
    }
}

export {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    getUserByUsername,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getUserProfile,
    updatePassword,
    googleLogin,
    appleLogin,
};