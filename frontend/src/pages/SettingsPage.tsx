/**
 * Settings page
 */
import { useState } from 'react';
import { 
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account preferences and privacy settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium capitalize">{key} Notifications</h4>
                      <p className="text-xs text-gray-500">
                        Get notified via {key} about item matches and updates
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Privacy Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SunIcon className="h-5 w-5 mr-2" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}