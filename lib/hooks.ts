"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./api";

// Generic fetch hook
export function useApi<T>(path: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(path);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Mutation hook (POST/PUT/DELETE)
export function useMutation<T = any>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST"
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (body?: any): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(path, method, body);
      return result;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
