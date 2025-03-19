import axiosInstance from "./axiosConfig";
import {
  AuthResponse,
  LoginUserData,
  RegisterUserData,
  TokenResponse,
} from "../types/auth.types";

const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
};

export const registerUser = async (
  userData: RegisterUserData,
): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>(
      AUTH_ENDPOINTS.REGISTER,
      userData,
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: "Registration failed" };
  }
};

export const loginUser = async (
  credentials: LoginUserData,
): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>(
      AUTH_ENDPOINTS.LOGIN,
      credentials,
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: "Login failed" };
  }
};

export const refreshToken = async (): Promise<TokenResponse> => {
  try {
    const response = await axiosInstance.post<TokenResponse>(
      AUTH_ENDPOINTS.REFRESH,
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: "Token refresh failed" };
  }
};
