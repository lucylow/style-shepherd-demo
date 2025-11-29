import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteByPath } from '@/lib/routes';

/**
 * Hook to manage route metadata (title, description, etc.)
 * Updates document title and meta tags based on current route
 */
export default function useRouteMetadata() {
  const location = useLocation();

  useEffect(() => {
    const route = getRouteByPath(location.pathname);

    if (route?.metadata) {
      const { title, description } = route.metadata;

      // Update document title
      if (title) {
        document.title = `${title} | Style Shepherd`;
      }

      // Update meta description
      if (description) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description);
      }
    } else {
      // Default title
      document.title = 'Style Shepherd';
    }
  }, [location.pathname]);
}

