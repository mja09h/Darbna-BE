/**
 * Validate card number using Luhn algorithm
 */
export const validateCardNumber = (cardNumber: string): boolean => {
    if (!cardNumber) return false;

    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, "");

    // Check if it's all digits and has valid length (13-19 digits)
    if (!/^\d{13,19}$/.test(cleaned)) {
        return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * Validate expiry date
 */
export const validateExpiryDate = (month: number, year: number): boolean => {
    if (!month || !year) return false;

    // Validate month range
    if (month < 1 || month > 12) return false;

    // Validate year (should be current year or future)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Year should be 4 digits and not in the past
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    // Year shouldn't be too far in the future (e.g., 20 years)
    if (year > currentYear + 20) return false;

    return true;
};

/**
 * Validate CVV format (3-4 digits)
 */
export const validateCVV = (cvv: string): boolean => {
    if (!cvv) return false;
    return /^\d{3,4}$/.test(cvv);
};

/**
 * Detect card type from card number
 */
export const getCardType = (cardNumber: string): string => {
    if (!cardNumber) return "Unknown";

    const cleaned = cardNumber.replace(/[\s-]/g, "");

    // Visa: starts with 4
    if (/^4/.test(cleaned)) {
        return "Visa";
    }

    // Mastercard: starts with 51-55 or 2221-2720
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
        return "Mastercard";
    }

    // American Express: starts with 34 or 37
    if (/^3[47]/.test(cleaned)) {
        return "American Express";
    }

    // Discover: starts with 6011, 65, or 644-649
    if (/^6011/.test(cleaned) || /^65/.test(cleaned) || /^64[4-9]/.test(cleaned)) {
        return "Discover";
    }

    // Diners Club: starts with 300-305, 36, or 38
    if (/^3[0-5]/.test(cleaned) || /^36/.test(cleaned) || /^38/.test(cleaned)) {
        return "Diners Club";
    }

    // JCB: starts with 35
    if (/^35/.test(cleaned)) {
        return "JCB";
    }

    return "Unknown";
};

