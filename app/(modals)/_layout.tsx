import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme'; // Assuming path from app/(modals) to root/hooks
import { Colors } from '@/constants/Colors';     // Assuming path from app/(modals) to root/constants

export default function ModalLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        // Default header style for modals in this group
        // You can set headerShown: false if individual modal screens define their own full headers
        // or if you want a completely custom presentation.
        headerShown: true, 
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
        },
        headerTintColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      }}
        />
      );
    }