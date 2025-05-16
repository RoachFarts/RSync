import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          headerShown: false, // As per your design, login screen has no header
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Create your account', // Title for the signup screen
          headerStyle: {
            backgroundColor: '#1A1A1A', // Dark background for header to match image
          },
          headerTintColor: '#FFFFFF', // Light color for title and back arrow
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack>
  );
}