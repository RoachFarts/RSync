import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, SplashScreen, Redirect } from 'expo-router'; // Added Redirect
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../context/AuthContext'; // Adjust path as needed
import { useColorScheme } from '@/hooks/useColorScheme'; // Assuming this path is correct

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const colorScheme = useColorScheme();
  const { firebaseUser, userProfile, loading: authLoading, isAdmin } // get isAdmin for potential root-level decisions if needed later
    = useAuth();
  const router = useRouter();
  const segments = useSegments(); // Current route segments array

  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'), // Adjust path if needed
  });

  useEffect(() => {
    // Wait for both authentication state to be resolved AND fonts to be loaded
    if (authLoading || !fontsLoaded) {
      console.log("RootLayout: Auth or fonts still loading.");
      return; // Splash screen remains visible
    }

    SplashScreen.hideAsync();
    console.log("RootLayout: Auth and fonts loaded. Evaluating routes.");

    const currentTopLevelSegment = segments[0]; // e.g., '(auth)', '(tabs)', 'pending-approval'
    const isEffectivelyOnAuthRoute = currentTopLevelSegment === '(auth)' || 
                                    currentTopLevelSegment === 'login' || // if login was app/login.tsx
                                    currentTopLevelSegment === 'signup'; // if signup was app/signup.tsx

    if (!firebaseUser) {
      console.log("RootLayout: No firebaseUser. Redirecting to login.");
      // If not already on an auth screen (e.g., login, signup), redirect to the (auth) group's entry.
      // Assuming login is within (auth) group, e.g. /auth/login
      if (currentTopLevelSegment !== '(auth)') {
        router.replace('/(auth)/login');
      }
      return;
    }

    // firebaseUser exists, meaning user is authenticated with Firebase
    if (userProfile) {
      console.log(`RootLayout: User authenticated (UID: ${firebaseUser.uid}), profile status: ${userProfile.status}, role: ${userProfile.role}`);
      switch (userProfile.status) {
        case 'pending_approval':
          if (currentTopLevelSegment !== 'pending-approval') {
            console.log("RootLayout: User pending approval. Redirecting to /pending-approval.");
            router.replace('/pending-approval');
          }
          break;
        case 'approved':
        case 'active':
          // User is approved/active. If they are on an auth screen or a status screen, send to main app.
          if (isEffectivelyOnAuthRoute || 
              currentTopLevelSegment === 'pending-approval' || 
              currentTopLevelSegment === 'account-rejected') {
            console.log("RootLayout: User approved/active. Redirecting to /(tabs).");
            router.replace('/(tabs)');
          }
          // Otherwise, they are approved and can be on any screen within (tabs) or other authed routes.
          break;
        case 'rejected':
          if (currentTopLevelSegment !== 'account-rejected') {
            console.log("RootLayout: User rejected. Redirecting to /account-rejected.");
            router.replace('/account-rejected');
          }
          break;
        default:
          console.warn(`RootLayout: Unknown user profile status: ${userProfile.status}. Redirecting to login.`);
          if (currentTopLevelSegment !== '(auth)') {
            router.replace('/(auth)/login');
          }
          break;
      }
    } else { // firebaseUser exists, but userProfile is null (and authLoading is false)
      console.warn(`RootLayout: User ${firebaseUser.uid} authenticated, but Firestore profile is missing. This is an unexpected state.`);
      // This is an issue. The user is authenticated but their app profile data is missing.
      // Options:
      // 1. Redirect to login (might cause loops if profile creation always fails).
      // 2. Redirect to a specific "Profile Incomplete" or error screen.
      // 3. For now, let's cautiously redirect to login if they aren't already on an auth/status screen.
      if (currentTopLevelSegment !== '(auth)' && 
          currentTopLevelSegment !== 'pending-approval' && 
          currentTopLevelSegment !== 'account-rejected') {
        console.log("RootLayout: Missing profile, redirecting to login as a fallback.");
        // Consider a different route or sign them out if this state persists, as it implies data inconsistency
        // For example, you could signOut(auth) here and then redirect.
        router.replace('/(auth)/login');
      }
    }
  }, [authLoading, fontsLoaded, firebaseUser, userProfile, segments, router]);

  // While fonts or initial auth state is loading, show nothing (splash screen is visible).
  if (!fontsLoaded || authLoading) {
    return null;
  }

  // If, after loading, there's no firebaseUser, but we haven't redirected yet
  // (e.g. if the effect hasn't run for some reason, or to prevent rendering children prematurely)
  // This check is a bit redundant given the useEffect but can act as a final gate.
  // However, Expo Router's <Redirect> component is cleaner for direct navigational changes outside of useEffect's main flow.
  // For now, the useEffect handles redirection. If firebaseUser is null, it will redirect.
  // If firebaseUser is present, it will proceed to render the Stack.
  // If the user is not authenticated, the <Stack> below will still attempt to render
  // the initial route, which will then be caught by the useEffect and redirected.
  // So, we don't necessarily need an explicit <Redirect> here if useEffect is robust.

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/*
          These define the top-level navigation stacks/groups.
          The actual screens within these groups are defined in their respective _layout.tsx files.
        */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="pending-approval" />
        <Stack.Screen name="account-rejected" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="(modals)" />
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