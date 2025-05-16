// app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity, // Import TouchableOpacity for the FAB
} from 'react-native';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig'; // Adjust path if needed
import { Post } from '../../types/post'; // Adjust path if needed
import { useAuth } from '../../context/AuthContext'; // To ensure user is logged in AND get isAdmin
import { Link } from 'expo-router'; // Import Link for navigation
import { MaterialIcons } from '@expo/vector-icons'; // For the FAB icon

export default function AnnouncementsScreen() {
  const { firebaseUser, loading: authLoading, isAdmin } = useAuth(); // <<<< Get isAdmin status
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    // ... (your existing fetchPosts logic remains the same)
    setLoadingPosts(true);
    try {
      const postsCollectionRef = collection(db, 'posts');
      const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedPosts: Post[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && firebaseUser) {
        fetchPosts();
    }
  }, [authLoading, firebaseUser, fetchPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts().then(() => setRefreshing(false));
  }, [fetchPosts]);

  const formatEventDate = (timestamp?: Timestamp): string => {
    // ... (your existing formatEventDate logic remains the same)
    if (!timestamp) return 'Date N/A';
    const date = timestamp.toDate();
    const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const dayMonthYear = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `${time} | ${dayMonthYear}`;
  };

  const renderPostCard = ({ item }: { item: Post }) => (
    // ... (your existing renderPostCard JSX remains the same)
    <View style={styles.card}>
      <Text style={styles.cardDateTime}>{formatEventDate(item.eventDate)}</Text>
      <Text style={styles.cardTitle}>{item.title || 'Announcement'}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
      <View style={styles.imagePlaceholder} />
    </View>
  );

  if (authLoading || (loadingPosts && posts.length === 0)) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {posts.length === 0 && !loadingPosts ? ( // Check !loadingPosts here
        <View style={styles.centered}>
          <Text style={styles.noPostsText}>No announcements yet. Check back later!</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostCard}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* ---- Conditionally Rendered FAB for Admins ---- */}
      {isAdmin && (
        <Link href="/createPost" asChild> 
        {/* This path assumes createPost.tsx is in app/(modals)/ and (modals) group doesn't add path segment */}
          <TouchableOpacity style={styles.fab}>
            <MaterialIcons name="add" size={28} color="white" />
          </TouchableOpacity>
        </Link>
      )}
      {/* --------------------------------------------- */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentContainer: {
    padding: 15,
    paddingBottom: 80, // Add padding at the bottom if FAB is overlaid
  },
  card: { /* ... your existing card styles ... */ 
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 15,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
    shadowRadius: 5, elevation: 3, borderWidth: 1, borderColor: '#E8E8E8',
  },
  cardDateTime: { /* ... */ fontSize: 13, color: '#6B7280', marginBottom: 8, },
  cardTitle: { /* ... */ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 6, },
  cardDescription: { /* ... */ fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 12, },
  imagePlaceholder: { /* ... */ height: 150, backgroundColor: '#E5E7EB', borderRadius: 6, },
  noPostsText: { /* ... */ fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 50, },
  fab: { // Style for the Floating Action Button
    position: 'absolute',
    right: 25,
    bottom: 25, // Adjust if it overlaps with your tab bar too much
    backgroundColor: '#007AFF', // Or your app's primary action color
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});