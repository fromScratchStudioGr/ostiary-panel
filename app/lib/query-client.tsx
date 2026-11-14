"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";
import { ApiError, subscribeToSessionEnded } from "./api";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        // Any real HTTP error (status !== 0) is not worth retrying - in
        // particular, retrying a 401 would re-trigger notifySessionEnded()
        // on every attempt. Only a network failure (status 0) gets retried.
        retry: (failureCount, error) =>
          error instanceof ApiError && error.status !== 0 ? false : failureCount < 2,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => subscribeToSessionEnded(() => queryClient.clear()), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV !== "production" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
