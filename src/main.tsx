import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import App from "./App";
import { AuthProvider } from "./features/auth/AuthProvider";
import { SetupNotice } from "./components/layout/SetupNotice";
import { isSupabaseConfigured } from "./lib/supabase";
import "./index.css";

const message = (e: unknown) =>
  e instanceof Error && e.message ? e.message : "Something went wrong.";

/**
 * There is no save button anywhere in this app, so a write that fails has nothing to
 * report itself through — the UI just quietly keeps showing the old value and it reads
 * as "it didn't save". These caches turn every failed read and write into a toast.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => toast.error("Didn't save", { description: message(error) }),
  }),
  queryCache: new QueryCache({
    onError: (error) => toast.error("Couldn't load", { description: message(error) }),
  }),
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
        <Toaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    ) : (
      <SetupNotice />
    )}
  </React.StrictMode>,
);
