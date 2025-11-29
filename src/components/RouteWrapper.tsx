import { Suspense, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import PageTransition from './PageTransition';
import ProtectedRoute from './ProtectedRoute';
import { RouteConfig } from '@/lib/routes';

interface RouteWrapperProps {
  route: RouteConfig;
  children: ReactNode;
}

/**
 * Reusable wrapper for routes that handles:
 * - Page transitions
 * - Loading states
 * - Suspense boundaries
 * - Authentication protection
 */
export default function RouteWrapper({ route, children }: RouteWrapperProps) {
  const location = useLocation();
  const requiresAuth = route.metadata?.requiresAuth ?? false;

  const content = (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      {children}
    </Suspense>
  );

  return (
    <PageTransition keyProp={location.pathname}>
      {requiresAuth ? (
        <ProtectedRoute>{content}</ProtectedRoute>
      ) : (
        content
      )}
    </PageTransition>
  );
}

