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
import { readLocalCollection, writeLocalCollection, subscribeToLocalSync } from '../utils/localStoreSync';
import { sanitizeJitsiRoom, sanitizeText } from '../utils/security';

const COLLECTION_NAME = 'classes';
const LOCAL_STORAGE_KEY_CLASSES = 'gvya_classes_cache_v1';

export const DEFAULT_GVYA_CLASSES: YogaClass[] = [
  {
    classId: 'c-gvya-001',
    title: 'Morning Sun Salutation & Spine Alignment',
    description: 'Dynamic Surya Namaskar with lumbar traction, core engagement, and posture correction.',
    category: 'Vinyasa Yoga',
    instructorId: 'inst-vijay',
    instructorName: 'Master Vijay (Guinness Record Holder)',
    bookingType: 'offline',
    startTime: new Date(Date.now() + 2 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 3.25 * 3600000).toISOString(),
    durationMinutes: 75,
    capacity: 25,
    bookedSeats: 18,
    location: {
      studioRoom: 'Main Hall A',
      address: 'GVYA Academy, 108 Temple Road, Chennai'
    },
    cancellationPolicyHours: 12,
    status: 'scheduled',
  },
  {
    classId: 'c-gvya-002',
    title: 'Kids Agility, Focus & Posture Batch (Ages 4–15)',
    description: 'Fun balance asanas, breathwork for screen-detox, concentration, and spinal flexibility.',
    category: 'Kids Yoga',
    instructorId: 'inst-kavitha',
    instructorName: 'Kavitha Nair (Child Yoga Pedagogy Lead)',
    bookingType: 'offline',
    startTime: new Date(Date.now() + 6 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 7 * 3600000).toISOString(),
    durationMinutes: 60,
    capacity: 20,
    bookedSeats: 14,
    location: {
      studioRoom: 'Junior Studio 2',
      address: 'GVYA Academy, 108 Temple Road, Chennai'
    },
    cancellationPolicyHours: 12,
    status: 'scheduled',
  },
  {
    classId: 'c-gvya-003',
    title: 'Aerial Silk Anti-Gravity Decompression',
    description: 'Zero-gravity inversions using imported silk hammocks to decompress spine and stimulate lymph drainage.',
    category: 'Aerial Yoga',
    instructorId: 'inst-priya',
    instructorName: 'Priya Sharma (Certified Aerial Guru)',
    bookingType: 'offline',
    startTime: new Date(Date.now() + 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 25.25 * 3600000).toISOString(),
    durationMinutes: 75,
    capacity: 15,
    bookedSeats: 12,
    location: {
      studioRoom: 'Aerial Loft B',
      address: 'GVYA Academy, 108 Temple Road, Chennai'
    },
    cancellationPolicyHours: 12,
    status: 'scheduled',
  },
  {
    classId: 'c-gvya-004',
    title: 'Yoga Wheel Thoracic Mobility & Heart Opening',
    description: 'Clinical wheel prop practice for deep backbends, shoulder release, and desk-slouch recovery.',
    category: 'Wheel Yoga',
    instructorId: 'inst-arvind',
    instructorName: 'Arvind Raman (Biomechanics Specialist)',
    bookingType: 'offline',
    startTime: new Date(Date.now() + 28 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 29 * 3600000).toISOString(),
    durationMinutes: 60,
    capacity: 20,
    bookedSeats: 16,
    location: {
      studioRoom: 'Main Hall A',
      address: 'GVYA Academy, 108 Temple Road, Chennai'
    },
    cancellationPolicyHours: 12,
    status: 'scheduled',
  },
  {
    classId: 'c-gvya-005',
    title: 'Global Live Stream: Pranayama & Mind Reset',
    description: 'Interactive live video broadcast for stress relief, vagus nerve stimulation, and deep meditation.',
    category: 'Pranayama Live',
    instructorId: 'inst-priya',
    instructorName: 'Priya Sharma (Certified Aerial Guru)',
    bookingType: 'online',
    startTime: new Date(Date.now() + 1800000).toISOString(),
    endTime: new Date(Date.now() + 5400000).toISOString(),
    durationMinutes: 60,
    capacity: 100,
    bookedSeats: 48,
    meetingConfiguration: {
      jitsiRoom: 'GVYA_Live_Pranayama_Sanctuary',
      joinWindowMinutesBefore: 15
    },
    cancellationPolicyHours: 6,
    status: 'live',
  },
  {
    classId: 'c-gvya-006',
    title: 'Live Interactive Video: Spine & Mobility Alignment',
    description: 'Join live via HD video room from anywhere for guided spinal posture therapy with Master Vijay.',
    category: 'Online Therapy',
    instructorId: 'inst-vijay',
    instructorName: 'Master Vijay (Guinness Record Holder)',
    bookingType: 'online',
    startTime: new Date(Date.now() + 4 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 5 * 3600000).toISOString(),
    durationMinutes: 60,
    capacity: 80,
    bookedSeats: 31,
    meetingConfiguration: {
      jitsiRoom: 'GVYA_Live_Spine_Masterclass',
      joinWindowMinutesBefore: 15
    },
    cancellationPolicyHours: 6,
    status: 'scheduled',
  }
];

export const subscribeToClasses = (
  callback: (classes: YogaClass[]) => void
) => {
  const emitLocal = () => callback(readLocalCollection(LOCAL_STORAGE_KEY_CLASSES, DEFAULT_GVYA_CLASSES));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_CLASSES, emitLocal);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('startTime', 'asc'));
    unsubFirestore = onSnapshot(
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
              bookingType: data.bookingType || 'offline',
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
          writeLocalCollection(LOCAL_STORAGE_KEY_CLASSES, list);
          callback(list);
        } else {
          seedDefaultClassesToFirestore();
          emitLocal();
        }
      },
      (error) => {
        console.warn('[classService] Using synced local classes:', error.message);
        emitLocal();
      }
    );
  } catch (err) {
    console.warn('[classService] Could not establish Firestore connection:', err);
  }

  return () => {
    unsubLocal();
    unsubFirestore();
  };
};

const seedDefaultClassesToFirestore = async () => {
  try {
    for (const c of DEFAULT_GVYA_CLASSES) {
      await setDoc(doc(db, COLLECTION_NAME, c.classId), {
        ...c,
        createdAt: serverTimestamp(),
      });
    }
  } catch {}
};

export const createClass = async (classData: Omit<YogaClass, 'classId'>): Promise<string> => {
  const newId = `c_${Date.now()}`;
  const sanitizedJitsi = classData.bookingType === 'online'
    ? {
        jitsiRoom: sanitizeJitsiRoom(classData.meetingConfiguration?.jitsiRoom || `GVYA_${newId}`),
        joinWindowMinutesBefore: classData.meetingConfiguration?.joinWindowMinutesBefore || 15,
      }
    : undefined;

  const newClass: YogaClass = {
    ...classData,
    title: sanitizeText(classData.title, 120),
    description: sanitizeText(classData.description, 400),
    instructorName: sanitizeText(classData.instructorName, 80),
    meetingConfiguration: sanitizedJitsi,
    classId: newId,
    bookedSeats: 0,
    status: 'scheduled',
  };

  const current = readLocalCollection(LOCAL_STORAGE_KEY_CLASSES, DEFAULT_GVYA_CLASSES);
  writeLocalCollection(LOCAL_STORAGE_KEY_CLASSES, [newClass, ...current]);

  try {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    await setDoc(newDocRef, {
      ...newClass,
      classId: newDocRef.id,
      createdAt: serverTimestamp(),
    });
    return newDocRef.id;
  } catch (err) {
    console.warn('[classService] Saved to local cache:', err);
    return newId;
  }
};

export const updateClass = async (classId: string, updates: Partial<YogaClass>): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_CLASSES, DEFAULT_GVYA_CLASSES);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_CLASSES,
    current.map((c) => (c.classId === classId ? { ...c, ...updates } : c))
  );

  try {
    const classRef = doc(db, COLLECTION_NAME, classId);
    await updateDoc(classRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[classService] Update saved locally:', err);
  }
};

export const incrementClassBookedSeats = async (classId: string, delta = 1): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_CLASSES, DEFAULT_GVYA_CLASSES);
  const target = current.find((c) => c.classId === classId);
  if (!target) return;
  const nextBooked = Math.min(target.capacity, Math.max(0, (target.bookedSeats || 0) + delta));
  await updateClass(classId, { bookedSeats: nextBooked });
};

export const cancelClass = async (classId: string): Promise<void> => {
  await updateClass(classId, { status: 'cancelled' });
};
