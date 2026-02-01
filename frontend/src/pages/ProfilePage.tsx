/**
 * User profile page
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import type { User } from '@/types';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsSubmitting(true);
      
      // In a real app, you'd call an API to update the profile
      // await api.updateProfile(data);
      
      // For demo purposes, just show success message
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh user data
      await refreshUser();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  const stats = [
    { label: 'Member Since', value: new Date(user?.created_at || '').toLocaleDateString() },
    { label: 'Last Login', value: user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never' },
    { label: 'Account Status', value: 'Active' },
    { label: 'Role', value: user?.role || 'USER' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Personal Information</CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      leftIcon={<PencilIcon className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        leftIcon={<XMarkIcon className="h-4 w-4" />}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit(onSubmit)}
                        isLoading={isSubmitting}
                        leftIcon={<CheckIcon className="h-4 w-4" />}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <p className="mt-1 text-gray-900">{user?.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <p className="mt-1 text-gray-900">
                        {user?.full_name || 'Not provided'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <p className="mt-1 text-gray-900">
                        {user?.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <p className="mt-1 text-gray-500 text-sm">
                        {user?.email} (cannot be changed)
                      </p>
                    </div>
                    
                    <Input
                      label="Full Name"
                      {...register('full_name')}
                      error={errors.full_name?.message}
                      placeholder="Enter your full name"
                    />
                    
                    <Input
                      label="Phone Number"
                      type="tel"
                      {...register('phone')}
                      error={errors.phone?.message}
                      placeholder="+91 9876543210"
                    />
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Avatar */}
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserCircleIcon className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.full_name || user?.email}
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <Button variant="outline" size="sm" className="mt-4">
                  Change Avatar
                </Button>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm text-gray-600">{stat.label}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Download Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}