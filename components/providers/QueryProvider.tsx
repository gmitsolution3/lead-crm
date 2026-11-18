"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import React, { useState } from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes: queries remain fresh for 2 min before refetching
            gcTime: 1000 * 60 * 10, // 10 minutes: inactive cache garbage collection time
            refetchOnWindowFocus: false, // Prevents sudden flashes when switching browser tabs
            retry: 1, // Retry failed network requests once before showing error
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
