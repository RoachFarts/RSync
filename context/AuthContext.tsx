// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseAuthUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // getDoc is also fine if you don't need real-time role updates
import { auth, db } from '../config/firebaseConfig';
import { UserProfile } from '../types/user';

interface AuthContextType {
  firebaseUser: FirebaseAuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean; // New: To indicate if the current user is an admin
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Initialize isAdmin

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setIsAdmin(false); // Reset isAdmin on logout
        // setLoading(false); // loading will be handled by profile fetch
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      setLoading(true); // Start loading when firebaseUser is available
      const userProfileRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeProfile = onSnapshot(userProfileRef, (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setUserProfile(profileData);
          setIsAdmin(profileData.role === 'admin'); // Check for admin role
        } else {
          setUserProfile(null);
          setIsAdmin(false);
          console.warn("User document doesn't exist in Firestore for UID:", firebaseUser.uid);
        }
        setLoading(false); // Stop loading after profile is fetched or not found
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      });
      return () => unsubscribeProfile();
    } else {
      // No Firebase user, ensure everything is reset
      setUserProfile(null);
      setIsAdmin(false);
      setLoading(false);
    }
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  // ... (same as before)
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};