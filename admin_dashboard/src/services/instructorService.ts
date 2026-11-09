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

const COLLECTION_NAME = 'instructors';

export const subscribeToInstructors = (
  callback: (instructors: Instructor[]) => void
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
          callback(list);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn('[instructorService] Firestore snapshot error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('[instructorService] Could not establish Firestore connection:', err);
    callback([]);
    return () => {};
  }
};

export const createInstructor = async (
  instructorData: Omit<Instructor, 'instructorId'>
): Promise<string> => {
  const newDocRef = doc(collection(db, COLLECTION_NAME));
  await setDoc(newDocRef, {
    ...instructorData,
    instructorId: newDocRef.id,
    createdAt: serverTimestamp(),
  });
  return newDocRef.id;
};

export const updateInstructor = async (
  instructorId: string, 
  updates: Partial<Instructor>
): Promise<void> => {
  const insRef = doc(db, COLLECTION_NAME, instructorId);
  await updateDoc(insRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const toggleInstructorActive = async (
  instructorId: string, 
  currentActive: boolean
): Promise<void> => {
  const insRef = doc(db, COLLECTION_NAME, instructorId);
  await updateDoc(insRef, {
    active: !currentActive,
    updatedAt: serverTimestamp(),
  });
};

