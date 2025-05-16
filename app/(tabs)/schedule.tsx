// app/(tabs)/schedule.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars'; // Import Calendar components
import { collection, query, getDocs, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig'; // Adjust path
import { Post } from '../../types/post'; // Adjust path
import { useAuth } from '../../context/AuthContext'; // Ensure user is logged in to view

// Re-using a similar card style from AnnouncementsScreen for consistency
// You might want to extract PostCard into a reusable component later

export default function ScheduleScreen() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today in YYYY-MM-DD format
  const [postsForSelectedDate, setPostsForSelectedDate] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]); // To store all fetched posts for client-side filtering
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [markedDates, setMarkedDates] = useState({});

  const fetchAllPostsAndMarkDates = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const postsCollectionRef = collection(db, 'posts');
      const q = query(postsCollectionRef, orderBy('eventDate', 'asc')); // Fetch ordered by eventDate
      const querySnapshot = await getDocs(q);
      const fetchedPosts: Post[] = [];
      const newMarkedDates: any = {};

      querySnapshot.forEach((doc) => {
        const post = { id: doc.id, ...doc.data() } as Post;
        fetchedPosts.push(post);
        // Mark dates that have events
        if (post.eventDate) {
          const eventDateString = post.eventDate.toDate().toISOString().split('T')[0];
          newMarkedDates[eventDateString] = { marked: true, dotColor: '#007AFF' }; // Blue dot for events
        }
      });
      setAllPosts(fetchedPosts);
      setMarkedDates(newMarkedDates);
    } catch (error) {
      console.error("Error fetching all posts: ", error);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && firebaseUser) {
      fetchAllPostsAndMarkDates();
    }
  }, [authLoading, firebaseUser, fetchAllPostsAndMarkDates]);

  // Filter posts when selectedDate or allPosts change
  useEffect(() => {
    if (selectedDate && allPosts.length > 0) {
      const filtered = allPosts.filter(post => {
        if (!post.eventDate) return false;
        const eventDateString = post.eventDate.toDate().toISOString().split('T')[0];
        return eventDateString === selectedDate;
      });
      setPostsForSelectedDate(filtered);

      // Update marked dates to highlight the selected day
      setMarkedDates(prevMarked => ({
        ...prevMarked, // Keep existing event markers
        [selectedDate]: { ...prevMarked[selectedDate], selected: true, selectedColor: '#007AFF' } // Highlight selected day
      }));

    } else {
      setPostsForSelectedDate([]); // Clear if no date selected or no posts
    }
  }, [selectedDate, allPosts]);


  const onDayPress = (day: DateData) => {
    console.log('selected day', day.dateString);
    setSelectedDate(day.dateString); // day.dateString is in 'YYYY-MM-DD' format
  };

  const formatEventTime = (timestamp?: Timestamp): string => {
    if (!timestamp) return 'Time N/A';
    return timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  const renderPostCard = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      {/* Displaying event time more prominently as date is already selected */}
      <Text style={styles.cardTime}>{formatEventTime(item.eventDate)}</Text>
      <Text style={styles.cardTitle}>{item.title || 'Event Details'}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
      {/* Placeholder for image */}
      <View style={styles.imagePlaceholder} />
    </View>
  );


  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Event Schedule</Text>
      <Calendar
        current={selectedDate} // Make calendar show the selected date
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates, // Dots for all events
          [selectedDate]: { // Override for selected day
            ...(markedDates[selectedDate] || {}), // Keep existing event marker if any
            selected: true,
            selectedColor: '#007AFF', // Blue for selected day
            disableTouchEvent: true, // Optional: if you don't want to re-trigger onDayPress for already selected
          }
        }}
        theme={{
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#007AFF',
          arrowColor: '#007AFF',
          dotColor: '#007AFF', // Default dot color if not specified in markedDates
          // ... other theme properties
        }}
        style={styles.calendar}
      />

      <View style={styles.postsListContainer}>
        {loadingPosts && postsForSelectedDate.length === 0 ? ( // Show loader only if no posts are displayed yet for the date
          <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 20 }}/>
        ) : postsForSelectedDate.length > 0 ? (
          <FlatList
            data={postsForSelectedDate}
            renderItem={renderPostCard}
            keyExtractor={(item) => item.id || ''}
            ListHeaderComponent={<Text style={styles.selectedDateTitle}>Events for {new Date(selectedDate + 'T00:00:00').toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}:</Text>}
          />
        ) : (
          <Text style={styles.noEventsText}>No events scheduled for this day.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginVertical: 20,
  },
  calendar: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  postsListContainer: {
    paddingHorizontal: 15,
    marginTop:10,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 15,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardTime: {
    fontSize: 14,
    color: '#007AFF', // Blue for time
    fontWeight: '600',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 10,
  },
  imagePlaceholder: {
    height: 120, // Adjust as needed
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  noEventsText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
});