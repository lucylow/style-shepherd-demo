import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthKitProvider } from "@workos-inc/authkit-react";
import { WORKOS_CLIENT_ID, WORKOS_API_HOSTNAME } from "@/lib/workos";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AgentActionProvider } from "@/contexts/AgentActionContext";
import { AgentActionConfirmationDialog } from "@/components/AgentActionConfirmationDialog";
import { routes } from "@/lib/routes";
import RouteWrapper from "@/components/RouteWrapper";
import RouteLoadingIndicator from "@/components/RouteLoadingIndicator";
import useRouteMetadata from "@/hooks/useRouteMetadata";

// Create QueryClient outside component to prevent recreation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Skip to content link component
const SkipToContent = () => (
  <a
    href="#main"
    className="skip-to-content focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-br-lg"
  >
    Skip to main content
  </a>
);

// App Routes with transitions and lazy loading
const AppRoutes = () => {
  // Update route metadata (title, description, etc.)
  useRouteMetadata();

  return (
    <>
      <SkipToContent />
      <RouteLoadingIndicator />
      <Routes>
        {routes.map((route) => {
          const { path, component: Component } = route;
          return (
            <Route
              key={path}
              path={path}
              element={
                <RouteWrapper route={route}>
                  <Component />
                </RouteWrapper>
              }
            />
          );
        })}
      </Routes>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthKitProvider
        clientId={WORKOS_CLIENT_ID}
        apiHostname={WORKOS_API_HOSTNAME}
      >
        <AgentActionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            <AgentActionConfirmationDialog />
          </TooltipProvider>
        </AgentActionProvider>
      </AuthKitProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
