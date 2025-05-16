// app/(tabs)/explore.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal, // <<<< IMPORT MODAL
  Alert, // Keep Alert for other uses
} from 'react-native';
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { DocumentRequest } from '../../types/docReq'; // Ensure path is correct
import { useAuth } from '../../context/AuthContext';
import { useRouter, Redirect, Link } from 'expo-router'; // Keep Link if used, useRouter for navigation
import { MaterialIcons } from '@expo/vector-icons'; // For FAB icon

// Original Expo starter components for Admin View (if still used for admins)
import { Image } from 'expo-image';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';


export default function DocumentRequestsScreen() {
  const { firebaseUser, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRequestMenuVisible, setIsRequestMenuVisible] = useState(false); // State for modal menu

  const fetchUserRequests = useCallback(async () => {
    // ... (fetchUserRequests logic remains the same)
    if (!firebaseUser) return;
    setLoadingRequests(true);
    try {
      const requestsCollectionRef = collection(db, 'documentRequests');
      const q = query(
        requestsCollectionRef,
        where('userId', '==', firebaseUser.uid),
        orderBy('dateRequested', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedRequests: DocumentRequest[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRequests.push({ id: doc.id, ...doc.data() } as DocumentRequest);
      });
      setRequests(fetchedRequests);
    } catch (error) {
      console.error("Error fetching document requests: ", error);
    } finally {
      setLoadingRequests(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (firebaseUser && !isAdmin) {
      fetchUserRequests();
    } else if (isAdmin) {
      // Admin view doesn't fetch user-specific requests in this manner
      setLoadingRequests(false);
    }
  }, [firebaseUser, isAdmin, authLoading, fetchUserRequests]);

  const onRefresh = useCallback(() => {
    // ... (onRefresh logic remains the same)
    if (firebaseUser && !isAdmin) {
      setRefreshing(true);
      fetchUserRequests().then(() => setRefreshing(false));
    }
  }, [firebaseUser, isAdmin, fetchUserRequests]);

  const formatDisplayDate = (timestamp?: Timestamp | null): string => {
    // ... (formatDisplayDate logic remains the same)
    if (!timestamp) return '--';
    return timestamp.toDate().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleRequestTypeSelection = (requestTypePath: string, formTitle: string) => {
    setIsRequestMenuVisible(false); // Close the menu modal
    // Navigate to the specific form modal
    // These screens (e.g., requestBarangayPermit) will be in app/(modals)/
    router.push({ pathname: requestTypePath, params: { title: formTitle } });
    console.log(`Navigating to ${requestTypePath} with title ${formTitle}`);
  };

  const renderRequestCard = ({ item }: { item: DocumentRequest }) => (
    // ... (renderRequestCard JSX remains the same)
    <View style={styles.card}>
      <Text style={styles.cardRequestId}>Request ID: {item.requestId}</Text>
      <Text style={styles.cardDocumentName}>{item.documentName}</Text>
      <Text style={styles.cardPurpose}>{item.purpose}</Text>
      <View style={styles.detailRow}><Text style={styles.detailLabel}>Date Requested:</Text><Text style={styles.detailValue}>{formatDisplayDate(item.dateRequested)}</Text></View>
      <View style={styles.detailRow}><Text style={styles.detailLabel}>Fee:</Text><Text style={styles.detailValue}>Php {item.fee.toFixed(2)}</Text></View>
      <View style={styles.detailRow}><Text style={styles.detailLabel}>Status:</Text><Text style={[styles.detailValue, styles[`status${item.status.replace(/\s+/g, '')}` as keyof typeof styles]]}>{item.status}</Text></View>
      <View style={styles.detailRow}><Text style={styles.detailLabel}>Date Released:</Text><Text style={styles.detailValue}>{formatDisplayDate(item.dateReleased)}</Text></View>
    </View>
  );

  if (authLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }
  if (!firebaseUser) {
    return <Redirect href="/login" />; // Or your login path
  }

  // ADMIN VIEW
  if (isAdmin) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      >
        <ThemedView style={styles.titleContainer_original}>
          <ThemedText type="title">Explore (Admin View)</ThemedText>
        </ThemedView>
        <ThemedText>Admins see the original explore content or specific admin tools.</ThemedText>
        {/* ... other original collapsible items ... */}
      </ParallaxScrollView>
    );
  }

  // NON-ADMIN VIEW (Document Requests List with FAB)
  return (
    <View style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Document Requests</Text>
      {loadingRequests ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : requests.length === 0 ? (
        <Text style={styles.noItemsText}>You have not made any document requests yet. Press '+' to make a new request.</Text>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestCard}
          keyExtractor={(item) => item.id || item.requestId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* FAB to open request menu modal - only for non-admins */}
      {!isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={() => setIsRequestMenuVisible(true)}>
          <MaterialIcons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}

      {/* Modal for Document Request Type Selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRequestMenuVisible}
        onRequestClose={() => {
          setIsRequestMenuVisible(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Document/Service</Text>
            
            <TouchableOpacity style={styles.menuButton} onPress={() => handleRequestTypeSelection('/requestBarangayPermit', 'Barangay Permit')}>
              <Text style={styles.menuButtonText}>Barangay Permit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => handleRequestTypeSelection('/requestFacilityReservation', 'Facility Reservation')}>
              <Text style={styles.menuButtonText}>Facility Reservation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => handleRequestTypeSelection('/requestBusinessClearance', 'Business Clearance')}>
              <Text style={styles.menuButtonText}>Business Clearance</Text>
            </TouchableOpacity>
            {/* Add more document types here */}

            <TouchableOpacity style={[styles.menuButton, styles.cancelButton]} onPress={() => setIsRequestMenuVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  // ... (keep all your existing styles for pageContainer, pageTitle, listContainer, card, etc.)
  pageContainer: { flex: 1, backgroundColor: '#F0F2F5', },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', paddingTop: Platform.OS === 'ios' ? 30 : 20, paddingBottom: 15, },
  listContainer: { paddingHorizontal: 15, paddingBottom: 80, }, // Added paddingBottom for FAB
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 20, marginBottom: 15, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#EAEAEA', },
  cardRequestId: { fontSize: 13, color: '#6B7280', textAlign: 'right', marginBottom: 8, },
  cardDocumentName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4, },
  cardPurpose: { fontSize: 14, color: '#4B5563', marginBottom: 12, },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, },
  detailLabel: { fontSize: 14, color: '#6B7280', marginRight: 10, },
  detailValue: { fontSize: 14, color: '#374151', fontWeight: '500', textAlign: 'right', flexShrink: 1, },
  statusPending: { color: '#F59E0B', fontWeight: 'bold' },
  statusProcessing: { color: '#3B82F6', fontWeight: 'bold' },
  statusReleased: { color: '#10B981', fontWeight: 'bold' },
  statusRejected: { color: '#EF4444', fontWeight: 'bold' }, // Added
  noItemsText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6B7280', },

  // FAB Style (keep from previous or adjust)
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: '#007AFF', // Changed to blue for consistency, or keep orange
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // Modal Menu Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Positions modal at the bottom
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Padding for home indicator on iOS
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  menuButton: {
    width: '90%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 17,
    color: '#007AFF', // Blue text for options
  },
  cancelButton: {
    borderBottomWidth: 0, // No border for the last button
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#FF3B30', // Red text for cancel
    fontWeight: '600',
  },

  // Styles from original Explore screen for Admin View
  titleContainer_original: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
  },
});