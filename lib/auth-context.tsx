"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch, getToken, removeToken, setToken } from "./api";

interface User {
  id: string | number;
  username: string;
  email: string;
  full_name?: string;
  display_name?: string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

const normalizeUser = (raw: any): User | null => {
  if (!raw) return null;

  return {
    id: raw.id ?? "",
    username: raw.username ?? "",
    email: raw.email ?? "",
    full_name: raw.full_name ?? raw.display_name ?? raw.name ?? "",
    display_name: raw.display_name ?? raw.full_name ?? raw.name ?? "",
    avatar:
      raw.avatar ??
      raw.avatar_url ??
      raw.profile_image ??
      raw.profile_pic ??
      "",
    avatar_url:
      raw.avatar_url ??
      raw.avatar ??
      raw.profile_image ??
      raw.profile_pic ??
      "",
    bio: raw.bio ?? "",
    role: raw.role ?? "",
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await apiFetch("/user/profile/me");
      const rawUser =
        response?.data ??
        response?.user ??
        response?.profile ??
        response;

      setUser(normalizeUser(rawUser));
    } catch (error) {
      console.error("fetchUser error:", error);
      setUser(null);
      removeToken();
      setTokenState(null);
    }
  };

  useEffect(() => {
    const storedToken = getToken();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setTokenState(storedToken);
    fetchUser().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiFetch("/auth/login", "POST", {
      email,
      password,
    });

    const accessToken =
      response?.data?.access_token ??
      response?.access_token ??
      response?.token ??
      null;

    if (!accessToken) {
      throw new Error("Access token not found");
    }

    setToken(accessToken);
    setTokenState(accessToken);
    await fetchUser();
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setTokenState(null);

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);