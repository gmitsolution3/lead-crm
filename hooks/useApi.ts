"use client";

import { apiClient } from "@/lib/axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { AxiosRequestConfig } from "axios";

/**
 * Helper to normalize query keys regardless of /api prefix or trailing slashes
 */
function normalizeKey(url: string): string {
  return url.replace(/\/$/, "") || "/";
}

/**
 * Resolves axios configuration. If url starts with /api/, uses current origin (Next.js route).
 */
function resolveConfig(url: string, userConfig?: AxiosRequestConfig): AxiosRequestConfig {
  if (url.startsWith("/api/")) {
    return { baseURL: "", ...userConfig };
  }
  return userConfig || {};
}

/**
 * 1. useFetch: Hook to fetch list or resource data with caching & revalidation.
 * Example:
 * const { data, isLoading, isError, error, refetch } = useFetch("/leads");
 * const { data } = useFetch("/leads", { status: "active" }, { enabled: !!user });
 */
export function useFetch<TData = any>(
  url: string,
  params?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<TData, Error, TData, QueryKey>,
    "queryKey" | "queryFn"
  >,
  axiosConfig?: AxiosRequestConfig,
) {
  const cleanUrl = normalizeKey(url);
  const queryKey: QueryKey = params ? [cleanUrl, params] : [cleanUrl];

  const query = useQuery<TData, Error, TData, QueryKey>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<TData>(url, {
        params,
        ...resolveConfig(url, axiosConfig),
      });
      return response.data;
    },
    ...options,
  });

  return {
    ...query,
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 2. useFetchById: Hook to fetch a single entity by its identifier.
 * Example:
 * const { data, isLoading, refetch } = useFetchById("/leads", leadId);
 */
export function useFetchById<TData = any>(
  url: string,
  id: string | number | null | undefined,
  options?: Omit<
    UseQueryOptions<TData, Error, TData, QueryKey>,
    "queryKey" | "queryFn"
  >,
  axiosConfig?: AxiosRequestConfig,
) {
  const cleanUrl = normalizeKey(url);
  const queryKey: QueryKey = [cleanUrl, id];

  const query = useQuery<TData, Error, TData, QueryKey>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<TData>(
        `${cleanUrl}/${id}`,
        resolveConfig(cleanUrl, axiosConfig),
      );
      return response.data;
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
    ...options,
  });

  return {
    ...query,
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export interface MutationCustomOptions {
  /**
   * Additional query keys to invalidate on successful mutation.
   * By default, the base URL query key is invalidated automatically.
   */
  invalidateQueries?: QueryKey[] | boolean;
}

/**
 * 3. usePost: Hook to create / post new data.
 * Automatically invalidates the matching cache query key on success.
 * Example:
 * const { mutate, mutateAsync, isLoading, isPending } = usePost("/leads");
 * mutate({ name: "Acme Corp" });
 */
export function usePost<TData = any, TVariables = any>(
  url: string,
  options?: UseMutationOptions<TData, Error, TVariables, unknown> &
    MutationCustomOptions,
  axiosConfig?: AxiosRequestConfig,
) {
  const queryClient = useQueryClient();
  const cleanUrl = normalizeKey(url);

  const mutation = useMutation<TData, Error, TVariables, unknown>({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.post<TData>(
        url,
        variables,
        resolveConfig(url, axiosConfig),
      );
      return response.data;
    },
    onSuccess: (...args) => {
      if (options?.invalidateQueries !== false) {
        queryClient.invalidateQueries({ queryKey: [cleanUrl] });

        if (Array.isArray(options?.invalidateQueries)) {
          options.invalidateQueries.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      }

      if (options?.onSuccess) {
        (options.onSuccess as (...a: any[]) => any)(...args);
      }
    },
    ...options,
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
}

/**
 * 4. usePatch: Hook to partially update data.
 * Supports updating url directly, or passing { id, data } to update `${url}/${id}`.
 * Example:
 * const { mutate: updateLead } = usePatch("/leads");
 * updateLead({ id: "123", data: { status: "contacted" } });
 * // or direct payload:
 * const { mutate: updateProfile } = usePatch("/user/profile");
 * updateProfile({ name: "New Name" });
 */
export function usePatch<TData = any, TVariables = any>(
  url: string,
  options?: UseMutationOptions<TData, Error, TVariables, unknown> &
    MutationCustomOptions,
  axiosConfig?: AxiosRequestConfig,
) {
  const queryClient = useQueryClient();
  const cleanUrl = normalizeKey(url);

  const mutation = useMutation<TData, Error, TVariables, unknown>({
    mutationFn: async (variables: any) => {
      if (
        variables &&
        typeof variables === "object" &&
        "id" in variables &&
        "data" in variables &&
        (typeof variables.id === "string" ||
          typeof variables.id === "number")
      ) {
        const endpoint = `${cleanUrl}/${variables.id}`;
        const response = await apiClient.patch<TData>(
          endpoint,
          variables.data,
          resolveConfig(endpoint, axiosConfig),
        );
        return response.data;
      }

      const response = await apiClient.patch<TData>(
        url,
        variables,
        resolveConfig(url, axiosConfig),
      );
      return response.data;
    },
    onSuccess: (...args) => {
      const [, variables] = args;
      if (options?.invalidateQueries !== false) {
        queryClient.invalidateQueries({ queryKey: [cleanUrl] });

        if (
          variables &&
          typeof variables === "object" &&
          "id" in (variables as any)
        ) {
          queryClient.invalidateQueries({
            queryKey: [cleanUrl, (variables as any).id],
          });
        }

        if (Array.isArray(options?.invalidateQueries)) {
          options.invalidateQueries.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      }

      if (options?.onSuccess) {
        (options.onSuccess as (...a: any[]) => any)(...args);
      }
    },
    ...options,
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
}

/**
 * 5. useDelete: Hook to delete data by id or with a request payload.
 * Example:
 * const { mutate: deleteLead, isLoading } = useDelete("/leads");
 * deleteLead("123"); // calls DELETE /leads/123
 * deleteLead(); // calls DELETE /leads
 */
export function useDelete<
  TData = any,
  TVariables = string | number | void | Record<string, any>,
>(
  url: string,
  options?: UseMutationOptions<TData, Error, TVariables, unknown> &
    MutationCustomOptions,
  axiosConfig?: AxiosRequestConfig,
) {
  const queryClient = useQueryClient();
  const cleanUrl = normalizeKey(url);

  const mutation = useMutation<TData, Error, TVariables, unknown>({
    mutationFn: async (variables: TVariables) => {
      if (
        typeof variables === "string" ||
        typeof variables === "number"
      ) {
        const endpoint = `${cleanUrl}/${variables}`;
        const response = await apiClient.delete<TData>(
          endpoint,
          resolveConfig(endpoint, axiosConfig),
        );
        return response.data;
      }

      if (variables && typeof variables === "object" && "params" in variables) {
        const response = await apiClient.delete<TData>(url, {
          params: (variables as any).params,
          ...resolveConfig(url, axiosConfig),
        });
        return response.data;
      }

      const response = await apiClient.delete<TData>(url, {
        data: variables,
        ...resolveConfig(url, axiosConfig),
      });
      return response.data;
    },
    onSuccess: (...args) => {
      const [, variables] = args;
      if (options?.invalidateQueries !== false) {
        queryClient.invalidateQueries({ queryKey: [cleanUrl] });

        if (
          typeof variables === "string" ||
          typeof variables === "number"
        ) {
          queryClient.invalidateQueries({
            queryKey: [cleanUrl, variables],
          });
        }

        if (Array.isArray(options?.invalidateQueries)) {
          options.invalidateQueries.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      }

      if (options?.onSuccess) {
        (options.onSuccess as (...a: any[]) => any)(...args);
      }
    },
    ...options,
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
}
