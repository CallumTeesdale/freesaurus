export interface User {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface RegisterUserData {
    name: string;
    email: string;
    password: string;
}

export interface LoginUserData {
    email: string;
    password: string;
}

export interface AuthResponse {
    status: string;
    token: string;
    user: User;
}

export interface TokenResponse {
    status: string;
    token: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface TokenClaims {
    sub: string;
    iat: number;
    exp: number;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<AuthResponse>;
    register: (
        name: string,
        email: string,
        password: string,
    ) => Promise<AuthResponse>;
    logout: () => void;
    refreshToken: () => Promise<TokenResponse>;
}
