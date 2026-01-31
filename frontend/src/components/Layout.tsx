/**
 * Main layout component with navigation and responsive design
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  PlusIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export function Layout({ children, showNavigation = true }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Report Item', href: '/report', icon: PlusIcon },
    { name: 'Browse', href: '/browse', icon: MagnifyingGlassIcon },
  ];

  const userNavigation = [
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      {showNavigation && (
        <nav className="bg-white shadow-sm border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo and Desktop Navigation */}
              <div className="flex">
                <Link to="/" className="flex items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">L&F</span>
                    </div>
                    <span className="ml-2 text-xl font-bold text-gray-900">
                      Lost&Found AI
                    </span>
                  </div>
                </Link>

                {/* Desktop Navigation Links */}
                {isAuthenticated && (
                  <div className="hidden md:ml-8 md:flex md:space-x-8">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2',
                            isActive
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          )}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop Right Side */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                {isAuthenticated ? (
                  <>
                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                      {userNavigation.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                          >
                            <Icon className="h-5 w-5" />
                          </Link>
                        );
                      })}

                      <span className="text-sm text-gray-700">
                        {user?.full_name || user?.email}
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                      >
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link to="/auth/login">
                      <Button variant="ghost">Login</Button>
                    </Link>
                    <Link to="/auth/register">
                      <Button>Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="space-y-1 pb-3 pt-2">
                {isAuthenticated ? (
                  <>
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.full_name || user?.email}
                      </p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>

                    {/* Navigation Links */}
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'flex items-center px-4 py-2 text-base font-medium',
                            isActive
                              ? 'text-primary-600 bg-primary-50'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}

                    {/* User Navigation */}
                    {userNavigation.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-1">
                    <Link
                      to="/auth/login"
                      className="block px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth/register"
                      className="block px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2026 Lost&Found AI Platform. Built for Sathyabama Hackathon.
            </div>
            <div className="mt-2 md:mt-0 text-sm text-gray-500">
              Powered by AI • Secure • Trusted
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}