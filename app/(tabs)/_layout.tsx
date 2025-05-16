// app/(tabs)/_layout.tsx
import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native'; // Platform is used in screenOptions

import { HapticTab } from '@/components/HapticTab'; // Assuming paths
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin, firebaseUser, loading: authLoading } = useAuth();

  if (authLoading) {
    return null; // Or a loading spinner
  }
  if (!firebaseUser) {
    // This should ideally be caught by your root _layout.tsx.
    return <Redirect href="/(auth)/login" />; // Or your primary login route
  }

  return (
    <Tabs
      screenOptions={{
        // Your existing screenOptions like tabBarActiveTintColor, headerShown, etc.
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
      }}
    >
      <Tabs.Screen
        name="index" // This points to app/(tabs)/index.tsx (Announcements screen)
        options={{
          title: 'Announcements',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="megaphone.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule" // This points to app/(tabs)/schedule.tsx
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
       <Tabs.Screen
        name="lostAndFound" // This points to app/(tabs)/lostAndFound.tsx
        options={{
          title: 'Lost & Found',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="archivebox.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore" // This points to app/(tabs)/explore.tsx
        options={{
          title: 'My Requests', // <<<< EDITED: Changed title to reflect new content for non-admins
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.magnifyingglass" color={color} />, // <<<< EDITED: Changed icon
        }}
      />
      {/* createPost tab was previously (and correctly) removed as it's now a modal for admins */}
      <Tabs.Screen
        name="profile" // This points to app/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
      {isAdmin && ( // Admin Panel tab remains conditional
        <Tabs.Screen
          name="admin" // This points to app/(tabs)/admin.tsx
          options={{
            title: 'Admin Panel',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="lock.shield.fill" color={color} />,
          }}
        />
      )}
      {/* The Create Post tab is no longer here, as it's accessed via FAB by admins */}
    </Tabs>
  );
}