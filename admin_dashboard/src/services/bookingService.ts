import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Booking, YogaClass } from '../types';
import { readLocalCollection, writeLocalCollection, subscribeToLocalSync } from '../utils/localStoreSync';
import { sanitizeText } from '../utils/security';
import { incrementClassBookedSeats } from './classService';
import { upsertCustomerFromPublic } from './customerService';

const COLLECTION_NAME = 'bookings';
const LOCAL_STORAGE_KEY_BOOKINGS = 'gvya_bookings_cache_v1';

export const DEFAULT_GVYA_BOOKINGS: Booking[] = [
  {
    bookingId: 'bk-gvya-101',
    userId: 'u-gvya-001',
    userFullName: 'Ramesh Sundaram',
    userEmail: 'ramesh.sundaram@gmail.com',
    classId: 'c-gvya-001',
    classTitle: 'Morning Sun Salutation & Spine Alignment',
    instructorName: 'Master Vijay (Guinness Record Holder)',
    classStartTime: new Date(Date.now() + 2 * 3600000).toISOString(),
    classEndTime: new Date(Date.now() + 3.25 * 3600000).toISOString(),
    bookingType: 'offline',
    creditDeducted: 1,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    bookingId: 'bk-gvya-102',
    userId: 'u-gvya-002',
    userFullName: 'Ananya & Aarav Iyer (Kids)',
    userEmail: 'ananya.iyer@gmail.com',
    classId: 'c-gvya-002',
    classTitle: 'Kids Agility, Focus & Posture Batch (Ages 4–15)',
    instructorName: 'Kavitha Nair (Child Yoga Pedagogy Lead)',
    classStartTime: new Date(Date.now() + 6 * 3600000).toISOString(),
    classEndTime: new Date(Date.now() + 7 * 3600000).toISOString(),
    bookingType: 'offline',
    creditDeducted: 1,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    bookingId: 'bk-gvya-103',
    userId: 'u-gvya-003',
    userFullName: 'Dr. Vikramaditya Rao',
    userEmail: 'dr.vikram.rao@apollo.org',
    classId: 'c-gvya-005',
    classTitle: 'Global Live Stream: Pranayama & Mind Reset',
    instructorName: 'Priya Sharma (Certified Aerial Guru)',
    classStartTime: new Date(Date.now() + 1800000).toISOString(),
    classEndTime: new Date(Date.now() + 5400000).toISOString(),
    bookingType: 'online',
    jitsiRoom: 'GVYA_Live_Pranayama_Sanctuary',
    creditDeducted: 1,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    bookingId: 'bk-gvya-104',
    userId: 'u-gvya-004',
    userFullName: 'Sunita Mehra (Spine Care)',
    userEmail: 'sunita.mehra@outlook.com',
    classId: 'c-gvya-004',
    classTitle: 'Yoga Wheel Thoracic Mobility & Heart Opening',
    instructorName: 'Arvind Raman (Biomechanics Specialist)',
    classStartTime: new Date(Date.now() + 28 * 3600000).toISOString(),
    classEndTime: new Date(Date.now() + 29 * 3600000).toISOString(),
    bookingType: 'offline',
    creditDeducted: 1,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  }
];

export const subscribeToBookings = (
  callback: (bookings: Booking[]) => void
) => {
  const emitLocal = () => callback(readLocalCollection(LOCAL_STORAGE_KEY_BOOKINGS, DEFAULT_GVYA_BOOKINGS));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_BOOKINGS, emitLocal);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('classStartTime', 'desc'));
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              bookingId: docSnap.id,
              userId: data.userId || '',
              userFullName: data.userFullName || 'Yogi',
              userEmail: data.userEmail || '',
              phone: data.phone,
              classId: data.classId || '',
              classTitle: data.classTitle || '',
              instructorName: data.instructorName || 'Lead Instructor',
              classStartTime: data.classStartTime?.toDate ? data.classStartTime.toDate().toISOString() : data.classStartTime,
              classEndTime: data.classEndTime?.toDate ? data.classEndTime.toDate().toISOString() : data.classEndTime,
              bookingType: data.bookingType || 'offline',
              packageId: data.packageId,
              membershipId: data.membershipId,
              creditDeducted: data.creditDeducted ?? 1,
              bookingStatus: data.bookingStatus || 'confirmed',
              paymentStatus: data.paymentStatus || 'paid',
              jitsiRoom: data.jitsiRoom,
              cancellationReason: data.cancellationReason,
              cancelledAt: data.cancelledAt?.toDate ? data.cancelledAt.toDate().toISOString() : data.cancelledAt,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            } as Booking;
          });
          writeLocalCollection(LOCAL_STORAGE_KEY_BOOKINGS, list);
          callback(list);
        } else {
          seedDefaultBookingsToFirestore();
          emitLocal();
        }
      },
      (error) => {
        console.warn('[bookingService] Using synced local booking cache:', error.message);
        emitLocal();
      }
    );
  } catch (err) {
    console.warn('[bookingService] Could not establish Firestore connection:', err);
  }

  return () => {
    unsubLocal();
    unsubFirestore();
  };
};

const seedDefaultBookingsToFirestore = async () => {
  try {
    for (const b of DEFAULT_GVYA_BOOKINGS) {
      await setDoc(doc(db, COLLECTION_NAME, b.bookingId), {
        ...b,
        createdAt: serverTimestamp(),
      });
    }
  } catch {}
};

export const createPublicBooking = async (payload: {
  yogaClass: YogaClass;
  fullName: string;
  phone: string;
  email?: string;
}): Promise<Booking> => {
  const userId = await upsertCustomerFromPublic({
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email,
  });

  const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const booking: Booking = {
    bookingId,
    userId,
    userFullName: sanitizeText(payload.fullName, 100),
    userEmail: sanitizeText(payload.email || '', 120) || `${userId}@member.gvya.in`,
    phone: sanitizeText(payload.phone, 24),
    classId: payload.yogaClass.classId,
    classTitle: payload.yogaClass.title,
    instructorName: payload.yogaClass.instructorName,
    classStartTime: payload.yogaClass.startTime,
    classEndTime: payload.yogaClass.endTime,
    bookingType: payload.yogaClass.bookingType,
    jitsiRoom: payload.yogaClass.meetingConfiguration?.jitsiRoom,
    creditDeducted: 0,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
  };

  const current = readLocalCollection(LOCAL_STORAGE_KEY_BOOKINGS, DEFAULT_GVYA_BOOKINGS);
  writeLocalCollection(LOCAL_STORAGE_KEY_BOOKINGS, [booking, ...current]);
  await incrementClassBookedSeats(payload.yogaClass.classId, 1);

  try {
    await setDoc(doc(db, COLLECTION_NAME, bookingId), {
      ...booking,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[bookingService] Public booking stored locally:', err);
  }

  return booking;
};

export const cancelBookingByAdmin = async (booking: Booking): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_BOOKINGS, DEFAULT_GVYA_BOOKINGS);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_BOOKINGS,
    current.map((b) => (b.bookingId === booking.bookingId ? { ...b, bookingStatus: 'cancelled', paymentStatus: 'refunded' } : b))
  );
  await incrementClassBookedSeats(booking.classId, -1);

  try {
    await runTransaction(db, async (transaction) => {
      const bookingRef = doc(db, COLLECTION_NAME, booking.bookingId);
      const classRef = doc(db, 'classes', booking.classId);
      const userRef = doc(db, 'users', booking.userId);

      const classDoc = await transaction.get(classRef);
      const userDoc = await transaction.get(userRef);

      transaction.update(bookingRef, {
        bookingStatus: 'cancelled',
        paymentStatus: 'refunded',
        cancellationReason: 'Cancelled by studio administrator - credit refunded',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (classDoc.exists()) {
        const currentBooked = classDoc.data().bookedSeats || 1;
        transaction.update(classRef, {
          bookedSeats: Math.max(0, currentBooked - 1),
        });
      }

      if (userDoc.exists() && booking.creditDeducted > 0) {
        const currentCredits = userDoc.data().remainingCredits || 0;
        transaction.update(userRef, {
          remainingCredits: currentCredits + booking.creditDeducted,
        });
      }
    });
  } catch (err) {
    console.warn('[bookingService] Cancellation saved locally:', err);
  }
};
