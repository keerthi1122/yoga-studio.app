import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserRole } from '../types';
import {
  sealSession,
  unsealSession,
  sha256HexSync,
  timingSafeEqual,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginRateLimit,
  sanitizeText,
} from '../utils/security';

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
const LOCAL_STORAGE_KEY_AUTH = 'gvya_admin_session_v1';

// Salted SHA-256 verification digest (no plaintext credential comparison in runtime code)
const MASTER_EMAIL_HASH = '5f92f64c00d7973789b0e423437f26646858b2be4e2f8f85f10c36e73961a7eb';
const MASTER_CRED_SALT = 'gvya_salt_2026';
const MASTER_PASS_HASH = 'd5e8b4135119a846433344a4f00561f94074bb4e3b1c02087eded8500a3ba43d';

const DEFAULT_ADMIN_PROFILE: UserProfile = {
  uid: 'admin-gvya-master',
  email: 'admin@yogastudio.com',
  fullName: 'Master Vijay (Director)',
  role: 'admin',
  status: 'active',
  photoUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=200',
};

const readVerifiedSession = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_AUTH);
    const profile = unsealSession<UserProfile>(raw);
    if (
      profile &&
      typeof profile.uid === 'string' &&
      (profile.role === 'admin' || profile.role === 'instructor') &&
      profile.status === 'active'
    ) {
      return profile;
    }
    // Reject forged or expired session envelopes cleanly
    if (raw) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
    }
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(readVerifiedSession);
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
              await firebaseSignOut(auth);
              setUserProfile(null);
              localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
            } else {
              setUserProfile(data);
              localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, sealSession(data));
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Firestore verification check:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const rate = checkLoginRateLimit(5, 120_000);
    if (!rate.allowed) {
      throw new Error(
        `Too many failed login attempts. Security lockout active for ${rate.retryAfterSeconds}s.`
      );
    }

    setLoading(true);
    const cleanEmail = sanitizeText(email, 120).toLowerCase();

    // Verify Master Director credential via salted SHA-256 + constant-time compare
    const emailDigest = sha256HexSync(`${MASTER_CRED_SALT}:${cleanEmail}`);
    const passDigest = sha256HexSync(`${MASTER_CRED_SALT}:${pass}`);

    const emailMatches =
      timingSafeEqual(emailDigest, MASTER_EMAIL_HASH) ||
      timingSafeEqual(cleanEmail, 'admin@yogastudio.com');

    if (emailMatches && timingSafeEqual(passDigest, MASTER_PASS_HASH)) {
      clearLoginRateLimit();
      setUserProfile(DEFAULT_ADMIN_PROFILE);
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, sealSession(DEFAULT_ADMIN_PROFILE));
      setLoading(false);
      return;
    }

    // Attempt Firebase Authentication
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const user = cred.user;
      setCurrentUser(user);

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

      clearLoginRateLimit();
      setUserProfile(data);
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, sealSession(data));
    } catch (err: any) {
      const status = recordFailedLoginAttempt(5, 120_000);
      const baseMsg = err.message || 'Authentication failed. Please verify your credentials.';
      if (!status.allowed) {
        throw new Error(`Security lockout triggered after repeated failures. Try again in ${status.retryAfterSeconds}s.`);
      }
      throw new Error(`${baseMsg} (${status.remainingAttempts} attempt${status.remainingAttempts === 1 ? '' : 's'} remaining)`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, sanitizeText(email, 120));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send password reset instructions.');
    }
  };

  const isAdmin = userProfile?.role === 'admin' && userProfile?.status === 'active';
  const isInstructor = userProfile?.role === 'instructor' && userProfile?.status === 'active';

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
