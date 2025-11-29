import { routes, RouteConfig, getRouteByPath } from './routes';

/**
 * Get the current route's metadata
 */
export function getCurrentRouteMetadata(pathname: string) {
  const route = getRouteByPath(pathname);
  return route?.metadata;
}

/**
 * Check if a route requires authentication
 */
export function isRouteProtected(pathname: string): boolean {
  const route = getRouteByPath(pathname);
  return route?.metadata?.requiresAuth ?? false;
}

/**
 * Get all routes in a specific group
 */
export function getRoutesByGroup(group: string): RouteConfig[] {
  return routes.filter((route) => route.metadata?.group === group);
}

/**
 * Get navigation links for a specific group
 */
export function getNavigationLinks(group?: string) {
  const filteredRoutes = group
    ? getRoutesByGroup(group)
    : routes.filter((route) => 
        route.metadata?.group && 
        ['public', 'protected'].includes(route.metadata.group)
      );

  return filteredRoutes
    .filter((route) => route.path !== '*' && !route.path.includes(':'))
    .map((route) => ({
      path: route.path,
      title: route.metadata?.title || route.path,
      description: route.metadata?.description,
      requiresAuth: route.metadata?.requiresAuth,
    }))
    .sort((a, b) => {
      const routeA = routes.find((r) => r.path === a.path);
      const routeB = routes.find((r) => r.path === b.path);
      return (routeA?.metadata?.order || 0) - (routeB?.metadata?.order || 0);
    });
}

/**
 * Check if a path matches a route pattern (handles dynamic routes)
 */
export function matchRoute(path: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === path) return true;
  
  // Handle dynamic routes
  if (pattern.includes(':')) {
    const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }
  
  return false;
}

