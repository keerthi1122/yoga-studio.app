import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  query, 
  where, 
  addDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, UserStatus } from '../types';
import { readLocalCollection, writeLocalCollection, subscribeToLocalSync } from '../utils/localStoreSync';
import { sanitizeText } from '../utils/security';

const COLLECTION_NAME = 'users';
const LOCAL_STORAGE_KEY_CUSTOMERS = 'gvya_customers_cache_v1';

export const DEFAULT_GVYA_CUSTOMERS: User[] = [
  {
    uid: 'u-gvya-001',
    fullName: 'Ramesh Sundaram',
    email: 'ramesh.sundaram@gmail.com',
    phone: '+91 98410 54321',
    role: 'customer',
    status: 'active',
    activeMembershipId: 'pro-1y',
    activeMembershipName: 'Pro Classes with Props — 1 Year',
    selectedMode: 'hybrid',
    selectedProps: ['Aerial Yoga', 'Wheel Yoga', 'Wall Yoga'],
    remainingCredits: 48,
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    uid: 'u-gvya-002',
    fullName: 'Ananya & Aarav Iyer (Kids)',
    email: 'ananya.iyer@gmail.com',
    phone: '+91 98840 98765',
    role: 'customer',
    status: 'active',
    activeMembershipId: 'kids-1y',
    activeMembershipName: 'Kids Yoga — 1 Year',
    selectedMode: 'offline',
    selectedProps: ['Kids Agility', 'Posture Alignment'],
    remainingCredits: 36,
    createdAt: '2026-02-10T11:30:00.000Z',
  },
  {
    uid: 'u-gvya-003',
    fullName: 'Dr. Vikramaditya Rao',
    email: 'dr.vikram.rao@apollo.org',
    phone: '+91 97900 11223',
    role: 'customer',
    status: 'active',
    activeMembershipId: 'pro-6m',
    activeMembershipName: 'Pro Classes with Props — 6 Months',
    selectedMode: 'online',
    selectedProps: ['Wheel Yoga', 'Wall Alignment'],
    remainingCredits: 24,
    createdAt: '2026-03-01T08:15:00.000Z',
  },
  {
    uid: 'u-gvya-004',
    fullName: 'Sunita Mehra (Spine Care)',
    email: 'sunita.mehra@outlook.com',
    phone: '+91 94440 33445',
    role: 'customer',
    status: 'active',
    activeMembershipId: 'pro-3m',
    activeMembershipName: 'Pro Classes with Props — 3 Months',
    selectedMode: 'offline',
    selectedProps: ['Wall Harness'],
    remainingCredits: 12,
    createdAt: '2026-04-12T14:20:00.000Z',
  },
];

export const subscribeToCustomers = (
  callback: (customers: User[]) => void
) => {
  const emitLocal = () => callback(readLocalCollection(LOCAL_STORAGE_KEY_CUSTOMERS, DEFAULT_GVYA_CUSTOMERS));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_CUSTOMERS, emitLocal);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, COLLECTION_NAME), where('role', '==', 'customer'));
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              uid: docSnap.id,
              fullName: data.fullName || 'Yogi',
              email: data.email || '',
              phone: data.phone,
              photoUrl: data.photoUrl,
              role: data.role || 'customer',
              status: data.status || 'active',
              activeMembershipId: data.activeMembershipId,
              activeMembershipName: data.activeMembershipName,
              selectedMode: data.selectedMode,
              selectedProps: data.selectedProps,
              remainingCredits: data.remainingCredits ?? 0,
              notificationPreferences: data.notificationPreferences,
              createdAt: data.createdAt,
            } as User;
          });
          writeLocalCollection(LOCAL_STORAGE_KEY_CUSTOMERS, list);
          callback(list);
        } else {
          seedDefaultCustomersToFirestore();
          emitLocal();
        }
      },
      (error) => {
        console.warn('[customerService] Using synced local customer cache:', error.message);
        emitLocal();
      }
    );
  } catch (err) {
    console.warn('[customerService] Could not establish Firestore connection:', err);
  }

  return () => {
    unsubLocal();
    unsubFirestore();
  };
};

const seedDefaultCustomersToFirestore = async () => {
  try {
    for (const c of DEFAULT_GVYA_CUSTOMERS) {
      await setDoc(doc(db, COLLECTION_NAME, c.uid), {
        ...c,
        updatedAt: serverTimestamp(),
      });
    }
  } catch {}
};

export const upsertCustomerFromPublic = async (payload: {
  fullName: string;
  phone: string;
  email?: string;
  activeMembershipId?: string;
  activeMembershipName?: string;
  selectedMode?: 'online' | 'offline' | 'hybrid';
  selectedProps?: string[];
  creditsToAdd?: number;
}): Promise<string> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_CUSTOMERS, DEFAULT_GVYA_CUSTOMERS);
  const cleanPhone = payload.phone.replace(/[^0-9+]/g, '');
  const cleanEmail = sanitizeText(payload.email || '', 120).toLowerCase();

  const existing = current.find(
    (c) =>
      (cleanPhone && c.phone?.replace(/[^0-9+]/g, '') === cleanPhone) ||
      (cleanEmail && c.email.toLowerCase() === cleanEmail)
  );

  const uid = existing?.uid || `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const nextCredits = (existing?.remainingCredits || 0) + (payload.creditsToAdd || 0);

  const userRecord: User = {
    uid,
    fullName: sanitizeText(payload.fullName, 100),
    email: cleanEmail || existing?.email || `${uid}@member.gvya.in`,
    phone: sanitizeText(payload.phone, 24),
    role: 'customer',
    status: existing?.status || 'active',
    activeMembershipId: payload.activeMembershipId || existing?.activeMembershipId,
    activeMembershipName: payload.activeMembershipName || existing?.activeMembershipName,
    selectedMode: payload.selectedMode || existing?.selectedMode,
    selectedProps: payload.selectedProps || existing?.selectedProps,
    remainingCredits: nextCredits,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  const updated = existing
    ? current.map((c) => (c.uid === uid ? userRecord : c))
    : [userRecord, ...current];
  writeLocalCollection(LOCAL_STORAGE_KEY_CUSTOMERS, updated);

  try {
    await setDoc(
      doc(db, COLLECTION_NAME, uid),
      { ...userRecord, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch {}

  return uid;
};

export const updateCustomerStatus = async (uid: string, status: UserStatus): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_CUSTOMERS, DEFAULT_GVYA_CUSTOMERS);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_CUSTOMERS,
    current.map((c) => (c.uid === uid ? { ...c, status } : c))
  );

  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(userRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'activityLogs'), {
      userId: uid,
      actorRole: 'admin',
      action: status === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
      description: `Customer account status updated to ${status} by administrator`,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[customerService] Status updated locally:', err);
  }
};

export const adjustCustomerCredits = async (
  uid: string, 
  delta: number, 
  currentCredits: number
): Promise<void> => {
  const newBalance = Math.max(0, currentCredits + delta);
  const current = readLocalCollection(LOCAL_STORAGE_KEY_CUSTOMERS, DEFAULT_GVYA_CUSTOMERS);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_CUSTOMERS,
    current.map((c) => (c.uid === uid ? { ...c, remainingCredits: newBalance } : c))
  );

  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(userRef, {
      remainingCredits: newBalance,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'activityLogs'), {
      userId: uid,
      actorRole: 'admin',
      action: delta > 0 ? 'CREDITS_GRANTED' : 'CREDITS_DEDUCTED',
      description: `Administrator adjusted credit balance (${delta > 0 ? '+' : ''}${delta}). New balance: ${newBalance}`,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[customerService] Credits updated locally:', err);
  }
};
