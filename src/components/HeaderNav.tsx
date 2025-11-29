import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  Mic, 
  LayoutDashboard,
  Lightbulb,
  Cloud,
  Presentation,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNavigationLinks, getRoutesByGroup } from '@/lib/routeUtils';
import { cn } from '@/lib/utils';

// Icon mapping for routes
const routeIcons: Record<string, any> = {
  '/': Home,
  '/products': ShoppingBag,
  '/voice-shop': Mic,
  '/dashboard': LayoutDashboard,
  '/agents': Users,
  'idea-quality': Lightbulb,
  'lovable': Cloud,
  'demo': Presentation,
};

export default function HeaderNav() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get main navigation links (public and protected routes)
  const mainLinks = getNavigationLinks();
  
  // Get grouped routes for dropdowns
  const ideaQualityRoutes = getRoutesByGroup('idea-quality')
    .filter(r => r.path !== '*' && !r.path.includes(':') && r.metadata?.order)
    .sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0));
  
  const lovableRoutes = getRoutesByGroup('lovable')
    .filter(r => r.path !== '*' && !r.path.includes(':') && r.metadata?.order)
    .sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0));
  
  const demoRoutes = getRoutesByGroup('demo')
    .filter(r => r.path !== '*' && !r.path.includes(':') && r.metadata?.order)
    .sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0));

  // Check if a route is active (including nested routes)
  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Check if any route in a group is active
  const isGroupActive = (routes: typeof ideaQualityRoutes) => {
    return routes.some(route => isRouteActive(route.path));
  };

  const NavLink = ({ 
    to, 
    label, 
    icon: Icon, 
    className 
  }: { 
    to: string; 
    label: string; 
    icon?: any;
    className?: string;
  }) => {
    const active = isRouteActive(to);
    return (
      <Link
        to={to}
        onClick={() => setMobileMenuOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
          active
            ? 'bg-[#2D8CFF] text-white'
            : 'text-[#111315] hover:bg-gray-100',
          className
        )}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </Link>
    );
  };

  return (
    <nav 
      role="navigation" 
      aria-label="Main navigation" 
      className="bg-white shadow-sm border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity"
              aria-label="Style Shepherd Home"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-fashion-gold rounded-lg"></div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">Style Shepherd</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Main Links */}
                {mainLinks.slice(0, 4).map(link => {
                  const Icon = routeIcons[link.path];
                  return (
                    <NavigationMenuItem key={link.path}>
                      <NavLink 
                        to={link.path} 
                        label={link.title} 
                        icon={Icon}
                        className="!px-3"
                      />
                    </NavigationMenuItem>
                  );
                })}

                {/* Idea Quality Dropdown */}
                {ideaQualityRoutes.length > 0 && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger 
                      className={cn(
                        isGroupActive(ideaQualityRoutes) && 'bg-[#2D8CFF] text-white hover:bg-[#2D8CFF]/90'
                      )}
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Idea Quality
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {ideaQualityRoutes.map((route) => (
                          <li key={route.path}>
                            <Link
                              to={route.path}
                              className={cn(
                                'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                isRouteActive(route.path) && 'bg-accent'
                              )}
                            >
                              <div className="text-sm font-medium leading-none">
                                {route.metadata?.title}
                              </div>
                              {route.metadata?.description && (
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {route.metadata.description}
                                </p>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                {/* Lovable Dropdown */}
                {lovableRoutes.length > 0 && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={cn(
                        isGroupActive(lovableRoutes) && 'bg-[#2D8CFF] text-white hover:bg-[#2D8CFF]/90'
                      )}
                    >
                      <Cloud className="w-4 h-4 mr-2" />
                      Lovable
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {lovableRoutes.map((route) => (
                          <li key={route.path}>
                            <Link
                              to={route.path}
                              className={cn(
                                'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                isRouteActive(route.path) && 'bg-accent'
                              )}
                            >
                              <div className="text-sm font-medium leading-none">
                                {route.metadata?.title}
                              </div>
                              {route.metadata?.description && (
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {route.metadata.description}
                                </p>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                {/* Demo Dropdown */}
                {demoRoutes.length > 0 && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={cn(
                        isGroupActive(demoRoutes) && 'bg-[#2D8CFF] text-white hover:bg-[#2D8CFF]/90'
                      )}
                    >
                      <Presentation className="w-4 h-4 mr-2" />
                      Demos
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {demoRoutes.map((route) => (
                          <li key={route.path}>
                            <Link
                              to={route.path}
                              className={cn(
                                'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                isRouteActive(route.path) && 'bg-accent'
                              )}
                            >
                              <div className="text-sm font-medium leading-none">
                                {route.metadata?.title}
                              </div>
                              {route.metadata?.description && (
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {route.metadata.description}
                                </p>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="hidden lg:inline">{user.firstName || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/dashboard">Try Demo</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-gray-700 p-2" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-2">
              {/* Main Links */}
              {mainLinks.slice(0, 4).map(link => {
                const Icon = routeIcons[link.path];
                return (
                  <NavLink 
                    key={link.path}
                    to={link.path} 
                    label={link.title} 
                    icon={Icon}
                    className="w-full justify-start"
                  />
                );
              })}

              {/* Idea Quality Section */}
              {ideaQualityRoutes.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Idea Quality Framework
                  </div>
                  {ideaQualityRoutes.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-6 py-2 text-sm rounded-md transition-colors',
                        isRouteActive(route.path)
                          ? 'bg-[#2D8CFF] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {route.metadata?.title}
                    </Link>
                  ))}
                </div>
              )}

              {/* Lovable Section */}
              {lovableRoutes.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    Lovable Cloud
                  </div>
                  {lovableRoutes.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-6 py-2 text-sm rounded-md transition-colors',
                        isRouteActive(route.path)
                          ? 'bg-[#2D8CFF] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {route.metadata?.title}
                    </Link>
                  ))}
                </div>
              )}

              {/* Demo Section */}
              {demoRoutes.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Presentation className="w-4 h-4" />
                    Demos
                  </div>
                  {demoRoutes.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-6 py-2 text-sm rounded-md transition-colors',
                        isRouteActive(route.path)
                          ? 'bg-[#2D8CFF] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {route.metadata?.title}
                    </Link>
                  ))}
                </div>
              )}

              {/* Mobile Auth */}
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Try Demo</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

