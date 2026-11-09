import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserRole } from '../types';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  photoUrl?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (data.role === 'customer' || data.status === 'suspended') {
              // Customers and suspended accounts are not authorized to use the management dashboard
              await firebaseSignOut(auth);
              setUserProfile(null);
            } else {
              setUserProfile(data);
            }
          } else {
            // User authenticated in Firebase Auth but has no administrative profile in Firestore
            await firebaseSignOut(auth);
            setUserProfile(null);
          }
        } catch (err) {
          console.error('[AuthContext] Error verifying administrative privileges:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const user = cred.user;
      setCurrentUser(user);

      // Verify administrative/instructor role in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('Access denied. No studio profile found for this account.');
      }

      const data = userDoc.data() as UserProfile;
      if (data.role === 'customer') {
        await firebaseSignOut(auth);
        throw new Error('Access denied. Customer accounts cannot access the administrative dashboard.');
      }

      if (data.status === 'suspended') {
        await firebaseSignOut(auth);
        throw new Error('Account suspended. Please contact the system administrator.');
      }

      setUserProfile(data);
    } catch (err: any) {
      throw new Error(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (_) {}
    setCurrentUser(null);
    setUserProfile(null);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send password reset instructions.');
    }
  };

  const isAdmin = userProfile?.role === 'admin';
  const isInstructor = userProfile?.role === 'instructor';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isInstructor,
        signIn,
        signOut,
        sendPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

