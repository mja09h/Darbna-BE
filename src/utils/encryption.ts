import crypto from "crypto";

// Generate a key if not provided in environment (32 bytes = 64 hex characters)
const getEncryptionKey = (): Buffer => {
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey) {
        // If it's a hex string (64 chars = 32 bytes), use it directly
        if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
            return Buffer.from(envKey, "hex");
        }
        // If it's a shorter string, pad or hash it to 32 bytes
        if (envKey.length < 64) {
            console.warn(
                "WARNING: ENCRYPTION_KEY is shorter than 64 hex characters. Using SHA-256 hash."
            );
            return crypto.createHash("sha256").update(envKey).digest();
        }
        // If longer, use first 64 hex chars
        return Buffer.from(envKey.slice(0, 64), "hex");
    }
    // Generate a key and warn (in production, this should be set in env)
    console.warn(
        "WARNING: ENCRYPTION_KEY not set in environment. Using generated key (not persistent)."
    );
    return crypto.randomBytes(32);
};

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt sensitive card data
 */
export const encryptCardData = (text: string): string => {
    if (!text) return "";

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        ENCRYPTION_KEY,
        iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
};

/**
 * Decrypt sensitive card data (for admin/internal use only)
 */
export const decryptCardData = (encryptedText: string): string => {
    if (!encryptedText) return "";

    try {
        const parts = encryptedText.split(":");
        if (parts.length !== 2) {
            throw new Error("Invalid encrypted data format");
        }

        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];

        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            ENCRYPTION_KEY,
            iv
        );

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
};

/**
 * Get last 4 digits of card number for display
 */
export const getLastFourDigits = (cardNumber: string): string => {
    if (!cardNumber) return "";
    const cleaned = cardNumber.replace(/\s+/g, "");
    return cleaned.slice(-4);
};

