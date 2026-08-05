import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./features/auth/AuthProvider";
import { SetupNotice } from "./components/layout/SetupNotice";
import { isSupabaseConfigured } from "./lib/supabase";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    },
  },
});

/**
 * The config gate sits above AuthProvider on purpose: AuthProvider calls
 * supabase.auth.getSession() as soon as it mounts, so gating any lower would fire a
 * request at a placeholder client and hang on its loading state.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isSupabaseConfigured ? (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    ) : (
      <SetupNotice />
    )}
  </React.StrictMode>,
);
