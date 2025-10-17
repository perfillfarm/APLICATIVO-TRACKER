import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';
import { FirebaseRecordsProvider } from '@/contexts/FirebaseRecordsContext';
import { FirebaseStatsProvider } from '@/contexts/FirebaseStatsContext';
import { FirebaseSettingsProvider } from '@/contexts/FirebaseSettingsContext';
import { router } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/utils/logger';

export default function RootLayout() {
  useFrameworkReady();

  // Listen for logout events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLogout = () => {
        logger.info('[RootLayout] Logout event detected');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 50);
      };
      
      window.addEventListener('logout', handleLogout);
      return () => window.removeEventListener('logout', handleLogout);
    }
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <FirebaseAuthProvider>
            <FirebaseRecordsProvider>
              <FirebaseStatsProvider>
                <FirebaseSettingsProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                </FirebaseSettingsProvider>
              </FirebaseStatsProvider>
            </FirebaseRecordsProvider>
          </FirebaseAuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
