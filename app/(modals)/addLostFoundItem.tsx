// app/(modals)/addLostFoundItem.tsx
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
import { useAuth } from '../../context/AuthContext'; // Adjust path
import { useRouter, Stack } from 'expo-router'; // Import Stack for screen options
import { LostFoundItem } from '../../types/lfitem'; // Adjust path

type ItemReportType = 'lost' | 'found';

export default function AddLostFoundItemScreen() {
  const { firebaseUser, userProfile } = useAuth();
  const router = useRouter();

  const [itemType, setItemType] = useState<ItemReportType>('found'); // Default to 'found'
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [locationLostOrFound, setLocationLostOrFound] = useState('');
  const [dateLostOrFoundStr, setDateLostOrFoundStr] = useState(''); // YYYY-MM-DD
  const [userContact, setUserContact] = useState(''); // Optional contact for this item
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please provide at least an item name and description.');
      return;
    }
    // Optional: More specific validation for date if provided
    if (dateLostOrFoundStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateLostOrFoundStr)) {
        Alert.alert('Invalid Date', 'If providing a date, please use YYYY-MM-DD format.');
        return;
    }


    setLoading(true);
    try {
      if (!firebaseUser) {
        throw new Error("User not authenticated. Please log in.");
      }

      let eventTimestamp: Timestamp | undefined = undefined;
      if (dateLostOrFoundStr.trim()) {
        const [year, month, day] = dateLostOrFoundStr.split('-').map(Number);
        const jsDate = new Date(year, month - 1, day); // month is 0-indexed
        if (!isNaN(jsDate.getTime())) {
          eventTimestamp = Timestamp.fromDate(jsDate);
        } else {
          Alert.alert('Invalid Date', 'The date entered for when the item was lost/found is not valid.');
          setLoading(false);
          return;
        }
      }

      const newItemData: Omit<LostFoundItem, 'id'> = {
        userId: firebaseUser.uid,
        userName: userProfile?.fullName || firebaseUser.email || 'Anonymous Reporter',
        userContact: userContact.trim() || undefined, // Store if provided, else omit
        type: itemType,
        itemName: itemName.trim(),
        description: description.trim(),
        dateReported: serverTimestamp() as Timestamp,
        status: 'active', // Initial status for a new report
        // imageUrl will be omitted as per "no images please"
      };

      if (eventTimestamp) {
        newItemData.dateLostOrFound = eventTimestamp;
      }
      if (locationLostOrFound.trim()) {
        newItemData.locationLostOrFound = locationLostOrFound.trim();
      }

      const itemsCollectionRef = collection(db, 'lostAndFoundItems');
      await addDoc(itemsCollectionRef, newItemData);

      Alert.alert('Item Reported', 'Your lost/found item report has been submitted successfully!');
      router.back(); // Go back (close modal) after successful submission

    } catch (error: any) {
      console.error("Error reporting item: ", error);
      Alert.alert('Error', `Could not submit your report. ${error.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.scrollContentContainer}>
      <Stack.Screen options={{ title: 'Report Lost or Found Item' }} />
      {/* If you want a custom header title for the modal, use Stack.Screen */}
      {/* <Text style={styles.pageTitle}>Report Lost or Found Item</Text> */}

      <View style={styles.typeSelectorContainer}>
        <TouchableOpacity
          style={[styles.typeButton, itemType === 'found' && styles.activeTypeButton]}
          onPress={() => setItemType('found')}>
          <Text style={[styles.typeButtonText, itemType === 'found' && styles.activeTypeButtonText]}>I Found Something</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, itemType === 'lost' && styles.activeTypeButton]}
          onPress={() => setItemType('lost')}>
          <Text style={[styles.typeButtonText, itemType === 'lost' && styles.activeTypeButtonText]}>I Lost Something</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Item Name*</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Black Wallet, Keys, Yellow Water Bottle"
        value={itemName}
        onChangeText={setItemName}
      />

      <Text style={styles.label}>Description*</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Provide details about the item, distinctive features, etc."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Date Lost/Found (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={dateLostOrFoundStr}
        onChangeText={setDateLostOrFoundStr}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Location Lost/Found (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., University Library, 2nd Floor"
        value={locationLostOrFound}
        onChangeText={setLocationLostOrFound}
      />
      
      <Text style={styles.label}>Your Contact Info (Optional, for this item)</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone or email (will be shown if someone contacts)"
        value={userContact}
        onChangeText={setUserContact}
        autoCapitalize="none"
      />


      <TouchableOpacity
        style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Consistent light theme
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at the bottom
  },
  // pageTitle: { // Use Stack.Screen options for title instead
  //   fontSize: 22,
  //   fontWeight: 'bold',
  //   color: '#1C1C1E',
  //   textAlign: 'center',
  //   marginBottom: 25,
  // },
  typeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTypeButtonText: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 15,
    color: '#3C3C43',
    marginBottom: 6,
    marginTop: 12,
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
    minHeight: 100,
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