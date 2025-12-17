import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../models/Users';

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required', success: false });
        }

        const user = await User.findOne({ email });

        // Don't reveal if user exists or not (security best practice)
        // Always return success message to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                message: 'If an account with that email exists, a password reset link has been sent.',
                success: true
            });
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = jwt.sign(
            { _id: user._id, email: user.email, type: 'password-reset' },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        // In a production app, you would send this token via email
        // For now, we'll return it in the response (frontend should handle email sending)
        // TODO: Implement email service to send reset link

        res.status(200).json({
            message: 'If an account with that email exists, a password reset link has been sent.',
            success: true,
            resetToken // Remove this in production - only for development/testing
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing password reset request', success: false });
    }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required', success: false });
        }

        // Verify reset token
        let payload: any;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;

            // Verify token is a password reset token
            if (payload.type !== 'password-reset') {
                return res.status(400).json({ message: 'Invalid token type', success: false });
            }
        } catch (error) {
            return res.status(400).json({ message: 'Invalid or expired token', success: false });
        }

        // Find user
        const user = await User.findById(payload._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully',
            success: true
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password', success: false });
    }
};

