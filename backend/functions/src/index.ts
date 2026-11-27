import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

interface CreateBookingRequest {
  classId: string;
  membershipId?: string;
}

interface CancelBookingRequest {
  bookingId: string;
}

/**
 * Callable Function: Atomically reserves a yoga class seat and deducts practitioner credit.
 * Enforces zero-trust server validation:
 *  - Authentication verification
 *  - Deterministic document ID (${userId}_${classId}) preventing duplicate race conditions
 *  - Atomic class capacity verification
 *  - Atomic credit deduction or unlimited pass privilege
 *  - Immutable activity log generation
 */
export const createBooking = functions.https.onCall<CreateBookingRequest>(async (request) => {
  // 1. Verify Authentication
  if (!request.auth || !request.auth.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to reserve a yoga class.'
    );
  }

  const userId = request.auth.uid;
  const { classId } = request.data;

  if (!classId || typeof classId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'A valid class ID is required.'
    );
  }

  // Deterministic booking document ID: guarantees strict idempotency & eliminates duplicate race conditions
  const bookingId = `${userId}_${classId}`;
  const bookingRef = db.collection('bookings').doc(bookingId);
  const classRef = db.collection('classes').doc(classId);
  const userRef = db.collection('users').doc(userId);
  const logRef = db.collection('activityLogs').doc();

  return await db.runTransaction(async (transaction) => {
    // 2. Check for Existing Active Reservation (in-transaction concurrency lock)
    const existingBookingSnap = await transaction.get(bookingRef);
    if (existingBookingSnap.exists) {
      const existingData = existingBookingSnap.data();
      if (existingData && existingData.bookingStatus === 'confirmed') {
        throw new functions.https.HttpsError(
          'already-exists',
          'You already have an active reservation for this yoga session.'
        );
      }
    }

    // 3. Inspect Yoga Class Details & Capacity
    const classSnap = await transaction.get(classRef);
    if (!classSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Yoga session record was not found.'
      );
    }

    const classData = classSnap.data()!;
    if (classData.status === 'cancelled') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This yoga session has been cancelled by the studio.'
      );
    }

    const startTime = classData.startTime?.toDate
      ? classData.startTime.toDate()
      : new Date(classData.startTime);

    if (Date.now() >= startTime.getTime()) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Class has already started or booking deadline has passed.'
      );
    }

    const capacity = Number(classData.capacity || 20);
    const bookedSeats = Number(classData.bookedSeats || 0);

    if (bookedSeats >= capacity) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Class reached full capacity while processing your request. Please choose another session.'
      );
    }

    // 4. Inspect User Membership & Credits
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Customer user profile not found.'
      );
    }

    const userData = userSnap.data()!;
    const activeMembershipId = userData.activeMembershipId;
    let hasUnlimitedPass = false;

    if (activeMembershipId) {
      const membershipRef = db.collection('memberships').doc(activeMembershipId);
      const membershipSnap = await transaction.get(membershipRef);
      if (membershipSnap.exists) {
        const memData = membershipSnap.data()!;
        const expiry = memData.expiryDate?.toDate
          ? memData.expiryDate.toDate()
          : new Date(memData.expiryDate);
        if (memData.status === 'active' && expiry.getTime() > Date.now()) {
          hasUnlimitedPass = Boolean(memData.unlimited);
        }
      }
    }

    const creditsNeeded = hasUnlimitedPass ? 0 : 1;
    const currentCredits = Number(userData.remainingCredits || 0);

    if (!hasUnlimitedPass && currentCredits < 1) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Insufficient class credits. Please purchase a class pass or membership to confirm.'
      );
    }

    // 5. Atomic State Mutations
    if (creditsNeeded > 0) {
      transaction.update(userRef, {
        remainingCredits: currentCredits - 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    transaction.update(classRef, {
      bookedSeats: bookedSeats + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  const authUser = request.auth;
  const userFullName = userData.fullName || authUser?.token.name || 'Practitioner';
  const userEmail = userData.email || authUser?.token.email || '';

    const bookingPayload = {
      bookingId,
      userId,
      userFullName,
      userEmail,
      classId,
      classTitle: classData.title || 'Yoga Session',
      instructorName: classData.instructorName || 'Lead Instructor',
      classStartTime: classData.startTime,
      classEndTime: classData.endTime,
      bookingType: classData.bookingType || 'online',
      membershipId: activeMembershipId || null,
      packageId: classData.packageId || null,
      creditDeducted: creditsNeeded,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      jitsiRoom: classData.meetingConfiguration?.jitsiRoom || classData.jitsiRoom || null,
      studioRoom: classData.location?.studioRoom || classData.studioRoom || null,
      studioAddress: classData.location?.address || classData.studioAddress || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    transaction.set(bookingRef, bookingPayload);

    transaction.set(logRef, {
      logId: logRef.id,
      userId,
      actorRole: 'customer',
      action: 'BOOKING_CREATED',
      description: `Reserved ${classData.title} (${(classData.bookingType || 'session').toUpperCase()})${
        creditsNeeded > 0 ? ' - 1 Credit used' : ' - Unlimited Pass'
      }`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      bookingId,
      creditDeducted: creditsNeeded,
      remainingCredits: hasUnlimitedPass ? currentCredits : currentCredits - 1,
    };
  });
});

/**
 * Callable Function: Cancels a booking, releases the seat, and evaluates credit refund eligibility.
 */
export const cancelBooking = functions.https.onCall<CancelBookingRequest>(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to cancel a booking.'
    );
  }

  const callerUid = request.auth.uid;
  const { bookingId } = request.data;

  if (!bookingId || typeof bookingId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'A valid booking ID is required.'
    );
  }

  const bookingRef = db.collection('bookings').doc(bookingId);
  const settingsRef = db.collection('studioSettings').doc('default');
  const logRef = db.collection('activityLogs').doc();

  return await db.runTransaction(async (transaction) => {
    const bookingSnap = await transaction.get(bookingRef);
    if (!bookingSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking record not found.');
    }

    const bookingData = bookingSnap.data()!;
    const isAdmin = request.auth?.token.role === 'admin';

    // Verify ownership or admin clearance
    if (bookingData.userId !== callerUid && !isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You are not authorized to cancel this reservation.'
      );
    }

    if (bookingData.bookingStatus === 'cancelled') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Reservation has already been cancelled.'
      );
    }

    // Fetch studio cancellation policy window
    const settingsSnap = await transaction.get(settingsRef);
    const rawHours = settingsSnap.data()?.cancellationPolicyHours;
    const cancellationPolicyHours =
      settingsSnap.exists && rawHours !== undefined && rawHours !== null
        ? Number(rawHours)
        : 12;

    const classStartTime = bookingData.classStartTime?.toDate
      ? bookingData.classStartTime.toDate()
      : new Date(bookingData.classStartTime);

    const hoursUntilClass = (classStartTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const eligibleForRefund = hoursUntilClass >= cancellationPolicyHours;

    // Release class seat
    const classRef = db.collection('classes').doc(bookingData.classId);
    const classSnap = await transaction.get(classRef);
    if (classSnap.exists) {
      const bookedSeats = Number(classSnap.data()?.bookedSeats || 1);
      transaction.update(classRef, {
        bookedSeats: Math.max(0, bookedSeats - 1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Restore credit if eligible
    const creditDeducted = Number(bookingData.creditDeducted || 0);
    if (eligibleForRefund && creditDeducted > 0) {
      const userRef = db.collection('users').doc(bookingData.userId);
      const userSnap = await transaction.get(userRef);
      if (userSnap.exists) {
        const currentCredits = Number(userSnap.data()?.remainingCredits || 0);
        transaction.update(userRef, {
          remainingCredits: currentCredits + creditDeducted,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Mark booking cancelled
    transaction.update(bookingRef, {
      bookingStatus: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      refundEligible: eligibleForRefund,
      cancellationReason: eligibleForRefund
        ? `Cancelled > ${cancellationPolicyHours}h prior (credit refunded)`
        : `Late cancellation <= ${cancellationPolicyHours}h (no refund)`,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Write activity log
    transaction.set(logRef, {
      logId: logRef.id,
      userId: bookingData.userId,
      actorRole: isAdmin ? 'admin' : 'customer',
      action: 'BOOKING_CANCELLED',
      description: `Cancelled ${bookingData.classTitle}${
        eligibleForRefund && creditDeducted > 0 ? ' (1 Credit refunded)' : ' (Late cancellation - no credit refund)'
      }`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      bookingId,
      refundEligible: eligibleForRefund,
      creditRestored: eligibleForRefund ? creditDeducted : 0,
    };
  });
});

