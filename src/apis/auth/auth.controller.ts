import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../../models/Users';
import sendEmail from '../../utils/email';

/**
 * @desc    Request password reset code (6-Digit Code)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required', success: false });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // Don't reveal if user exists or not (security best practice)
        // Always return success message to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                message: 'If an account with that email exists, a password reset code has been sent.',
                success: true
            });
        }

        // Check if user has a password (not social login only)
        if (!user.password) {
            return res.status(200).json({
                message: 'If an account with that email exists, a password reset code has been sent.',
                success: true
            });
        }

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash code before storing
        const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

        // Store hashed code and expiry (10 minutes)
        user.passwordResetCode = hashedCode;
        user.passwordResetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Email content
        const message = `You requested a password reset for your Darbna account.\n\n` +
            `Your password reset code is: ${resetCode}\n\n` +
            `This code will expire in 10 minutes.\n\n` +
            `If you did not request this password reset, please ignore this email.\n\n` +
            `For security reasons, never share this code with anyone.`;

        const htmlMessage = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset Code - Darbna</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #2c120c 0%, #4a2418 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                            Hello,
                                        </p>
                                        <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                            You requested a password reset for your Darbna account. Use the code below to reset your password:
                                        </p>
                                        
                                        <!-- Code Box -->
                                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px dashed #2c120c; border-radius: 12px; padding: 30px 20px; text-align: center; margin: 30px 0;">
                                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                                            <p style="margin: 0; font-size: 42px; font-weight: 700; color: #2c120c; letter-spacing: 8px; font-family: 'Courier New', monospace;">${resetCode}</p>
                                        </div>
                                        
                                        <!-- Info Box -->
                                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 4px;">
                                            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                                                <strong>⏱ Important:</strong> This code will expire in <strong>10 minutes</strong>. Please use it promptly.
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 30px 0 0 0; color: #777777; font-size: 14px; line-height: 1.6;">
                                            If you did not request this password reset, please ignore this email. Your account remains secure.
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
                subject: 'Password Reset Code - Darbna',
                message,
                html: htmlMessage,
            });

            res.status(200).json({
                message: 'If an account with that email exists, a password reset code has been sent.',
                success: true
            });
        } catch (emailError) {
            console.error('Email send error:', emailError);
            // Still return success to prevent email enumeration
            res.status(200).json({
                message: 'If an account with that email exists, a password reset code has been sent.',
                success: true
            });
        }
    } catch (error) {
        console.error('Forgot password code error:', error);
        res.status(500).json({ message: 'Error processing password reset request', success: false });
    }
};

/**
 * @desc    Reset password with code (6-Digit Code)
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({
                message: 'Email, code, and new password are required',
                success: false
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find user by email
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired reset code',
                success: false
            });
        }

        // Hash the provided code to compare with stored hash
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

        // Verify code matches and hasn't expired
        if (
            !user.passwordResetCode ||
            user.passwordResetCode !== hashedCode ||
            !user.passwordResetCodeExpires ||
            user.passwordResetCodeExpires < new Date()
        ) {
            return res.status(400).json({
                message: 'Invalid or expired reset code',
                success: false
            });
        }

        // Update password (pre-save hook will handle hashing)
        user.password = newPassword;

        // Clear reset code fields
        user.passwordResetCode = undefined;
        user.passwordResetCodeExpires = undefined;

        await user.save();

        res.status(200).json({
            message: 'Password reset successfully',
            success: true
        });
    } catch (error) {
        console.error('Reset password with code error:', error);
        res.status(500).json({ message: 'Error resetting password', success: false });
    }
};

