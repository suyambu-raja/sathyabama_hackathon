/**
 * Next.js App component with global providers and styles
 */
import { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthContext, AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import '@/styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Lost&Found AI Platform</title>
        <meta name="description" content="AI-powered lost and found platform with secure verification" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </Head>

      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          
          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}