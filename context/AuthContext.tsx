import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseAuthUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // getDoc is also fine if you don't need real-time role updates
import { auth, db } from '../config/firebaseConfig'; // Ensure this path is correct for your project
import { UserProfile } from '../types/user'; // Ensure this path is correct

interface AuthContextType {
  firebaseUser: FirebaseAuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Initialize loading to true
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log("AuthContext: Setting up onAuthStateChanged listener."); // Log listener setup
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log("AuthContext: onAuthStateChanged triggered. User:", user ? user.uid : null); // Log auth state change
      setFirebaseUser(user);
      if (!user) {
        // User is signed out
        console.log("AuthContext: User signed out. Resetting profile and admin status."); // Log sign out
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false); // Stop loading if user signs out and no profile to fetch
      }
      // If user is signed in, the other useEffect will handle profile fetching and loading state
    });

    return () => {
      console.log("AuthContext: Unsubscribing onAuthStateChanged listener."); // Log unsubscribe
      unsubscribeAuth();
    };
  }, []); // Empty dependency array, runs once on mount

  useEffect(() => {
    if (firebaseUser) {
      console.log(`AuthContext: firebaseUser detected (UID: ${firebaseUser.uid}). Attempting to fetch profile.`);
      setLoading(true); // Set loading to true when we start fetching a profile
      const userProfileRef = doc(db, 'users', firebaseUser.uid);

      const unsubscribeProfile = onSnapshot(userProfileRef, (docSnap) => {
        console.log(`AuthContext: Profile snapshot received for UID ${firebaseUser.uid}. Document exists: ${docSnap.exists()}`);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          // Using JSON.stringify to log the whole object clearly, null and 2 for pretty print
          console.log("AuthContext: Profile data found:", JSON.stringify(profileData, null, 2));
          setUserProfile(profileData);
          const isAdminUser = profileData.role === 'admin';
          setIsAdmin(isAdminUser);
          console.log(`AuthContext: isAdmin set to: ${isAdminUser} (Role from DB: ${profileData.role})`);
        } else {
          console.warn(`AuthContext: User document NOT FOUND in Firestore for UID: ${firebaseUser.uid}`);
          setUserProfile(null);
          setIsAdmin(false);
        }
        setLoading(false); // Stop loading once profile data is processed (or not found)
      }, (error) => {
        console.error("AuthContext: Error fetching user profile snapshot:", error);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false); // Stop loading on error
      });

      return () => {
        console.log(`AuthContext: Unsubscribing profile listener for UID: ${firebaseUser.uid}`);
        unsubscribeProfile();
      };
    } else {
      // This case is now primarily handled by the onAuthStateChanged effect when user is null
      // However, if firebaseUser becomes null for other reasons, this ensures states are reset.
      if (!loading && (userProfile !== null || isAdmin !== false)) { // Only log if there's a change to make and not already loading
          console.log("AuthContext: No firebaseUser. Ensuring profile and admin status are reset.");
          setUserProfile(null);
          setIsAdmin(false);
      }
      // If firebaseUser is null from the start or after logout, setLoading(false)
      // would have been called by the onAuthStateChanged effect.
      // If we reach here and loading is true, it might be an initial state before onAuthStateChanged fires.
      // To ensure loading eventually becomes false:
      if (loading && firebaseUser === null) { // If still loading but no user (e.g. initial load, no persisted session)
        setLoading(false);
      }
    }
  }, [firebaseUser]); // Re-run this effect when firebaseUser changes

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};