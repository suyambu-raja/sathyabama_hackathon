/**
 * Item details page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPinIcon, 
  CalendarIcon,
  ArrowLeftIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ClaimModal } from '@/components/ClaimModal';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatRelativeTime, getStatusColor, getTypeColor } from '@/lib/utils';
import type { Item } from '@/types';

export default function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        const response = await api.getItem(id);
        setItem(response.item);
        setCanClaim(response.can_claim);
        setCanModify(response.can_modify);
      } catch (error) {
        console.error('Failed to fetch item:', error);
        navigate('/browse');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  const handleClaim = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    setShowClaimModal(true);
  };

  const handleClaimSuccess = () => {
    setShowClaimModal(false);
    // Refresh item data
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Item not found</h2>
          <p className="text-gray-600 mb-4">The item you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/browse')}>Browse Items</Button>
        </div>
      </div>
    );
  }

  // Additional safety check to ensure item has required properties
  if (!item.id || !item.product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid item data</h2>
          <p className="text-gray-600 mb-4">The item data is incomplete or corrupted.</p>
          <Button onClick={() => navigate('/browse')}>Browse Items</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          className="mb-6"
        >
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.product}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl">{item.product}</CardTitle>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Brand and Color */}
                  {(item.brand || item.color) && (
                    <div className="flex flex-wrap gap-2">
                      {item.brand && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                          Brand: {item.brand}
                        </span>
                      )}
                      {item.color && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                          Color: {item.color}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{item.description}</p>
                  </div>

                  {/* Location */}
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>
                      {(() => {
                        // Handle both nested gps object and flat properties from backend
                        const address = item.gps?.address || (item as any).address;
                        const lat = item.gps?.lat ?? (item as any).lat;
                        const lng = item.gps?.lng ?? (item as any).lng;
                        
                        if (address) return address;
                        if (lat !== undefined && lng !== undefined) {
                          return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                        }
                        return 'Location not available';
                      })()}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span>Reported {formatRelativeTime(item.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-4">
                    {canClaim && (
                      <Button
                        onClick={handleClaim}
                        leftIcon={<HandRaisedIcon className="h-5 w-5" />}
                        className="w-full"
                      >
                        Claim This Item
                      </Button>
                    )}
                    
                    {canModify && (
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" className="flex-1">
                          Edit
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Claim Modal */}
        <ClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          item={item}
          onClaimSuccess={handleClaimSuccess}
        />
      </div>
    </div>
  );
}