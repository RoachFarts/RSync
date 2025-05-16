import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig'; // Adjust path
import { useRouter } from 'expo-router';

// Placeholder for your logo - replace with your actual logo path
//const logoUri = require('../../assets/images/ResidenSync_Logo.png'); // Adjust path to your logo

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, the AuthContext and redirection logic in app/_layout.tsx
      // will take over and navigate the user appropriately based on their status.
      // No explicit router.replace() here is needed if _layout.tsx handles it.
      console.log('Login successful');
    } catch (error: any) {
      let errorMessage = 'Invalid email or password. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email format.';
      }
      Alert.alert('Login Error', errorMessage);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // For now, a placeholder. You can implement this later.
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented here.');
    // Example: router.push('/(auth)/forgot-password');
  };

  return (
    <View style={styles.container}>
      {/* <Image source={logoUri} style={styles.logo} resizeMode="contain" /> */}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordButton}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.loginButton, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log in'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.registerNavButton]}
        onPress={() => router.push('/(auth)/signup')}
      >
        <Text style={[styles.buttonText, styles.registerNavButtonText]}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#1A1A1A', // Dark background to match image
  },
  logo: {
    width: 200,
    height: 100, // Adjust based on your logo's aspect ratio
    alignSelf: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F0F2F5',
    color: '#000000FF',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: '#007AFF', // Blue link color
    fontSize: 14,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#007AFF', // Blue button
  },
  registerNavButton: {
    backgroundColor: '#FF9500', // Orange button
    marginTop: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerNavButtonText: {
    // If you want different text color for register button, define here
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});