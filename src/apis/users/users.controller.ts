import e, { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../../models/Users";
import appleSignin from "apple-signin-auth";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../types/User";

const APPLE_BUNDLE_ID = "com.darbna.app.v";

const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", success: false });
  }
};

const register = async (req: Request, res: Response) => {
  try {
    const { name, country, username, email, password } = req.body;

    if (!name || !username || !email || !password || !country) {
      return res
        .status(400)
        .json({ message: "Missing required fields", success: false });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
        success: false,
      });
    }

    // Let the User model's pre-save hook handle password hashing
    const user = await User.create({
      username,
      email,
      password: password, // Pass plain password, pre-save hook will hash it
      name,
      country,
    });

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(201).json({ success: true, token, user: userResponse });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", success: false });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Missing identifier or password", success: false });
    }

    let user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", success: false });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Invalid login method. Please use your social account.",
        success: false,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(
        "Password comparison failed for user:",
        user.email || user.username
      );
      return res
        .status(400)
        .json({ message: "Invalid password", success: false });
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({ success: true, token, user: userResponse });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", success: false });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, country, bio, phone, profilePicture } = req.body;
    const authReq = req as AuthRequest;
    console.log("req.body", req.body);

    // Verify user is updating their own profile
    if (authReq.user?._id?.toString() !== id) {
      return res.status(403).json({
        message: "You can only update your own profile",
        success: false,
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (req.file) {
      console.log("req.file", req.file);
      user.profilePicture = `/uploads/${req.file.filename}`;
    } else {
      console.log("profilePicture not found");
      delete (user as any).profilePicture;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { ...req.body, profilePicture: user.profilePicture } },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Error updating user", success: false });
  }
};

const updatePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    const authReq = req as AuthRequest;

    // Verify user is updating their own password
    if (authReq.user?._id?.toString() !== id) {
      return res.status(403).json({
        message: "You can only update your own password",
        success: false,
      });
    }

    if (!newPassword) {
      return res
        .status(400)
        .json({ message: "New password is required", success: false });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // If user has a password, verify old password
    if (user.password) {
      if (!oldPassword) {
        return res
          .status(400)
          .json({ message: "Old password is required", success: false });
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ message: "Invalid old password", success: false });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json({ message: "Password updated successfully", success: true });
  } catch (error) {
    console.error("Update password error:", error);
    res
      .status(500)
      .json({ message: "Error updating password", success: false });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    // Verify user is deleting their own account
    if (authReq.user?._id?.toString() !== id) {
      return res.status(403).json({
        message: "You can only delete your own account",
        success: false,
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Error deleting user", success: false });
  }
};

const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting user by id", success: false });
  }
};

const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Get user by username error:", error);
    res
      .status(500)
      .json({ message: "Error getting user by username", success: false });
  }
};

const followUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    if (id === userId) {
      return res
        .status(400)
        .json({ message: "You cannot follow yourself", success: false });
    }

    const targetUser = await User.findByIdAndUpdate(
      id,
      { $addToSet: { followers: userId } },
      { new: true }
    );

    if (!targetUser) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { following: id } });

    res.status(200).json({ success: true, data: targetUser });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ message: "Error following user", success: false });
  }
};

const unfollowUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const targetUser = await User.findByIdAndUpdate(
      id,
      { $pull: { followers: userId } },
      { new: true }
    );

    if (!targetUser) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    await User.findByIdAndUpdate(userId, { $pull: { following: id } });

    res.status(200).json({ success: true, data: targetUser });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: "Error unfollowing user", success: false });
  }
};

const getFollowers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json({ success: true, data: user?.followers });
  } catch (error) {
    console.error("Error getting followers:", error);
    res
      .status(500)
      .json({ message: "Error getting followers", success: false });
  }
};

const getFollowing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json({ success: true, data: user?.following });
  } catch (error) {
    console.error("Error getting following:", error);
    res
      .status(500)
      .json({ message: "Error getting following", success: false });
  }
};

const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res
      .status(500)
      .json({ message: "Error getting user profile", success: false });
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
        return res
          .status(400)
          .json({ message: "Email required for sign up", success: false });
      }

      const username =
        userEmail.split("@")[0] + Math.floor(Math.random() * 10000);
      const name = fullName
        ? `${fullName.givenName} ${fullName.familyName}`
        : "User";

      user = await User.create({
        email: userEmail,
        name,
        username,
        appleId,
        authProvider: "apple",
        country: "",
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
      { expiresIn: "30d" }
    );

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({ success: true, token, user: userResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Apple login failed", success: false });
  }
};

export {
  getUsers,
  register,
  login,
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
  appleLogin,
};
