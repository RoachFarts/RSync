// app/(tabs)/lostAndFound.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform, // Used in styles
  Alert,
  // Image, // Intentionally not used as per "no images please"
} from 'react-native';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig'; // Adjust path if needed
import { LostFoundItem } from '../../types/lfitem'; // <<<< ENSURE FILENAME IS 'lostFoundItem.ts' and path is correct
import { useAuth } from '../../context/AuthContext';
import { Link, Redirect, useRouter } from 'expo-router'; // useRouter for potential programmatic navigation
import { MaterialIcons } from '@expo/vector-icons';

type FilterType = 'all' | 'lost' | 'found';

export default function LostAndFoundScreen() {
  const { firebaseUser, loading: authLoading } = useAuth(); // userProfile can be removed if not used directly here
  const router = useRouter(); // Keep for potential future use

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LostFoundItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const itemsCollectionRef = collection(db, 'lostAndFoundItems');
      const q = query(itemsCollectionRef, orderBy('dateReported', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedItems: LostFoundItem[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LostFoundItem));
      setItems(fetchedItems);
      // Filtering will be handled by the useEffect watching activeFilter and items
    } catch (error) {
      console.error("Error fetching lost and found items: ", error);
      Alert.alert("Error", "Could not fetch items. Please try again later.");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (firebaseUser) {
        fetchItems();
    }
  }, [firebaseUser, fetchItems]);

  useEffect(() => {
    console.log(`Filtering items for: ${activeFilter}`); // For debugging filter changes
    if (activeFilter === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.type === activeFilter));
    }
  }, [activeFilter, items]);

  const formatItemTimestamp = (timestamp?: Timestamp): string => {
    if (!timestamp) return 'Date N/A';
    const date = timestamp.toDate();
    const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const dayMonthYear = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `${time} | ${dayMonthYear}`;
  };

  const handleContact = (item: LostFoundItem) => {
    const contactInfo = item.userContact || 'Not provided by reporter.';
    Alert.alert(
        "Contact Reporter",
        `For item: ${item.itemName || 'Untitled Item'}\nContact: ${contactInfo}\n\n(Note: Please arrange safe and public meetup if necessary. Exercise caution.)`
    );
  };

  const handleReportPost = (item: LostFoundItem) => {
    Alert.alert(
        "Report Item",
        `Are you sure you want to report item "${item.itemName || 'this item'}"? This will notify administrators.`,
        [
            {text: "Cancel", style: "cancel"},
            {text: "Report", style: "destructive", onPress: () => {
                console.log(`Item reported: ${item.id} - ${item.itemName}`);
                Alert.alert("Item Reported", "Thank you, this item has been flagged for admin review.");
                // TODO: Implement actual report functionality (e.g., update item status to 'flagged' or send notification)
            }}
        ]
    );
  };


  const renderItemCard = ({ item }: { item: LostFoundItem }) => (
    <View style={styles.card}>
      <View style={styles.reporterInfo}>
        <View style={styles.avatarPlaceholder} /> 
        <View style={styles.reporterTextContainer}>
          <Text style={styles.itemReportedByLabel}>
            ITEM {item.type === 'found' ? 'FOUND' : 'LOST'} BY:
          </Text>
          <Text style={styles.reporterName}>{item.userName || 'Anonymous User'}</Text>
          <Text style={styles.reportTimestamp}>{formatItemTimestamp(item.dateReported)}</Text>
        </View>
      </View>

      <Text style={styles.itemTitle}>{item.itemName || 'Untitled Item'}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
      
      <View style={styles.itemImagePlaceholder}> 
        <Text style={styles.noImageText}>No Image Provided</Text>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={[styles.button, styles.contactButton]} onPress={() => handleContact(item)}>
          <Text style={styles.buttonText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.reportButton]} onPress={() => handleReportPost(item)}>
          <Text style={styles.buttonText}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (authLoading) {
    return <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}/>;
  }
  if (!firebaseUser) { 
    return <Redirect href="/login" />; // Or your login route, e.g. '/(auth)/login'
  }

  return (
    <View style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Lost and Found items</Text>

      <View style={styles.filterTabsContainer}>
        {(['all', 'found', 'lost'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
            onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingItems ? (
        <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}}/>
      ) : filteredItems.length === 0 ? (
        <Text style={styles.noItemsText}>
          No {activeFilter !== 'all' ? `${activeFilter} ` : ''}items found.
        </Text>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItemCard}
          keyExtractor={(item) => item.id || Math.random().toString()} // Ensure key is always unique string
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Ensure this path correctly navigates to your modal screen */}
      <Link href="/addLostFoundItem" asChild> 
        <TouchableOpacity style={styles.fab}>
          <MaterialIcons name="add" size={30} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: '#F0F2F5', },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginVertical: Platform.OS === 'ios' ? 15 : 20, },
  filterTabsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#DCDCDC', },
  filterTab: { paddingVertical: 10, paddingHorizontal: 15, },
  activeFilterTab: { borderBottomWidth: 3, borderBottomColor: '#007AFF', },
  filterTabText: { fontSize: 16, color: '#6B7280', },
  activeFilterTabText: { color: '#007AFF', fontWeight: '600', },
  listContainer: { paddingHorizontal: 15, paddingBottom: 80, },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#E8E8E8', },
  reporterInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D1D5DB', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  reporterTextContainer: { flex: 1, },
  itemReportedByLabel: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase', },
  reporterName: { fontSize: 14, fontWeight: '600', color: '#1F2937', },
  reportTimestamp: { fontSize: 12, color: '#6B7280', },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4, },
  itemDescription: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12, },
  itemImagePlaceholder: { height: 150, backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 12, justifyContent: 'center', alignItems: 'center', },
  noImageText: { fontSize: 14, color: '#A0A0A0', fontStyle: 'italic'}, // Changed text
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', },
  button: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', marginHorizontal: 5, },
  contactButton: { backgroundColor: '#007AFF', },
  reportButton: { backgroundColor: '#FF9500', },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 14, },
  fab: { position: 'absolute', right: 25, bottom: 25, backgroundColor: '#FF9500', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, },
  noItemsText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6B7280', },
});