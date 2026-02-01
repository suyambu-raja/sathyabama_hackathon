/**
 * Dashboard page for authenticated users
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ItemCard } from '@/components/ItemCard';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { DashboardData, Item } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await api.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewItem = (item: Item) => {
    // Navigate to item details
    window.location.href = `/item/${item.id}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name || user?.email}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your items
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <Link to="/report/lost">
              <Button leftIcon={<PlusIcon className="h-5 w-5" />}>
                Report Lost Item
              </Button>
            </Link>
            <Link to="/report/found">
              <Button variant="outline" leftIcon={<PlusIcon className="h-5 w-5" />}>
                Report Found Item
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="ghost" leftIcon={<EyeIcon className="h-5 w-5" />}>
                Browse Items
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {dashboardData?.user_stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.user_stats.total_items}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Lost Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.user_stats.lost_items}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Open Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.user_stats.open_items}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.user_stats.resolved_items}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Items</CardTitle>
              <Link to="/items">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.recent_items && dashboardData.recent_items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.recent_items.slice(0, 6).map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    showActions={true}
                    onViewDetails={handleViewItem}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <PlusIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                <p className="text-gray-600 mb-6">Start by reporting a lost or found item</p>
                <Link to="/report">
                  <Button>Report First Item</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}