/**
 * Browse items page - public and private browsing
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ItemCard } from '@/components/ItemCard';
import { ClaimModal } from '@/components/ClaimModal';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Item, ItemType, ItemStatus } from '@/types';

export default function BrowsePage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      setIsLoading(false);
      return;
    }

    const fetchItems = async () => {
      try {
        setIsLoading(true);
        // Only fetch authenticated user's items
        const data = await api.getUserItems();
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [isAuthenticated]);

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchTerm || 
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleClaim = (item: Item) => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
    setSelectedItem(item);
    setShowClaimModal(true);
  };

  const handleViewDetails = (item: Item) => {
    window.location.href = `/item/${item.id}`;
  };

  const handleClaimSuccess = () => {
    setShowClaimModal(false);
    setSelectedItem(null);
    // Refresh items
    window.location.reload();
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md px-4 sm:px-6 lg:px-8 text-center">
          <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to browse items and protect user privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/login">
              <Button>
                Sign In
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button variant="outline">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
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
            {isAuthenticated ? 'Your Items' : 'Browse Items'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAuthenticated 
              ? 'Manage your lost and found items'
              : 'Help find owners of lost items'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ItemType | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="lost">Lost Items</option>
                <option value="found">Found Items</option>
              </select>

              {/* Status Filter */}
              {isAuthenticated && (
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ItemStatus | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="matched">Matched</option>
                  <option value="claimed">Claimed</option>
                  <option value="released">Released</option>
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          </p>
          
          {isAuthenticated && (
            <Button
              variant="outline"
              leftIcon={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
              onClick={() => {/* Add advanced filters */}}
            >
              Advanced Filters
            </Button>
          )}
        </div>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                showActions={true}
                onClaim={isAuthenticated ? handleClaim : undefined}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms or filters'
                : 'No items match your current filters'
              }
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedStatus('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Claim Modal */}
        <ClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          item={selectedItem}
          onClaimSuccess={handleClaimSuccess}
        />
      </div>
    </div>
  );
}