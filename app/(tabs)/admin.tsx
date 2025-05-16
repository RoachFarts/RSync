// app/(tabs)/admin.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert, // Keep for native platforms
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform, // <<<< IMPORT PLATFORM
} from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig'; // Adjust path
import { UserProfile } from '../../types/user';   // Adjust path
import { useAuth } from '../../context/AuthContext'; // Adjust path
import { IconSymbol } from '@/components/ui/IconSymbol'; // Using IconSymbol as per your import
import { Redirect } from 'expo-router';

interface PendingUserListItem extends UserProfile {
  // uid is already part of UserProfile
}

export default function AdminScreen() {
  const { isAdmin, firebaseUser, loading: authLoading } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingUsers = useCallback(async () => {
    if (!isAdmin) {
        setPendingUsers([]);
        return;
    }
    setLoadingUsers(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('status', '==', 'pending_approval'));
      const querySnapshot = await getDocs(q);
      const users: PendingUserListItem[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as PendingUserListItem);
      });
      setPendingUsers(users);
    } catch (error) {
      console.error("Error fetching pending users: ", error);
      // Use window.alert for web, Alert.alert for native if fetch error occurs
      if (Platform.OS === 'web') {
        window.alert('Error: Could not fetch pending users.');
      } else {
        Alert.alert('Error', 'Could not fetch pending users.');
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingUsers();
    }
  }, [isAdmin, fetchPendingUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingUsers().then(() => setRefreshing(false));
  }, [fetchPendingUsers]);

  // --- EDITED handleUpdateStatus function ---
  const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected', actionVerb: string) => {
    console.log(`--- AdminScreen: handleUpdateStatus called for user ${userId}, action: ${actionVerb}, newStatus: ${newStatus} ---`);
    console.log(`Current platform is: ${Platform.OS}`);

    // Define the core update logic as a separate async function
    const performUpdate = async () => {
      console.log(`--- AdminScreen: performUpdate called for user ${userId} after confirmation ---`);
      try {
        const userDocRef = doc(db, 'users', userId);
        const updateData: { status: string; approvedAt?: Timestamp; approvedBy?: string | null } = {
          status: newStatus,
        };
        if (newStatus === 'approved') {
          updateData.approvedAt = serverTimestamp() as Timestamp;
          updateData.approvedBy = firebaseUser?.uid || null;
        }
        await updateDoc(userDocRef, updateData);

        const successMessage = `User ${actionVerb.toLowerCase()} successfully.`;
        if (Platform.OS === 'web') {
          window.alert(`Success: ${successMessage}`);
        } else {
          Alert.alert('Success', successMessage);
        }
        fetchPendingUsers(); // Refresh the list
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        console.error(`Error ${actionVerb.toLowerCase()}ing user ID ${userId}: `, error);
        if (Platform.OS === 'web') {
          window.alert(`Error: Could not ${actionVerb.toLowerCase()} user. Details: ${errorMessage}`);
        } else {
          Alert.alert('Error', `Could not ${actionVerb.toLowerCase()} user. Details: ${errorMessage}`);
        }
      }
    };

    if (Platform.OS === 'web') {
      console.log("--- AdminScreen: Attempting window.confirm for web ---");
      // For item.fullName to be available here, you might need to pass the item or specific details to handleUpdateStatus
      // For simplicity, using userId in the confirm message.
      const confirmed = window.confirm(`WEB CONFIRM: Are you sure you want to ${actionVerb.toLowerCase()} user: ${userId}?`);
      console.log(`--- AdminScreen: window.confirm returned: ${confirmed} ---`);
      if (confirmed) {
        await performUpdate();
      } else {
        console.log(`User cancelled ${actionVerb} action on web via window.confirm.`);
      }
    } else {
      // Original React Native Alert for native platforms (iOS, Android)
      console.log("--- AdminScreen: Attempting Alert.alert for native ---");
      Alert.alert(
        `Confirm ${actionVerb}`,
        `Are you sure you want to ${actionVerb.toLowerCase()} this user?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => console.log(`User cancelled ${actionVerb} action on native via Alert.`) },
          {
            text: actionVerb,
            style: newStatus === 'rejected' ? "destructive" : "default",
            onPress: performUpdate // Call the performUpdate async function
          },
        ]
      );
    }
  };

  // --- Loading and Admin Check --- (remains the same)
  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Admin Panel...</Text>
      </View>
    );
  }
  if (!isAdmin) {
    console.log("AdminScreen: Non-admin user detected, redirecting.");
    return <Redirect href="/(tabs)" />;
  }
  if (loadingUsers && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Fetching pending users...</Text>
      </View>
    );
  }

  const renderUserCard = ({ item }: { item: PendingUserListItem }) => (
    <View style={styles.card}>
      <Text style={styles.cardRequestId}>User UID: {item.uid}</Text>
      <Text style={styles.cardTitle}>{item.fullName || 'N/A'}</Text>
      <Text style={styles.cardSubtitle}>Email: {item.email || 'N/A'}</Text>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Contact No.:</Text>
        <Text style={styles.detailValue}>{item.contactNo || 'N/A'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Address:</Text>
        <Text style={styles.detailValue}>{item.address || 'N/A'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Joined:</Text>
        <Text style={styles.detailValue}>
          {item.createdAt instanceof Timestamp ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Agreed to Terms (ID Sim):</Text>
        <Text style={styles.detailValue}>{item.agreedToTerms ? 'Yes' : 'No'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Status:</Text>
        <Text style={[styles.detailValue, styles.statusPending]}>{item.status}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButtonBase, styles.approveButton]}
          onPress={() => {
            console.log(`--- AdminScreen: 'Approve' button pressed for user UID: ${item.uid} ---`);
            console.log('Current item data for approval:', JSON.stringify(item, null, 2));
            handleUpdateStatus(item.uid, 'approved', 'Approve');
          }}>
          <IconSymbol name="checkmark.circle.fill" size={18} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButtonBase, styles.rejectButton]}
          onPress={() => {
            console.log(`--- AdminScreen: 'Reject' button pressed for user UID: ${item.uid} ---`);
            console.log('Current item data for rejection:', JSON.stringify(item, null, 2));
            handleUpdateStatus(item.uid, 'rejected', 'Reject');
          }}>
          <IconSymbol name="xmark.circle.fill" size={18} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>User Approval Management</Text>
      {/* ... (FlatList rendering logic remains the same) ... */}
      {pendingUsers.length === 0 && !loadingUsers ? (
        <Text style={styles.infoText}>No users are currently pending approval.</Text>
      ) : (
        <FlatList
          data={pendingUsers}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#333333" />
          }
        />
      )}
    </View>
  );
}

// --- Styles (Keep your existing styles) ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5', },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555', },
  container: { flex: 1, paddingVertical: 10, paddingHorizontal: 5, backgroundColor: '#F0F2F5', },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1C1C1E', },
  listContentContainer: { paddingHorizontal: 10, },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, borderWidth: 1, borderColor: '#E0E0E0', },
  cardRequestId: { fontSize: 12, color: '#666666', textAlign: 'right', marginBottom: 5, },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4, },
  cardSubtitle: { fontSize: 14, color: '#555555', marginBottom: 10, },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', },
  detailLabel: { fontSize: 14, color: '#333333', fontWeight: '600', },
  detailValue: { fontSize: 14, color: '#555555', textAlign: 'right', flexShrink: 1, marginLeft: 5, },
  statusPending: { color: '#FF9500', fontWeight: 'bold', },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEEEEE', },
  actionButtonBase: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, marginHorizontal: 5, minHeight: 48, borderWidth: 1, borderColor: 'transparent', },
  approveButton: { backgroundColor: '#34C759', borderColor: '#2C9D46', },
  rejectButton: { backgroundColor: '#FF3B30', borderColor: '#D92C20', },
  buttonIcon: { marginRight: 8, },
  actionButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15, },
  infoText: { textAlign: 'center', fontSize: 16, marginTop: 30, color: '#555555', },
});