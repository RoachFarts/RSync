import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../context/AuthContext'; // Adjust path as needed
import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const colorScheme = useColorScheme();
  const { firebaseUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'), // Adjust path if needed
  });

  useEffect(() => {
    if (authLoading || !fontsLoaded) {
      return;
    }

    SplashScreen.hideAsync();

    const isInAuthGroup = segments[0] === '(auth)';
    const currentRoute = segments.join('/'); // For more specific checks if needed, e.g., segments[1] within (auth)

    if (!firebaseUser) {
      // No user logged in. Redirect to login if not already in the (auth) group.
      if (!isInAuthGroup) {
        router.replace('/(auth)/login'); // Navigate to your login screen within the (auth) group
      }
      return;
    }

    // User is logged in (firebaseUser exists)
    if (userProfile) {
      switch (userProfile.status) {
        case 'pending_approval':
          // Check if the current route is already pending-approval. The segments array will be ['pending-approval']
          if (segments[0] !== 'pending-approval') {
            router.replace('/pending-approval');
          }
          break;
        case 'approved':
        case 'active':
          // User is approved. If they are in the (auth) group or on pending/rejected, send to main app.
          if (isInAuthGroup || segments[0] === 'pending-approval' || segments[0] === 'account-rejected') {
            router.replace('/(tabs)'); // IMPORTANT: Adjust to your main authenticated app route
          }
          break;
        case 'rejected':
          if (segments[0] !== 'account-rejected') {
            router.replace('/account-rejected');
          }
          break;
        default:
          console.warn('Unknown user profile status:', userProfile.status);
          if (!isInAuthGroup) { // Fallback to login if status is unknown and not in auth flow
            router.replace('/(auth)/login');
          }
          break;
      }
    } else if (!authLoading && firebaseUser) {
      // Firebase user exists, but no Firestore profile yet (and auth isn't loading).
      console.warn("User is authenticated, but Firestore profile is not yet available or missing.");
      // Avoid redirect loops if already on a relevant screen within (auth) or pending.
      if (!isInAuthGroup && segments[0] !== 'pending-approval') {
         // router.replace('/(auth)/login'); // Or a specific "profile setup" screen if you add one
      }
    }
  }, [authLoading, fontsLoaded, firebaseUser, userProfile, segments, router]);

  if (!fontsLoaded || authLoading) {
    return null; // Splash screen remains visible
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Main navigation stack screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} /> {/* Route group for auth screens */}
        
        <Stack.Screen name="pending-approval" options={{ title: 'Awaiting Approval', headerShown: false }} />
        <Stack.Screen name="account-rejected" options={{ title: 'Account Issue', headerShown: false }} />
        
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}