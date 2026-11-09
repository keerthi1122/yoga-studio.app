import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Package } from '../types';

const COLLECTION_NAME = 'packages';

export const subscribeToPackages = (
  callback: (packages: Package[]) => void
) => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              packageId: docSnap.id,
              name: data.name || '',
              description: data.description || '',
              price: data.price || 0,
              currency: data.currency || 'USD',
              credits: data.credits ?? 1,
              validityDays: data.validityDays || 30,
              unlimited: data.unlimited ?? false,
              eligibleCategories: data.eligibleCategories || ['all'],
              eligibleBookingTypes: data.eligibleBookingTypes || ['online', 'offline'],
              startDateRules: data.startDateRules || 'immediate',
              active: data.active ?? true,
            } as Package;
          });
          callback(list);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn('[packageService] Firestore snapshot error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('[packageService] Could not establish Firestore connection:', err);
    callback([]);
    return () => {};
  }
};

export const createPackage = async (packageData: Omit<Package, 'packageId'>): Promise<string> => {
  const newDocRef = doc(collection(db, COLLECTION_NAME));
  await setDoc(newDocRef, {
    ...packageData,
    packageId: newDocRef.id,
    active: true,
    createdAt: serverTimestamp(),
  });
  return newDocRef.id;
};

export const updatePackage = async (
  packageId: string, 
  updates: Partial<Package>
): Promise<void> => {
  const pkgRef = doc(db, COLLECTION_NAME, packageId);
  await updateDoc(pkgRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const togglePackageActive = async (
  packageId: string, 
  currentActive: boolean
): Promise<void> => {
  const pkgRef = doc(db, COLLECTION_NAME, packageId);
  await updateDoc(pkgRef, {
    active: !currentActive,
    updatedAt: serverTimestamp(),
  });
};

