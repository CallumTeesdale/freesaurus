import {PlatformType} from "../types";

export const checkPlatform = (): PlatformType => {
    if (window.__TAURI_IPC__ !== undefined) {
        return "desktop";
    }

    if (window.Capacitor !== undefined) {
        const platform = window.Capacitor.getPlatform();
        if (platform === "ios") return "ios";
        if (platform === "android") return "android";
    }

    return "web";
};

declare global {
    interface Window {
        __TAURI_IPC__?: unknown;
        Capacitor?: {
            getPlatform: () => string;
            isNativePlatform: () => boolean;
        };
    }
}
