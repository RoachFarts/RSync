// app/(modals)/requestBarangayPermit.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig'; // Adjust path
import { useAuth } from '../../context/AuthContext';   // Adjust path
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'; // Import useLocalSearchParams and Stack
import { DocumentRequest, DocumentTypeName, DocumentRequestStatus } from '../../types/d'; // Adjust path

export default function RequestBarangayPermitScreen() {
  const { firebaseUser, userProfile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string }>(); // Get title passed from navigation

  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill user details if available, make them read-only or confirmable
  const displayName = userProfile?.fullName || firebaseUser?.email || 'Current User';
  const displayAddress = userProfile?.address || 'N/A'; // Assuming address is in UserProfile

  const handleSubmit = async () => {
    if (!purpose.trim()) {
      Alert.alert('Missing Information', 'Please state the purpose of your permit.');
      return;
    }

    setLoading(true);
    try {
      if (!firebaseUser) {
        throw new Error("User not authenticated. Please log in.");
      }

      // For requestId and fee, you'll need a system.
      // For now, requestId can be the Firestore doc ID (handled by reading doc.id after creation)
      // or a placeholder. Fee might be fixed or determined by admin.
      // Let's make requestId simple for now, and fee a default.
      const newRequestId = `BP-${Date.now().toString().slice(-6)}`; // Simple example
      const defaultFee = 50; // Example fee

      const newRequestData: Omit<DocumentRequest, 'id'> = {
        userId: firebaseUser.uid,
        userName: displayName,
        requestId: newRequestId, // Example ID
        documentName: 'Barangay Permit',
        purpose: purpose.trim(),
        dateRequested: serverTimestamp() as Timestamp,
        fee: defaultFee, // Example fee, this could be dynamic later
        status: 'Pending', // Initial status
        // dateReleased would be null initially
      };

      const requestsCollectionRef = collection(db, 'documentRequests');
      await addDoc(requestsCollectionRef, newRequestData);

      Alert.alert('Request Submitted', 'Your Barangay Permit request has been submitted successfully and is pending review.');
      if (router.canGoBack()) {
        router.back(); // Close the modal
      } else {
        router.replace('/(tabs)/explore'); // Fallback to "My Requests" tab
      }

    } catch (error: any) {
      console.error("Error submitting Barangay Permit request: ", error);
      Alert.alert('Error', `Could not submit your request. ${error.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.scrollContentContainer}>
      <Stack.Screen options={{ title: params.title || 'Barangay Permit Request' }} />
      
      <Text style={styles.sectionTitle}>Applicant Information</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Name:</Text>
        <Text style={styles.infoValue}>{displayName}</Text>
        <Text style={styles.infoLabel}>Address:</Text>
        <Text style={styles.infoValue}>{displayAddress}</Text>
      </View>

      <Text style={styles.label}>Purpose of Permit*</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="e.g., For local employment, Proof of residency, Travel requirement"
        value={purpose}
        onChangeText={setPurpose}
        multiline
        numberOfLines={3}
      />
      
      {/* You can add more fields specific to Barangay Permit here if needed */}

      <TouchableOpacity
        style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Submit Request</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  // pageTitle: { // Using Stack.Screen options for title
  //   fontSize: 22, fontWeight: 'bold', color: '#1C1C1E',
  //   textAlign: 'center', marginBottom: 25,
  // },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C43',
    marginTop: 10,
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: '#3C3C43',
    marginBottom: 6,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});