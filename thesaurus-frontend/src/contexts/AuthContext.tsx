import { createContext, ReactNode, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { notifications } from "@mantine/notifications";

import {
  loginUser as apiLoginUser,
  refreshToken as apiRefreshToken,
  registerUser as apiRegisterUser,
} from "../api/authApi";

import {
  AuthContextType,
  AuthResponse,
  TokenClaims,
  TokenResponse,
  User,
} from "../types";

import {
  clearStoredData,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from "../utils/storage";

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => ({ status: "", token: "", user: {} as User }),
  register: async () => ({ status: "", token: "", user: {} as User }),
  logout: () => {},
  refreshToken: async () => ({ status: "", token: "" }),
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const decodedToken = jwtDecode<TokenClaims>(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          try {
            const refreshResult = await apiRefreshToken();

            setStoredToken(refreshResult.token);

            const storedUser = getStoredUser();
            if (storedUser) {
              setUser(storedUser);
            }
          } catch (refreshError) {
            clearStoredData();
            setUser(null);
            setError("Session expired. Please login again.");
          }
        } else {
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      } catch (decodeError) {
        clearStoredData();
        setUser(null);
        setError("Authentication error. Please login again.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      clearStoredData();
      setUser(null);
      setError(null);
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiLoginUser({ email, password });

      setStoredToken(result.token);
      setStoredUser(result.user);

      setUser(result.user);

      notifications.show({
        title: "Login Successful",
        message: `Welcome back, ${result.user.name}!`,
        color: "green",
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      const errorMessage =
        err.error || "Login failed. Please check your credentials.";
      setError(errorMessage);
      notifications.show({
        title: "Login Failed",
        message: errorMessage,
        color: "red",
      });

      setIsLoading(false);
      throw err;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRegisterUser({ name, email, password });

      setStoredToken(result.token);
      setStoredUser(result.user);

      setUser(result.user);

      notifications.show({
        title: "Registration Successful",
        message: `Welcome, ${result.user.name}!`,
        color: "green",
      });

      setIsLoading(false);
      return result;
    } catch (err: any) {
      const errorMessage =
        err.error || "Registration failed. Please try again.";
      setError(errorMessage);

      notifications.show({
        title: "Registration Failed",
        message: errorMessage,
        color: "red",
      });

      setIsLoading(false);
      throw err;
    }
  };

  const logout = (): void => {
    clearStoredData();

    setUser(null);
    setError(null);

    notifications.show({
      title: "Logged Out",
      message: "You have been successfully logged out.",
      color: "blue",
    });

    window.dispatchEvent(new CustomEvent("auth:logout"));
  };

  const refreshToken = async (): Promise<TokenResponse> => {
    try {
      const result = await apiRefreshToken();

      setStoredToken(result.token);

      return result;
    } catch (err) {
      logout();
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
