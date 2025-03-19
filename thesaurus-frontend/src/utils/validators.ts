// Email validation
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password validation (minimum 6 characters, at least one letter, one number)
export const isValidPassword = (password: string): boolean => {
    if (password.length < 6) return false;

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) return false;

    // Check for at least one number
    if (!/\d/.test(password)) return false;

    return true;
};

// Name validation (at least 2 characters, letters and spaces only)
export const isValidName = (name: string): boolean => {
    if (name.length < 2) return false;
    return /^[a-zA-Z\s]*$/.test(name);
};

// Form validation helpers
export const validateLoginForm = (
    email: string,
    password: string,
): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!email || !isValidEmail(email)) {
        errors.email = "Please enter a valid email address";
    }

    if (!password) {
        errors.password = "Password is required";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateRegistrationForm = (
    name: string,
    email: string,
    password: string,
): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!name || !isValidName(name)) {
        errors.name =
            "Please enter a valid name (at least 2 characters, letters only)";
    }

    if (!email || !isValidEmail(email)) {
        errors.email = "Please enter a valid email address";
    }

    if (!password || !isValidPassword(password)) {
        errors.password =
            "Password must be at least 6 characters with at least one letter and one number";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
};
