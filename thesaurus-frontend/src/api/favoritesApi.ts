import axiosInstance from "./axiosConfig";

const FAVORITES_ENDPOINTS = {
    GET_FAVORITES: "/api/favorites",
    ADD_FAVORITE: "/api/favorites",
    REMOVE_FAVORITE: "/api/favorites/:word",
};

export interface Favorite {
    id: string;
    word: string;
    created_at: string;
}

export const getFavorites = async (): Promise<Favorite[]> => {
    try {
        const response = await axiosInstance.get<Favorite[]>(FAVORITES_ENDPOINTS.GET_FAVORITES);
        return response.data;
    } catch (error: any) {
        console.error("Get favorites error:", error);
        throw error.response?.data || {error: "Failed to get favorites"};
    }
};

export const addFavorite = async (word: string): Promise<void> => {
    try {
        await axiosInstance.post(FAVORITES_ENDPOINTS.ADD_FAVORITE, {word});
    } catch (error: any) {
        console.error("Add favorite error:", error);
        throw error.response?.data || {error: "Failed to add favorite"};
    }
};

export const removeFavorite = async (word: string): Promise<void> => {
    try {
        const url = FAVORITES_ENDPOINTS.REMOVE_FAVORITE.replace(':word', encodeURIComponent(word));
        await axiosInstance.delete(url);
    } catch (error: any) {
        console.error("Remove favorite error:", error);
        throw error.response?.data || {error: "Failed to remove favorite"};
    }
};