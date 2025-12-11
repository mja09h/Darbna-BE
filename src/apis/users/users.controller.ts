import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/Users';

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
        const { name, country, username, email, password, bio, profilePicture, coverPicture, phone } = req.body;

        const updateData: Record<string, any> = {};
        if (name) updateData.name = name;
        if (country) updateData.country = country;
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
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

};