import { Request, Response } from "express";
import User from "../../models/Users";
import { AuthRequest } from "../../types/User";
import {
    validateCardNumber,
    validateExpiryDate,
    validateCVV,
    getCardType,
} from "../../utils/cardValidation";
import { encryptCardData, getLastFourDigits } from "../../utils/encryption";

/**
 * Get current user's subscription status
 */
export const getSubscriptionStatus = async (
    req: Request,
    res: Response
) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
            });
        }

        const user = await User.findById(userId).select(
            "subscriptionPlan subscriptionStatus cardInfo subscriptionStartDate subscriptionEndDate"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Prepare response with masked card info
        const response: any = {
            subscriptionPlan: user.subscriptionPlan || "free",
            subscriptionStatus: user.subscriptionStatus || "active",
            subscriptionStartDate: user.subscriptionStartDate,
            subscriptionEndDate: user.subscriptionEndDate,
        };

        // Include card info if it exists (for all users, Free and Premium)
        if (user.cardInfo) {
            response.cardInfo = {
                cardHolderName: user.cardInfo.cardHolderName,
                expiryMonth: user.cardInfo.expiryMonth,
                expiryYear: user.cardInfo.expiryYear,
                lastFourDigits: user.cardInfo.lastFourDigits,
                cardType: user.cardInfo.cardType,
                billingAddress: user.cardInfo.billingAddress,
            };
        }

        res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error("Get subscription status error:", error);
        res.status(500).json({
            message: "Error fetching subscription status",
            success: false,
        });
    }
};

/**
 * Get current user's payment information
 */
export const getPaymentInfo = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
            });
        }

        const user = await User.findById(userId).select("cardInfo");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Return card info if it exists, otherwise return null
        if (user.cardInfo) {
            res.status(200).json({
                success: true,
                data: {
                    cardInfo: {
                        cardHolderName: user.cardInfo.cardHolderName,
                        expiryMonth: user.cardInfo.expiryMonth,
                        expiryYear: user.cardInfo.expiryYear,
                        lastFourDigits: user.cardInfo.lastFourDigits,
                        cardType: user.cardInfo.cardType,
                        billingAddress: user.cardInfo.billingAddress,
                    },
                },
            });
        } else {
            res.status(200).json({
                success: true,
                data: {
                    cardInfo: null,
                },
            });
        }
    } catch (error) {
        console.error("Get payment info error:", error);
        res.status(500).json({
            message: "Error fetching payment information",
            success: false,
        });
    }
};

/**
 * Upgrade user to Premium plan with card information
 */
export const upgradeToPremium = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
            });
        }

        const {
            cardNumber,
            cardHolderName,
            expiryMonth,
            expiryYear,
            cvv,
            billingAddress,
        } = req.body;

        // Validate required fields
        if (
            !cardNumber ||
            !cardHolderName ||
            !expiryMonth ||
            !expiryYear ||
            !cvv ||
            !billingAddress
        ) {
            return res.status(400).json({
                message:
                    "Missing required fields: cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, and billingAddress are required",
                success: false,
            });
        }

        // Validate billing address fields
        if (
            !billingAddress.street ||
            !billingAddress.city ||
            !billingAddress.state ||
            !billingAddress.zip ||
            !billingAddress.country
        ) {
            return res.status(400).json({
                message:
                    "Missing required billing address fields: street, city, state, zip, and country are required",
                success: false,
            });
        }

        // Validate card number
        if (!validateCardNumber(cardNumber)) {
            return res.status(400).json({
                message: "Invalid card number",
                success: false,
            });
        }

        // Validate expiry date
        if (!validateExpiryDate(expiryMonth, expiryYear)) {
            return res.status(400).json({
                message: "Invalid or expired card expiry date",
                success: false,
            });
        }

        // Validate CVV
        if (!validateCVV(cvv)) {
            return res.status(400).json({
                message: "Invalid CVV. CVV must be 3-4 digits",
                success: false,
            });
        }

        // Get card type
        const cardType = getCardType(cardNumber);

        // Encrypt sensitive data
        const encryptedCardNumber = encryptCardData(cardNumber);
        const encryptedCVV = encryptCardData(cvv);
        const lastFourDigits = getLastFourDigits(cardNumber);

        // Find user and update
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email address before upgrading to Premium",
                success: false,
            });
        }

        // Update subscription
        user.subscriptionPlan = "premium";
        user.subscriptionStatus = "active";
        user.subscriptionStartDate = new Date();
        user.cardInfo = {
            cardNumber: encryptedCardNumber,
            cardHolderName: cardHolderName.trim(),
            expiryMonth: parseInt(expiryMonth, 10),
            expiryYear: parseInt(expiryYear, 10),
            cvv: encryptedCVV,
            billingAddress: {
                street: billingAddress.street.trim(),
                city: billingAddress.city.trim(),
                state: billingAddress.state.trim(),
                zip: billingAddress.zip.trim(),
                country: billingAddress.country.trim(),
            },
            cardType,
            lastFourDigits,
        };

        await user.save();

        // Prepare response (don't send encrypted data - only safe fields)
        res.status(200).json({
            success: true,
            message: "Successfully upgraded to Premium plan",
            data: {
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionStartDate: user.subscriptionStartDate,
                cardInfo: {
                    cardHolderName: user.cardInfo.cardHolderName,
                    expiryMonth: user.cardInfo.expiryMonth,
                    expiryYear: user.cardInfo.expiryYear,
                    lastFourDigits: user.cardInfo.lastFourDigits,
                    cardType: user.cardInfo.cardType,
                    billingAddress: user.cardInfo.billingAddress,
                },
            },
        });
    } catch (error) {
        console.error("Upgrade to premium error:", error);
        res.status(500).json({
            message: "Error upgrading to Premium plan",
            success: false,
        });
    }
};

/**
 * Downgrade user to Free plan
 */
export const downgradeToFree = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Update subscription
        user.subscriptionPlan = "free";
        user.subscriptionStatus = "active";
        // Keep card info for potential future use, but mark as free
        // Optionally, you can clear cardInfo here if needed:
        // user.cardInfo = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Successfully downgraded to Free plan",
            data: {
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStatus: user.subscriptionStatus,
            },
        });
    } catch (error) {
        console.error("Downgrade to free error:", error);
        res.status(500).json({
            message: "Error downgrading to Free plan",
            success: false,
        });
    }
};

/**
 * Update card information for Premium users
 */
export const updateCardInfo = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
            });
        }

        const {
            cardNumber,
            cardHolderName,
            expiryMonth,
            expiryYear,
            cvv,
            billingAddress,
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email address before adding payment information",
                success: false,
            });
        }

        // Validate required fields
        if (
            !cardNumber ||
            !cardHolderName ||
            !expiryMonth ||
            !expiryYear ||
            !cvv ||
            !billingAddress
        ) {
            return res.status(400).json({
                message:
                    "Missing required fields: cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, and billingAddress are required",
                success: false,
            });
        }

        // Validate billing address fields
        if (
            !billingAddress.street ||
            !billingAddress.city ||
            !billingAddress.state ||
            !billingAddress.zip ||
            !billingAddress.country
        ) {
            return res.status(400).json({
                message:
                    "Missing required billing address fields: street, city, state, zip, and country are required",
                success: false,
            });
        }

        // Validate card number
        if (!validateCardNumber(cardNumber)) {
            return res.status(400).json({
                message: "Invalid card number",
                success: false,
            });
        }

        // Validate expiry date
        if (!validateExpiryDate(expiryMonth, expiryYear)) {
            return res.status(400).json({
                message: "Invalid or expired card expiry date",
                success: false,
            });
        }

        // Validate CVV
        if (!validateCVV(cvv)) {
            return res.status(400).json({
                message: "Invalid CVV. CVV must be 3-4 digits",
                success: false,
            });
        }

        // Get card type
        const cardType = getCardType(cardNumber);

        // Encrypt sensitive data
        const encryptedCardNumber = encryptCardData(cardNumber);
        const encryptedCVV = encryptCardData(cvv);
        const lastFourDigits = getLastFourDigits(cardNumber);

        // Update card info
        user.cardInfo = {
            cardNumber: encryptedCardNumber,
            cardHolderName: cardHolderName.trim(),
            expiryMonth: parseInt(expiryMonth, 10),
            expiryYear: parseInt(expiryYear, 10),
            cvv: encryptedCVV,
            billingAddress: {
                street: billingAddress.street.trim(),
                city: billingAddress.city.trim(),
                state: billingAddress.state.trim(),
                zip: billingAddress.zip.trim(),
                country: billingAddress.country.trim(),
            },
            cardType,
            lastFourDigits,
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: "Card information updated successfully",
            data: {
                cardInfo: {
                    cardHolderName: user.cardInfo.cardHolderName,
                    expiryMonth: user.cardInfo.expiryMonth,
                    expiryYear: user.cardInfo.expiryYear,
                    lastFourDigits: user.cardInfo.lastFourDigits,
                    cardType: user.cardInfo.cardType,
                    billingAddress: user.cardInfo.billingAddress,
                },
            },
        });
    } catch (error) {
        console.error("Update card info error:", error);
        res.status(500).json({
            message: "Error updating card information",
            success: false,
        });
    }
};

/**
 * Delete card information for the current user
 */
export const deleteCardInfo = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email address before managing payment information",
                success: false,
            });
        }

        // Check if user has card info
        if (!user.cardInfo) {
            return res.status(400).json({
                message: "No card information found to delete",
                success: false,
            });
        }

        // Clear card info
        user.cardInfo = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Card information deleted successfully",
        });
    } catch (error) {
        console.error("Delete card info error:", error);
        res.status(500).json({
            message: "Error deleting card information",
            success: false,
        });
    }
};

