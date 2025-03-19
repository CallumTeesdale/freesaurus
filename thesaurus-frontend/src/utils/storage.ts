import {User} from "../types";
import {checkPlatform} from "./platform";

const TOKEN_KEY = "freesaurus_token";
const USER_KEY = "freesaurus_user";

export const getStoredToken = (): string | null => {
    const platform = checkPlatform();

    if (platform === "desktop") {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error("Failed to get token from secure storage:", error);
            return null;
        }
    } else {
        return localStorage.getItem(TOKEN_KEY);
    }
};

export const setStoredToken = (token: string | null): void => {
    const platform = checkPlatform();

    if (token === null) {
        localStorage.removeItem(TOKEN_KEY);
        return;
    }

    if (platform === "desktop") {
        try {
            localStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            console.error("Failed to store token in secure storage:", error);
        }
    } else {
        localStorage.setItem(TOKEN_KEY, token);
    }
};

export const getStoredUser = (): User | null => {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
        return JSON.parse(userJson) as User;
    } catch (error) {
        console.error("Failed to parse stored user:", error);
        return null;
    }
};

export const setStoredUser = (user: User | null): void => {
    if (user === null) {
        localStorage.removeItem(USER_KEY);
        return;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredData = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};
