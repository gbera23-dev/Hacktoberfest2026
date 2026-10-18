

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App";
import "./index.css";
import "./features/plan/plan.css";
import "./features/stops/stops.css";
import "./features/live/live.css";
import "leaflet/dist/leaflet.css";
import { QUERY_GC_TIME_MS, QUERY_RETRY_COUNT, QUERY_STALE_TIME_MS } from "./shared/constants/query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY_COUNT,
      refetchOnWindowFocus: false,
      staleTime: QUERY_STALE_TIME_MS,
      gcTime: QUERY_GC_TIME_MS,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <StrictMode>
      <App />
    </StrictMode>
  </QueryClientProvider>,
);
