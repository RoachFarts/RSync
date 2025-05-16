// app/pending-approval.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Adjust path if context is elsewhere
import { auth } from '../config/firebaseConfig'; // Adjust path
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function PendingApprovalScreen() {
  const { firebaseUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The main _layout should redirect to login
    } catch (error) {
      console.error("Logout error from pending screen:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Pending Approval</Text>
      <Text style={styles.message}>
        Welcome, {firebaseUser?.email || 'User'}!
      </Text>
      <Text style={styles.message}>
        Your account is currently awaiting administrator approval. Please check back later.
      </Text>
      <Button title="Logout" onPress={handleLogout} color="#FF3B30" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#E5E5EA',
    textAlign: 'center',
    marginBottom: 15,
  },
});