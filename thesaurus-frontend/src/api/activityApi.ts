import axiosInstance from "./axiosConfig";
import {Activity} from "../types/activity.types";

const ACTIVITY_ENDPOINTS = {
    GET_ACTIVITIES: "/api/activities",
    GET_RECENT_WORDS: "/api/activities/recent-words",
};

export const getActivities = async (
    limit: number = 50,
    offset: number = 0
): Promise<Activity[]> => {
    try {
        const response = await axiosInstance.get(ACTIVITY_ENDPOINTS.GET_ACTIVITIES, {
            params: {limit, offset},
        });
        return response.data.data;
    } catch (error: any) {
        console.error("Get activities error:", error);
        throw error.response?.data || {error: "Failed to get activity data"};
    }
};

export const getRecentWords = async (limit: number = 10): Promise<string[]> => {
    try {
        const response = await axiosInstance.get(ACTIVITY_ENDPOINTS.GET_RECENT_WORDS, {
            params: {limit},
        });
        return response.data.data;
    } catch (error: any) {
        console.error("Get recent words error:", error);
        throw error.response?.data || {error: "Failed to get recent words"};
    }
};