// app/(tabs)/createPost.tsx
import React, { useState, useEffect } from 'react'; // Removed useCallback as it wasn't used for fetchPets here
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
import { useAuth } from '../../context/AuthContext'; // Adjust path
import { useRouter, Redirect } from 'expo-router'; // Added Redirect
import { Post } from '../../types/post'; // Adjust path

export default function CreatePostScreen() {
  const { firebaseUser, userProfile, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDateStr, setEventDateStr] = useState('');
  const [eventTimeStr, setEventTimeStr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!firebaseUser) {
      console.log("CreatePostScreen: No user logged in, redirecting to login.");
      router.replace('/(auth)/login');
      return;
    }
    if (!isAdmin) {
      console.log("CreatePostScreen: Access Denied for non-admin, redirecting.");
      Alert.alert(
        "Access Denied",
        "You do not have permission to create posts.",
        [{ text: "OK", onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }
        }]
      );
    }
  }, [authLoading, isAdmin, firebaseUser, router]);

  const handlePostSubmit = async () => {
    if (!isAdmin) {
      Alert.alert("Access Denied", "You do not have permission to create posts.");
      return;
    }

    if (!description.trim() || !eventDateStr.trim() || !eventTimeStr.trim()) {
      Alert.alert('Missing Information', 'Please fill in the description, event date, and event time.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!dateRegex.test(eventDateStr)) {
      Alert.alert('Invalid Date Format', 'Please enter the date as YYYY-MM-DD.');
      return;
    }
    if (!timeRegex.test(eventTimeStr)) {
      Alert.alert('Invalid Time Format', 'Please enter the time as HH:MM (24-hour).');
      return;
    }

    setLoading(true);
    try {
      if (!firebaseUser) {
        throw new Error("User not authenticated.");
      }

      const [year, month, day] = eventDateStr.split('-').map(Number);
      const [hours, minutes] = eventTimeStr.split(':').map(Number);
      const jsEventDate = new Date(year, month - 1, day, hours, minutes);

      if (isNaN(jsEventDate.getTime())) {
        Alert.alert('Invalid Date/Time', 'The date or time entered is not valid.');
        setLoading(false);
        return;
      }

      // --- EDITED newPostData object creation (userProfilePic logic removed) ---
      const newPostData: any = {
        userId: firebaseUser.uid,
        userName: userProfile?.fullName || firebaseUser.email || 'Anonymous',
        description: description.trim(),
        eventDate: Timestamp.fromDate(jsEventDate),
        createdAt: serverTimestamp() as Timestamp,
      };

      // REMOVED: Conditional add for userProfilePic
      // if (userProfile?.profilePictureUrl) {
      //   newPostData.userProfilePic = userProfile.profilePictureUrl;
      // }

      const trimmedTitle = title.trim();
      if (trimmedTitle) {
        newPostData.title = trimmedTitle;
      }
      // --- END OF EDITED newPostData object creation ---

      const postsCollectionRef = collection(db, 'posts');
      // Adjusted cast to reflect that userProfilePic is no longer intentionally added here
      await addDoc(postsCollectionRef, newPostData as Omit<Post, 'id' | 'userProfilePic'> & { title?: string });

      Alert.alert('Post Created!', 'Your event post has been successfully submitted.');
      setTitle('');
      setDescription('');
      setEventDateStr('');
      setEventTimeStr('');
      router.push('/(tabs)');

    } catch (error: any) {
      console.error("Error creating post: ", error);
      Alert.alert('Error', `Could not create post. ${error.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isAdmin && firebaseUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.pageTitle}>Access Denied</Text>
        <Text>You do not have permission to create posts.</Text>
      </View>
    );
  }
  
  if (!firebaseUser) {
      return <Redirect href="/login"/>;
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Create New Event Post (Admin)</Text>
      {/* ... Your form JSX ... */}
      <Text style={styles.label}>Event Title (Optional)</Text>
      <TextInput style={styles.input} placeholder="e.g., Barangay Basketball Tournament" placeholderTextColor="#888" value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Event Description*</Text>
      <TextInput style={[styles.input, styles.multilineInput]} placeholder="Describe the event or post..." placeholderTextColor="#888" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
      <Text style={styles.label}>Event Date*</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#888" value={eventDateStr} onChangeText={setEventDateStr} keyboardType="numeric" />
      <Text style={styles.label}>Event Time* (24-hour format)</Text>
      <TextInput style={styles.input} placeholder="HH:MM (e.g., 14:30 for 2:30 PM)" placeholderTextColor="#888" value={eventTimeStr} onChangeText={setEventTimeStr} keyboardType="numeric" />
      <TouchableOpacity style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]} onPress={handlePostSubmit} disabled={loading}>
        {loading ? (<ActivityIndicator size="small" color="#FFFFFF" />) : (<Text style={styles.buttonText}>Submit Post</Text>)}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ... Your styles (styles.scrollView, styles.container, etc.) remain the same ...
const styles = StyleSheet.create({
  scrollView: { backgroundColor: '#F0F2F5', },
  container: { flexGrow: 1, padding: 20, },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginBottom: 25, },
  label: { fontSize: 15, color: '#3C3C43', marginBottom: 6, marginTop: 12, fontWeight: '600', },
  input: { backgroundColor: '#FFFFFF', color: '#1C1C1E', paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 10, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DCDCDC', },
  multilineInput: { minHeight: 100, textAlignVertical: 'top', },
  button: { paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginTop: 30, width: '100%', },
  submitButton: { backgroundColor: '#007AFF', },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', },
  buttonDisabled: { opacity: 0.7, },
});