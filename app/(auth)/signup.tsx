// app/(auth)/signup.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig'; // Adjust path if firebaseConfig is elsewhere
import { UserProfile } from '../../types/user';   // Adjust path to your types
import { useRouter } from 'expo-router';
import Checkbox from 'expo-checkbox';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !contactNo || !address || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Agreement Required', 'Please agree to the terms by checking the box (simulating ID verification).');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        fullName,
        contactNo,
        address,
        agreedToTerms,
        status: 'pending_approval',
        createdAt: serverTimestamp() as Timestamp,
        role: 'user', // Default role for new users
      };
      await setDoc(userDocRef, newUserProfile);

      Alert.alert(
        'Signup Successful',
        'Your account has been created and is pending administrator approval. Please try logging in later.'
      );
      router.replace('/(auth)/login'); // Navigate to login after successful signup

    } catch (error: any) {
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      Alert.alert('Sign Up Error', errorMessage);
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  }; // Ensure this is the ONLY handleSignUp function

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* Your JSX for input fields and button remains the same */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#888"
        value={fullName}
        onChangeText={setFullName}
      />
      {/* ... other TextInput fields for email, contactNo, address, password, confirmPassword ... */}
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Text style={styles.label}>Contact No.</Text>
      <TextInput style={styles.input} placeholder="Contact No." placeholderTextColor="#888" value={contactNo} onChangeText={setContactNo} keyboardType="phone-pad" />
      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#888" value={address} onChangeText={setAddress} multiline />
      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#888" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      <View style={styles.checkboxContainer}>
        <Checkbox
          style={styles.checkbox}
          value={agreedToTerms}
          onValueChange={setAgreedToTerms}
          color={agreedToTerms ? '#007AFF' : undefined}
        />
        <Text style={styles.checkboxLabel}>
          I confirm my information is accurate and I acknowledge the ID verification requirement (simulated).
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.registerButton, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Your styles (StyleSheet.create({ ... })) remain the same
const styles = StyleSheet.create({
  scrollView: { backgroundColor: '#1A1A1A', },
  container: { flexGrow: 1, justifyContent: 'center', padding: 25, },
  label: { fontSize: 14, color: '#FFFFFF', marginBottom: 5, marginTop: 10, },
  input: { backgroundColor: '#2C2C2E', color: '#FFFFFF', paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 15 : 10, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#3A3A3C', },
  checkboxContainer: { flexDirection: 'row', marginVertical: 20, alignItems: 'center', },
  checkbox: { marginRight: 10, borderColor: '#007AFF', borderWidth: 1, borderRadius: 3, width: 20, height: 20, },
  checkboxLabel: { fontSize: 14, color: '#E5E5EA', flexShrink: 1, },
  button: { paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, width: '100%', },
  registerButton: { backgroundColor: '#007AFF', },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', },
  buttonDisabled: { opacity: 0.5, },
});