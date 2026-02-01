/**
 * Landing page with public dashboard and CTAs
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  PlusIcon, 
  ShieldCheckIcon,
  SparklesIcon,
  MapPinIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Matching',
      description: 'Advanced CLIP and ResNet models with 90% accuracy for image and text matching.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Verification',
      description: 'Zero-knowledge privacy with OTP verification and escrow protection.'
    },
    {
      icon: MapPinIcon,
      title: 'GPS Precision',
      description: 'Location-based matching with reverse geocoding and proximity scoring.'
    },
    {
      icon: ClockIcon,
      title: 'Smart Escalation',
      description: 'Automated escalation to authorities after 14 days with AI-generated reports.'
    },
  ];

  const stats = [
    { label: 'Items Reunited', value: '2,847' },
    { label: 'Active Users', value: '15,230' },
    { label: 'AI Accuracy', value: '90%' },
    { label: 'Avg Response', value: '< 2hrs' },
  ];

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <SparklesIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-600 mb-6">Redirecting you to your dashboard...</p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Lost&Found <span className="text-blue-600">AI Platform</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Revolutionary AI-driven platform with multimodal matching, zero-knowledge privacy, 
              and secure escrow system. Reuniting people with their belongings using cutting-edge technology.
            </p>
            
            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="xl" leftIcon={<PlusIcon className="h-5 w-5" />}>
                  Report Lost Item
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" size="xl" leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}>
                  Browse Found Items
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Lost&Found AI?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built for Sathyabama Hackathon with enterprise-grade features and AI capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Notice Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto max-w-3xl">
              <ShieldCheckIcon className="mx-auto h-16 w-16 text-blue-600 mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Privacy & Security First</h2>
              <p className="text-lg text-gray-600 mb-8">
                Your privacy is our priority. All lost and found items are kept secure and only visible to authenticated users. 
                Sign up or log in to access the platform and help reunite people with their belongings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth/register">
                  <Button size="lg">
                    Create Account
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust Lost&Found AI to reunite them with their belongings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register">
              <Button variant="secondary" size="xl">
                Create Account
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="outline" size="xl" className="text-white border-white hover:bg-white hover:text-blue-600">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}