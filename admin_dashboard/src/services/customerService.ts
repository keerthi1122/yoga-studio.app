import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, UserStatus } from '../types';

const COLLECTION_NAME = 'users';

export const subscribeToCustomers = (
  callback: (customers: User[]) => void
) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('role', '==', 'customer'));
    return onSnapshot(
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
              remainingCredits: data.remainingCredits ?? 0,
              notificationPreferences: data.notificationPreferences,
              createdAt: data.createdAt,
            } as User;
          });
          callback(list);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn('[customerService] Firestore snapshot error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('[customerService] Could not establish Firestore connection:', err);
    callback([]);
    return () => {};
  }
};

export const updateCustomerStatus = async (uid: string, status: UserStatus): Promise<void> => {
  const userRef = doc(db, COLLECTION_NAME, uid);
  await updateDoc(userRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  // Log in activityLogs
  await addDoc(collection(db, 'activityLogs'), {
    userId: uid,
    actorRole: 'admin',
    action: status === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
    description: `Customer account status updated to ${status} by administrator`,
    timestamp: serverTimestamp(),
  });
};

export const adjustCustomerCredits = async (
  uid: string, 
  delta: number, 
  currentCredits: number
): Promise<void> => {
  const newBalance = Math.max(0, currentCredits + delta);
  const userRef = doc(db, COLLECTION_NAME, uid);
  await updateDoc(userRef, {
    remainingCredits: newBalance,
    updatedAt: serverTimestamp(),
  });

  // Log credit adjustment
  await addDoc(collection(db, 'activityLogs'), {
    userId: uid,
    actorRole: 'admin',
    action: delta > 0 ? 'CREDITS_GRANTED' : 'CREDITS_DEDUCTED',
    description: `Administrator adjusted credit balance (${delta > 0 ? '+' : ''}${delta}). New balance: ${newBalance}`,
    timestamp: serverTimestamp(),
  });
};

