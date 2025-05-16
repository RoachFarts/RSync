import { Tabs, Redirect } from 'expo-router'; // Added Redirect
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab'; // Assuming this path is correct
import { IconSymbol } from '@/components/ui/IconSymbol'; // Assuming this path is correct
import TabBarBackground from '@/components/ui/TabBarBackground'; // Assuming this path is correct
import { Colors } from '@/constants/Colors'; // Assuming this path is correct
import { useColorScheme } from '@/hooks/useColorScheme'; // Assuming this path is correct
import { useAuth } from '../../context/AuthContext'; // <<<< IMPORT useAuth

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin, firebaseUser, loading: authLoading } = useAuth(); // <<<< GET isAdmin and firebaseUser, authLoading

  // If auth is still loading, or if there's no user (which should be handled by a higher layout,
  // but good for safety), don't render tabs yet or redirect.
  if (authLoading) {
    return null; // Or a loading spinner, or rely on SplashScreen
  }

  if (!firebaseUser) {
    // This situation should ideally be caught by your root _layout.tsx and redirect to login.
    // If somehow the user lands here without being authenticated, redirect them.
    return <Redirect href="/(auth)/login" />; // Or just "/login" if that's your top-level login route now
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index" // This will look for app/(tabs)/index.tsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore" // This will look for app/(tabs)/explore.tsx
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      {isAdmin && ( // <<<< CONDITIONALLY RENDER ADMIN TAB
        <Tabs.Screen
          name="admin" // This will look for app/(tabs)/admin.tsx
          options={{
            title: 'Admin',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="lock.shield.fill" color={color} />, // Example icon
          }}
        />
      )}
    </Tabs>
  );
}