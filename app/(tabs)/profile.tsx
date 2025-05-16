// app/(tabs)/profile.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  // Image, // Image component no longer needed
  FlatList,
  Platform,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { Pet } from '../../types/pet'; // Ensure this path is correct

// Placeholder images are no longer needed
// const defaultProfileImage = require('../../assets/images/default-profile.png');
// const defaultPetImage = require('../../assets/images/default-pet.png');

export default function ProfileScreen() {
  const { firebaseUser, userProfile, loading: authLoading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [refreshingPets, setRefreshingPets] = useState(false);

  const handleLogout = async () => { /* ... same as before ... */
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Logout Error", "Could not log out. Please try again.");
          }
        }
      }
    ]);
  };
  const handleEditProfile = () => { Alert.alert("Edit Profile", "Profile editing functionality coming soon!"); };
  // handleEditProfilePicture is no longer needed
  const handleRegisterPet = () => { Alert.alert("Register Pet", "Pet registration form/modal coming soon!"); };

  const fetchPets = useCallback(async () => { /* ... same as before ... */
    if (!firebaseUser) return;
    setLoadingPets(true);
    try {
      const petsCollectionRef = collection(db, 'users', firebaseUser.uid, 'pets');
      const q = query(petsCollectionRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedPets: Pet[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPets.push({ id: doc.id, ...doc.data() } as Pet);
      });
      setPets(fetchedPets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      Alert.alert("Error", "Could not fetch your pets.");
    } finally {
      setLoadingPets(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      fetchPets();
    }
  }, [firebaseUser, fetchPets]);

  const onRefreshPets = useCallback(() => {
    setRefreshingPets(true);
    fetchPets().then(() => setRefreshingPets(false));
  }, [fetchPets]);

  const handleDeletePet = async (petId: string) => { /* ... same as before ... */
    if (!firebaseUser) return;
    Alert.alert("Delete Pet", "Are you sure you want to delete this pet record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const petDocRef = doc(db, 'users', firebaseUser.uid, 'pets', petId);
            await deleteDoc(petDocRef);
            Alert.alert("Success", "Pet record deleted.");
            fetchPets();
          } catch (error) {
            console.error("Error deleting pet:", error);
            Alert.alert("Error", "Could not delete pet record.");
          }
        }
      }
    ]);
  };

  const getPetAge = (birthdate?: Timestamp): string => { /* ... same as before ... */
    if (!birthdate) return 'N/A';
    const today = new Date();
    const birthDate = birthdate.toDate();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    let ageMonths = today.getMonth() - birthDate.getMonth();
    if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--;
      ageMonths += 12;
    }
    if (ageYears > 0) {
      return `${ageYears} year${ageYears > 1 ? 's' : ''}${ageMonths > 0 ? ` ${ageMonths} month${ageMonths > 1 ? 's' : ''}` : ''} old`;
    } else if (ageMonths > 0) {
      return `${ageMonths} month${ageMonths > 1 ? 's' : ''} old`;
    } else {
        const ageDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
        return `${ageDays} day${ageDays > 1 ? 's':''} old`
    }
  };

  const renderPetCard = ({ item }: { item: Pet }) => (
    <View style={styles.petCard}>
      {/* Pet Image Removed */}
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petDetail}>Type: {item.type}</Text>
        {item.breed && <Text style={styles.petDetail}>Breed: {item.breed}</Text>}
        <Text style={styles.petDetail}>Age: {getPetAge(item.birthdate)}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeletePet(item.id)} style={styles.deletePetButton}>
        <MaterialIcons name="delete-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  if (authLoading || !firebaseUser || !userProfile) {
    return (
      <View style={[styles.pageContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.pageContainer} 
      contentContainerStyle={styles.scrollContentContainer}
      refreshControl={<RefreshControl refreshing={refreshingPets} onRefresh={onRefreshPets} />}
    >
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleEditProfile} style={styles.headerIcon}>
          <MaterialIcons name="edit" size={24} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      {/* Profile Picture Section REMOVED */}

      <View style={styles.userInfoSection}>
        <Text style={styles.userName}>{userProfile.fullName || 'N/A'}</Text>
        <Text style={styles.userInfoText}><Text style={styles.userInfoLabel}>Contact no:</Text> {userProfile.contactNo || 'N/A'}</Text>
        <Text style={styles.userInfoText}><Text style={styles.userInfoLabel}>Address:</Text> {userProfile.address || 'N/A'}</Text>
      </View>

      <View style={styles.petsSection}>
        <Text style={styles.sectionTitle}>PET RECORDS</Text>
        {loadingPets ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : pets.length === 0 ? (
          <Text style={styles.noPetsText}>No pets registered yet. Tap &ldquo;Register Pet&rdquo; to add your first pet!</Text>
        ) : (
          <FlatList
            data={pets}
            renderItem={renderPetCard}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>

      <TouchableOpacity style={styles.registerPetButton} onPress={handleRegisterPet}>
        <Text style={styles.registerPetButtonText}>Register Pet</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
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
    paddingBottom: 40, 
    alignItems: 'center', 
    paddingHorizontal: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 25, // Increased margin as profile pic is removed
    position: 'relative', 
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600', 
    color: '#1C1C1E',
  },
  headerIcon: {
    position: 'absolute',
    right: 0, 
    padding: 5,
  },
  // profilePicSection, profilePicContainer, profilePic, profilePicEditButton styles REMOVED
  userInfoSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
    width: '100%', // Ensure it takes width for centering text
  },
  userName: {
    fontSize: 24, // Made username slightly larger
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 10, // Increased margin
  },
  userInfoText: {
    fontSize: 16, // Increased size
    color: '#3C3C43',
    textAlign: 'center',
    marginBottom: 6, // Increased margin
    lineHeight: 24, // Increased line height
  },
  userInfoLabel: {
    fontWeight: '600',
  },
  petsSection: {
    width: '100%',
    marginBottom: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18, // Made section title slightly larger
    fontWeight: 'bold',
    color: '#3C3C43',
    marginBottom: 15,
    // textTransform: 'uppercase', // Removed for a softer look, can be re-added
  },
  petCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15, // Increased padding
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
  },
  // petImage style REMOVED
  petInfo: {
    flex: 1,
    justifyContent: 'center',
    // If petImage was providing left margin, petInfo might need it now, or ensure petCard padding handles it.
    // For now, assuming petCard padding is enough.
  },
  petName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  petDetail: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 18,
  },
  deletePetButton: {
    padding: 8,
    marginLeft: 10, 
  },
  noPetsText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  registerPetButton: {
    backgroundColor: '#FF9500', 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25, 
    alignItems: 'center',
    width: '80%', 
    alignSelf: 'center', 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  registerPetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#E5E5EA', 
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    width: '60%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6'
  },
  logoutButtonText: {
    color: '#FF3B30', 
    fontSize: 15,
    fontWeight: '600',
  },
});