import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';
import BrowsePage from './pages/BrowsePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ItemDetailsPage from './pages/ItemDetailsPage';

// Protected Route Component
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Layout showNavigation={false}><LoginPage /></Layout>} />
        <Route path="/auth/register" element={<Layout showNavigation={false}><RegisterPage /></Layout>} />
        
        {/* Protected Routes */}
        <Route path="/browse" element={
          <Layout>
            <ProtectedRoute>
              <BrowsePage />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/item/:id" element={
          <Layout>
            <ProtectedRoute>
              <ItemDetailsPage />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/dashboard" element={
          <Layout>
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/report" element={
          <Layout>
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/report/:type" element={
          <Layout>
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/profile" element={
          <Layout>
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          </Layout>
        } />
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;