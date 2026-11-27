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
import { Instructor } from '../types';
import { readLocalCollection, writeLocalCollection, subscribeToLocalSync } from '../utils/localStoreSync';

const COLLECTION_NAME = 'instructors';
const LOCAL_STORAGE_KEY_INSTRUCTORS = 'gvya_instructors_cache_v1';

export const DEFAULT_GVYA_INSTRUCTORS: Instructor[] = [
  {
    instructorId: 'inst-vijay',
    name: 'Master Vijay',
    bio: 'Guinness World Record Holder in Yoga Endurance. Over 22 years of yogic mastery, training over 15,000 students across the globe in classical alignment and therapeutic props.',
    profileImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=400',
    specialties: ['Hatha Alignment', 'Guinness Props', 'Wall Yoga Therapy', 'Advanced Asanas'],
    active: true,
  },
  {
    instructorId: 'inst-priya',
    name: 'Priya Sharma',
    bio: 'International Certified Aerial Yoga Master & Pranayama Coach. Specializes in zero-gravity spinal decompression, silk hammock transitions, and vagus nerve reset.',
    profileImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=400',
    specialties: ['Aerial Silk Yoga', 'Pranayama', 'Sound Healing', 'Flexibility'],
    active: true,
  },
  {
    instructorId: 'inst-arvind',
    name: 'Arvind Raman',
    bio: 'Physiotherapist & Yoga Biomechanics Specialist. Expert in Wheel Yoga, posture rehabilitation for corporate professionals, and sports injury recovery.',
    profileImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400',
    specialties: ['Yoga Wheel', 'Spine Rehabilitation', 'Thoracic Opening', 'Posture Care'],
    active: true,
  },
  {
    instructorId: 'inst-kavitha',
    name: 'Kavitha Nair',
    bio: 'Child Psychology graduate & Lead Kids Yoga Acharya. Designed the GVYA Kids Focus curriculum improving attention span, posture, and motor coordination.',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    specialties: ['Kids Yoga (Ages 4-15)', 'Screen-Detox', 'ADHD Calm & Focus', 'Agility'],
    active: true,
  }
];

export const subscribeToInstructors = (
  callback: (instructors: Instructor[]) => void
) => {
  const emitLocal = () => callback(readLocalCollection(LOCAL_STORAGE_KEY_INSTRUCTORS, DEFAULT_GVYA_INSTRUCTORS));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_INSTRUCTORS, emitLocal);

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
              instructorId: docSnap.id,
              userId: data.userId,
              name: data.name || '',
              bio: data.bio || '',
              profileImage: data.profileImage || '',
              specialties: data.specialties || [],
              active: data.active ?? true,
              availability: data.availability || [],
            } as Instructor;
          });
          writeLocalCollection(LOCAL_STORAGE_KEY_INSTRUCTORS, list);
          callback(list);
        } else {
          seedDefaultInstructorsToFirestore();
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

const seedDefaultInstructorsToFirestore = async () => {
  try {
    for (const inst of DEFAULT_GVYA_INSTRUCTORS) {
      await setDoc(doc(db, COLLECTION_NAME, inst.instructorId), {
        ...inst,
        createdAt: serverTimestamp(),
      });
    }
  } catch {}
};

export const createInstructor = async (
  instructorData: Omit<Instructor, 'instructorId'>
): Promise<string> => {
  const newId = `inst_${Date.now()}`;
  const newInst: Instructor = {
    ...instructorData,
    instructorId: newId,
    active: true,
  };
  const current = readLocalCollection(LOCAL_STORAGE_KEY_INSTRUCTORS, DEFAULT_GVYA_INSTRUCTORS);
  writeLocalCollection(LOCAL_STORAGE_KEY_INSTRUCTORS, [...current, newInst]);

  try {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    await setDoc(newDocRef, {
      ...newInst,
      instructorId: newDocRef.id,
      createdAt: serverTimestamp(),
    });
    return newDocRef.id;
  } catch {
    return newId;
  }
};

export const updateInstructor = async (
  instructorId: string, 
  updates: Partial<Instructor>
): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_INSTRUCTORS, DEFAULT_GVYA_INSTRUCTORS);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_INSTRUCTORS,
    current.map((i) => (i.instructorId === instructorId ? { ...i, ...updates } : i))
  );

  try {
    const insRef = doc(db, COLLECTION_NAME, instructorId);
    await updateDoc(insRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch {}
};

export const toggleInstructorActive = async (
  instructorId: string, 
  currentActive: boolean
): Promise<void> => {
  await updateInstructor(instructorId, { active: !currentActive });
};
