import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingBag, 
  Mic, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { getNavigationLinks, getRoutesByGroup } from '@/lib/routeUtils';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Check if a route is active (including nested routes)
  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get main navigation links
  const mainLinks = getNavigationLinks().slice(0, 4);
  
  // Get grouped routes
  const ideaQualityRoutes = getRoutesByGroup('idea-quality')
    .filter(r => r.path !== '*' && !r.path.includes(':') && r.metadata?.order)
    .sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0));
  
  const lovableRoutes = getRoutesByGroup('lovable')
    .filter(r => r.path !== '*' && !r.path.includes(':') && r.metadata?.order)
    .sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0));
  
  const demoRoutes = getRoutesByGroup('demo')
    .filter(r => r.path !== '*' && !r.path.includes(':') && r.metadata?.order)
    .sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0));

  const iconMap: Record<string, any> = {
    '/': Home,
    '/products': ShoppingBag,
    '/voice-shop': Mic,
    '/dashboard': LayoutDashboard,
    '/agents': Users,
  };

  const primaryNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: ShoppingBag },
    { href: '/voice-shop', label: 'Voice', icon: Mic },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg">
      {/* Expanded Menu */}
      {expandedSection && (
        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-[60vh] overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <span className="text-sm font-semibold text-gray-900">
              {expandedSection === 'more' && 'More Options'}
              {expandedSection === 'idea-quality' && 'Idea Quality Framework'}
              {expandedSection === 'lovable' && 'Lovable Cloud'}
              {expandedSection === 'demo' && 'Demos'}
            </span>
            <button
              onClick={() => setExpandedSection(null)}
              className="p-1 rounded-md hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-2 py-2">
            {expandedSection === 'more' ? (
              <>
                <button
                  onClick={() => setExpandedSection('idea-quality')}
                  className="w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span>Idea Quality Framework</span>
                  <span className="text-gray-400">{ideaQualityRoutes.length} pages</span>
                </button>
                <button
                  onClick={() => setExpandedSection('lovable')}
                  className="w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span>Lovable Cloud</span>
                  <span className="text-gray-400">{lovableRoutes.length} pages</span>
                </button>
                <button
                  onClick={() => setExpandedSection('demo')}
                  className="w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span>Demos</span>
                  <span className="text-gray-400">{demoRoutes.length} pages</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setExpandedSection('more')}
                  className="w-full text-left px-4 py-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  ← Back
                </button>
                {(expandedSection === 'idea-quality' ? ideaQualityRoutes :
                  expandedSection === 'lovable' ? lovableRoutes :
                  expandedSection === 'demo' ? demoRoutes : []).map((route) => (
                  <Link
                    key={route.path}
                    to={route.path}
                    onClick={() => setExpandedSection(null)}
                    className={cn(
                      'block px-4 py-3 rounded-md text-sm transition-colors',
                      isRouteActive(route.path)
                        ? 'bg-[#2D8CFF] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {route.metadata?.title}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Primary Navigation */}
      <div className="flex justify-around items-center h-16 px-2">
        {primaryNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = isRouteActive(href);
          return (
            <Link
              key={href}
              to={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center text-xs px-2 py-1 rounded-lg transition-colors min-w-[60px] flex-1 max-w-[80px]',
                isActive
                  ? 'bg-[#2D8CFF] text-white'
                  : 'text-gray-600 hover:text-[#2D8CFF]'
              )}
            >
              <Icon size={20} className="mb-0.5" />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </Link>
          );
        })}
        
        {/* More Menu Button */}
        <button
          onClick={() => setExpandedSection(expandedSection ? null : 'more')}
          className={cn(
            'flex flex-col items-center justify-center text-xs px-2 py-1 rounded-lg transition-colors min-w-[60px] flex-1 max-w-[80px]',
            expandedSection
              ? 'bg-[#2D8CFF] text-white'
              : 'text-gray-600 hover:text-[#2D8CFF]'
          )}
          aria-label="More options"
          aria-expanded={!!expandedSection}
        >
          <Menu size={20} className="mb-0.5" />
          <span className="text-[10px] font-medium leading-tight">More</span>
        </button>
      </div>
    </div>
  );
}

