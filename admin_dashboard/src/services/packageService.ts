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
import { readLocalCollection, writeLocalCollection, subscribeToLocalSync } from '../utils/localStoreSync';

const COLLECTION_NAME = 'packages';
const LOCAL_STORAGE_KEY_PACKAGES = 'gvya_packages_cache_v1';

export const DEFAULT_GVYA_PACKAGES: Package[] = [
  {
    packageId: 'pkg-gvya-001',
    name: '10-Session Props & Alignment Pass',
    description: 'Access to any 10 Aerial, Wheel, or Wall Yoga masterclasses with Guinness Master Vijay and faculty.',
    price: 3500,
    currency: 'INR',
    credits: 10,
    validityDays: 60,
    unlimited: false,
    eligibleCategories: ['all'],
    eligibleBookingTypes: ['online', 'offline'],
    startDateRules: 'immediate',
    active: true,
  },
  {
    packageId: 'pkg-gvya-002',
    name: 'Kids Weekend Immersion Pass (8 Sessions)',
    description: 'Dedicated weekend batches for children focusing on agility, breath, and posture correction.',
    price: 2200,
    currency: 'INR',
    credits: 8,
    validityDays: 45,
    unlimited: false,
    eligibleCategories: ['Kids Yoga'],
    eligibleBookingTypes: ['offline'],
    startDateRules: 'immediate',
    active: true,
  },
  {
    packageId: 'pkg-gvya-003',
    name: '1-Month Unlimited All-Access Studio Pass',
    description: 'Unlimited access to all daily scheduled classes, open studio prop hours, and weekend master workshops.',
    price: 4999,
    currency: 'INR',
    credits: 999,
    validityDays: 30,
    unlimited: true,
    eligibleCategories: ['all'],
    eligibleBookingTypes: ['online', 'offline'],
    startDateRules: 'immediate',
    active: true,
  }
];

export const subscribeToPackages = (
  callback: (packages: Package[]) => void
) => {
  const emitLocal = () => callback(readLocalCollection(LOCAL_STORAGE_KEY_PACKAGES, DEFAULT_GVYA_PACKAGES));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_PACKAGES, emitLocal);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, COLLECTION_NAME));
    unsubFirestore = onSnapshot(
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
              currency: data.currency || 'INR',
              credits: data.credits ?? 1,
              validityDays: data.validityDays || 30,
              unlimited: data.unlimited ?? false,
              eligibleCategories: data.eligibleCategories || ['all'],
              eligibleBookingTypes: data.eligibleBookingTypes || ['online', 'offline'],
              startDateRules: data.startDateRules || 'immediate',
              active: data.active ?? true,
            } as Package;
          });
          writeLocalCollection(LOCAL_STORAGE_KEY_PACKAGES, list);
          callback(list);
        } else {
          seedDefaultPackagesToFirestore();
          emitLocal();
        }
      },
      () => emitLocal()
    );
  } catch {}

  return () => {
    unsubLocal();
    unsubFirestore();
  };
};

const seedDefaultPackagesToFirestore = async () => {
  try {
    for (const pkg of DEFAULT_GVYA_PACKAGES) {
      await setDoc(doc(db, COLLECTION_NAME, pkg.packageId), {
        ...pkg,
        createdAt: serverTimestamp(),
      });
    }
  } catch {}
};

export const createPackage = async (packageData: Omit<Package, 'packageId'>): Promise<string> => {
  const newId = `pkg_${Date.now()}`;
  const newPkg: Package = {
    ...packageData,
    packageId: newId,
    active: true,
  };
  const current = readLocalCollection(LOCAL_STORAGE_KEY_PACKAGES, DEFAULT_GVYA_PACKAGES);
  writeLocalCollection(LOCAL_STORAGE_KEY_PACKAGES, [...current, newPkg]);

  try {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    await setDoc(newDocRef, {
      ...newPkg,
      packageId: newDocRef.id,
      createdAt: serverTimestamp(),
    });
    return newDocRef.id;
  } catch {
    return newId;
  }
};

export const updatePackage = async (
  packageId: string, 
  updates: Partial<Package>
): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_PACKAGES, DEFAULT_GVYA_PACKAGES);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_PACKAGES,
    current.map((p) => (p.packageId === packageId ? { ...p, ...updates } : p))
  );

  try {
    const pkgRef = doc(db, COLLECTION_NAME, packageId);
    await updateDoc(pkgRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch {}
};

export const togglePackageActive = async (
  packageId: string, 
  currentActive: boolean
): Promise<void> => {
  await updatePackage(packageId, { active: !currentActive });
};
