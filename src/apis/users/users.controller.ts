import e, { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../../models/Users";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../types/User";
import sendEmail from "../../utils/email";



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
        const { name, username, email, password, phone } = req.body;

        if (!name || !username || !email || !password || !phone) {
            return res
                .status(400)
                .json({ message: "Missing required fields: name, username, email, and password are required", success: false });
        }

        if (!/^\d+$/.test(phone)) {
            return res
                .status(400)
                .json({ message: "Phone number must contain only digits", success: false });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.trim();

        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({
                message: "User with this email already exists",
                success: false,
            });
        }

        const existingUsername = await User.findOne({ username: normalizedUsername });
        if (existingUsername) {
            return res.status(400).json({
                message: "User with this username already exists",
                success: false,
            });
        }

        // Let the User model's pre-save hook handle password hashing

        const user = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: password, // Pass plain password, pre-save hook will hash it
            name,
            phone,
            isVerified: false
        });

        // Send welcome email (don't block registration if email fails)
        try {
            const message = `Welcome to Darbna, ${name}!\n\n` +
                `Thank you for joining our community. We're excited to have you on board!\n\n` +
                `To get started, please verify your email address by following these steps:\n\n` +
                `1. Go to profile\n` +
                `2. Tap the gear icon in the right corner\n` +
                `3. Click Account Information\n` +
                `4. Click Email\n` +
                `5. Click Verify Email\n\n` +
                `If you have any questions, feel free to reach out to our support team.\n\n` +
                `Welcome aboard!\n` +
                `The Darbna Team`;

            const htmlMessage = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Darbna</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px 0;">
                        <tr>
                            <td align="center" style="padding: 20px 0;">
                                <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #2c120c 0%, #4a2418 100%); padding: 50px 30px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Darbna!</h1>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; line-height: 1.6; font-weight: 600;">
                                                Hello ${name}! 👋
                                            </p>
                                            <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                                Thank you for joining Darbna! We're thrilled to have you as part of our community. You're now ready to explore and connect with fellow adventurers.
                                            </p>
                                            
                                            <!-- Verification Section -->
                                            <div style="background-color: #f8f9fa; border-left: 4px solid #2c120c; padding: 25px 20px; margin: 30px 0; border-radius: 8px;">
                                                <h2 style="margin: 0 0 15px 0; color: #2c120c; font-size: 20px; font-weight: 600;">
                                                    📧 Verify Your Email Address
                                                </h2>
                                                <p style="margin: 0 0 20px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                                                    To get started and ensure your account security, please verify your email address by following these simple steps:
                                                </p>
                                                
                                                <!-- Steps -->
                                                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 15px;">
                                                    <div style="margin-bottom: 15px; padding-left: 10px;">
                                                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.8;">
                                                            <strong style="color: #2c120c;">Step 1:</strong> Go to your <strong>Profile</strong>
                                                        </p>
                                                    </div>
                                                    <div style="margin-bottom: 15px; padding-left: 10px;">
                                                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.8;">
                                                            <strong style="color: #2c120c;">Step 2:</strong> Tap the <strong>⚙️ gear icon</strong> in the right corner
                                                        </p>
                                                    </div>
                                                    <div style="margin-bottom: 15px; padding-left: 10px;">
                                                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.8;">
                                                            <strong style="color: #2c120c;">Step 3:</strong> Click <strong>Account Information</strong>
                                                        </p>
                                                    </div>
                                                    <div style="margin-bottom: 15px; padding-left: 10px;">
                                                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.8;">
                                                            <strong style="color: #2c120c;">Step 4:</strong> Click <strong>Email</strong>
                                                        </p>
                                                    </div>
                                                    <div style="margin-bottom: 0; padding-left: 10px;">
                                                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.8;">
                                                            <strong style="color: #2c120c;">Step 5:</strong> Click <strong>Verify Email</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <p style="margin: 30px 0 0 0; color: #777777; font-size: 14px; line-height: 1.6;">
                                                Once verified, you'll have full access to all Darbna features and can start sharing your adventures with the community!
                                            </p>
                                            
                                            <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                If you have any questions or need assistance, our support team is here to help.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 30px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                            <p style="margin: 0 0 10px 0; color: #2c120c; font-size: 16px; font-weight: 600;">
                                                Welcome aboard! 🎉
                                            </p>
                                            <p style="margin: 0 0 15px 0; color: #999999; font-size: 12px;">
                                                © ${new Date().getFullYear()} Darbna. All rights reserved.
                                            </p>
                                            <p style="margin: 0; color: #bbbbbb; font-size: 11px;">
                                                This is an automated email. Please do not reply.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `;

            await sendEmail({
                email: user.email,
                subject: 'Welcome to Darbna! 🎉',
                message,
                html: htmlMessage,
            });
        } catch (emailError) {
            // Log error but don't fail registration
            console.error('Welcome email send error:', emailError);
        }

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

        /* 
        // Optional: Enforce email verification before login
        if (!user.isVerified) {
             return res.status(401).json({ message: 'Please verify your email to log in', success: false });
        }
        */

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
        const { name, country, bio, profilePicture } = req.body;
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

const updateUsername = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username, password } = req.body;

        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Missing username or password", success: false });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password as string);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password", success: false });
        }

        user.username = username;
        await user.save();

        res.status(200).json({ message: "Username updated successfully", success: true });
    } catch (error) {
        console.error("Update username error:", error);
        res.status(500).json({ message: "Error updating username", success: false });
    }
};

const updateEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Missing email or password", success: false });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Invalid email address", success: false });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password as string);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password", success: false });
        }

        user.email = email;
        await user.save();

        user.isVerified = false;
        await user.save();

        res.status(200).json({ message: "Email updated successfully", success: true });
    } catch (error) {
        console.error("Update email error:", error);
        res.status(500).json({ message: "Error updating email", success: false });
    }
};

const updatePhone = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { phone, password } = req.body;


        if (!phone || !password) {
            return res
                .status(400)
                .json({ message: "Missing phone or password", success: false });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password as string);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password", success: false });
        }

        if (!/^\d+$/.test(phone)) {
            return res.status(400).json({ message: "Phone number must contain only digits", success: false });
        }

        user.phone = phone;
        await user.save();

        res.status(200).json({ message: "Phone updated successfully", success: true });
    } catch (error) {
        console.error("Update phone error:", error);
        res.status(500).json({ message: "Error updating phone", success: false });
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


const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: "Email and code are required", success: false });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified", success: false });
        }

        if (
            !user.verificationCode ||
            user.verificationCode !== code ||
            !user.verificationCodeExpires ||
            user.verificationCodeExpires < new Date()
        ) {
            return res.status(400).json({ message: "Invalid or expired verification code", success: false });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully", success: true });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: "Error verifying email", success: false });
    }
};

const requestVerificationCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required", success: false });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified", success: false });
        }

        // Generate 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        const message = `Your verification code is: ${verificationCode}\n\n` +
            `This code will expire in 10 minutes.\n` +
            `If you did not request this, please ignore this email.\n`;

        const htmlMessage = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification Code - Darbna</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #2c120c 0%, #4a2418 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Verify Your Email</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                            Hello ${user.name || 'there'},
                                        </p>
                                        <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                            Thank you for signing up for Darbna! To complete your registration and verify your email address, please use the verification code below:
                                        </p>
                                        
                                        <!-- Code Box -->
                                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px dashed #2c120c; border-radius: 12px; padding: 30px 20px; text-align: center; margin: 30px 0;">
                                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                                            <p style="margin: 0; font-size: 42px; font-weight: 700; color: #2c120c; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</p>
                                        </div>
                                        
                                        <!-- Info Box -->
                                        <div style="background-color: #d1ecf1; border-left: 4px solid #0dcaf0; padding: 15px 20px; margin: 30px 0; border-radius: 4px;">
                                            <p style="margin: 0; color: #055160; font-size: 14px; line-height: 1.5;">
                                                <strong>⏱ Important:</strong> This code will expire in <strong>10 minutes</strong>. Please verify your email promptly.
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 30px 0 0 0; color: #777777; font-size: 14px; line-height: 1.6;">
                                            If you did not create an account with Darbna, please ignore this email.
                                        </p>
                                        
                                        <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                            <strong>Security Tip:</strong> Never share this code with anyone. Darbna staff will never ask for your verification code.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                                            © ${new Date().getFullYear()} Darbna. All rights reserved.
                                        </p>
                                        <p style="margin: 0; color: #bbbbbb; font-size: 11px;">
                                            This is an automated email. Please do not reply.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Account Verification Code - Darbna',
                message,
                html: htmlMessage,
            });
            res.status(200).json({ message: "Verification code sent", success: true });
        } catch (error) {
            console.error('Email send error:', error);
            res.status(500).json({ message: "Error sending verification email", success: false });
        }

    } catch (error) {
        console.error('Request verification code error:', error);
        res.status(500).json({ message: "Error requesting verification code", success: false });
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
    updateUsername,
    updateEmail,
    updatePhone,
    verifyEmail,
    requestVerificationCode,
};
