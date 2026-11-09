import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { YogaClass } from '../types';

const COLLECTION_NAME = 'classes';

export const subscribeToClasses = (
  callback: (classes: YogaClass[]) => void
) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('startTime', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              classId: docSnap.id,
              title: data.title || '',
              description: data.description || '',
              category: data.category || 'Hatha Yoga',
              instructorId: data.instructorId || '',
              instructorName: data.instructorName || 'Lead Instructor',
              instructorImage: data.instructorImage,
              bookingType: data.bookingType || 'online',
              startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : data.startTime,
              endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : data.endTime,
              durationMinutes: data.durationMinutes || 60,
              capacity: data.capacity || 20,
              bookedSeats: data.bookedSeats || 0,
              location: data.location,
              meetingConfiguration: data.meetingConfiguration,
              bookingDeadline: data.bookingDeadline,
              cancellationPolicyHours: data.cancellationPolicyHours || 12,
              status: data.status || 'scheduled',
              recurrenceRule: data.recurrenceRule,
            } as YogaClass;
          });
          callback(list);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn('[classService] Firestore snapshot error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('[classService] Could not establish Firestore connection:', err);
    callback([]);
    return () => {};
  }
};

export const createClass = async (classData: Omit<YogaClass, 'classId'>): Promise<string> => {
  const newDocRef = doc(collection(db, COLLECTION_NAME));
  await setDoc(newDocRef, {
    ...classData,
    classId: newDocRef.id,
    bookedSeats: 0,
    status: 'scheduled',
    createdAt: serverTimestamp(),
  });
  return newDocRef.id;
};

export const updateClass = async (classId: string, updates: Partial<YogaClass>): Promise<void> => {
  const classRef = doc(db, COLLECTION_NAME, classId);
  await updateDoc(classRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const cancelClass = async (classId: string): Promise<void> => {
  const classRef = doc(db, COLLECTION_NAME, classId);
  await updateDoc(classRef, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
};

