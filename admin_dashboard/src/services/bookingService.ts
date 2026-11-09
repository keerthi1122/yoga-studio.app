import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Booking } from '../types';

const COLLECTION_NAME = 'bookings';

export const subscribeToBookings = (
  callback: (bookings: Booking[]) => void
) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('classStartTime', 'desc'));
    return onSnapshot(
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
              classId: data.classId || '',
              classTitle: data.classTitle || '',
              instructorName: data.instructorName || 'Lead Instructor',
              classStartTime: data.classStartTime?.toDate ? data.classStartTime.toDate().toISOString() : data.classStartTime,
              classEndTime: data.classEndTime?.toDate ? data.classEndTime.toDate().toISOString() : data.classEndTime,
              bookingType: data.bookingType || 'online',
              packageId: data.packageId,
              membershipId: data.membershipId,
              creditDeducted: data.creditDeducted ?? 1,
              bookingStatus: data.bookingStatus || 'confirmed',
              paymentStatus: data.paymentStatus || 'paid',
              cancellationReason: data.cancellationReason,
              cancelledAt: data.cancelledAt?.toDate ? data.cancelledAt.toDate().toISOString() : data.cancelledAt,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            } as Booking;
          });
          callback(list);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn('[bookingService] Firestore snapshot error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('[bookingService] Could not establish Firestore connection:', err);
    callback([]);
    return () => {};
  }
};

export const cancelBookingByAdmin = async (booking: Booking): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, COLLECTION_NAME, booking.bookingId);
    const classRef = doc(db, 'classes', booking.classId);
    const userRef = doc(db, 'users', booking.userId);

    const classDoc = await transaction.get(classRef);
    const userDoc = await transaction.get(userRef);

    // 1. Update Booking status
    transaction.update(bookingRef, {
      bookingStatus: 'cancelled',
      paymentStatus: 'refunded',
      cancellationReason: 'Cancelled by studio administrator - credit refunded',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Decrement class capacity
    if (classDoc.exists()) {
      const currentBooked = classDoc.data().bookedSeats || 1;
      transaction.update(classRef, {
        bookedSeats: Math.max(0, currentBooked - 1),
      });
    }

    // 3. Restore user credit
    if (userDoc.exists() && booking.creditDeducted > 0) {
      const currentCredits = userDoc.data().remainingCredits || 0;
      transaction.update(userRef, {
        remainingCredits: currentCredits + booking.creditDeducted,
      });
    }

    // 4. Log cancellation activity
    const logRef = doc(collection(db, 'activityLogs'));
    transaction.set(logRef, {
      userId: booking.userId,
      actorRole: 'admin',
      action: 'BOOKING_CANCELLED_BY_ADMIN',
      description: `Reservation ${booking.bookingId} for ${booking.classTitle} cancelled by administrator`,
      timestamp: serverTimestamp(),
    });
  });
};

