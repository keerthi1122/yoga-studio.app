# API & Transaction Specifications

This document defines the transaction protocols, data contracts, and server operations for the Yoga Studio Management Platform.

---

## 1. Booking Creation Protocol (`runTransaction`)

To ensure concurrency safety and avoid overbooking during simultaneous customer booking requests, bookings MUST execute as an atomic transaction.

```typescript
/**
 * Atomic booking logic executed on Cloud Firestore
 */
async function bookYogaClass(userId: string, classId: string, membershipId?: string) {
  return await db.runTransaction(async (transaction) => {
    const userRef = db.doc(`users/${userId}`);
    const classRef = db.doc(`classes/${classId}`);
    
    const [userDoc, classDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(classRef)
    ]);

    if (!userDoc.exists) throw new Error("USER_NOT_FOUND");
    if (!classDoc.exists) throw new Error("CLASS_NOT_FOUND");

    const classData = classDoc.data();
    const userData = userDoc.data();

    // 1. Check class status
    if (classData.status !== "scheduled") {
      throw new Error("CLASS_NOT_AVAILABLE");
    }

    // 2. Check booking deadline
    if (new Date() > classData.bookingDeadline.toDate()) {
      throw new Error("BOOKING_DEADLINE_EXPIRED");
    }

    // 3. Concurrency check: Capacity
    if (classData.bookedSeats >= classData.capacity) {
      throw new Error("CLASS_FULL");
    }

    // 4. Check for duplicate booking
    const existingBookingQuery = await db.collection("bookings")
      .where("userId", "==", userId)
      .where("classId", "==", classId)
      .where("bookingStatus", "==", "confirmed")
      .get();
      
    if (!existingBookingQuery.empty) {
      throw new Error("ALREADY_BOOKED");
    }

    // 5. Membership & Credit Deduction Check
    if (membershipId) {
      const membershipRef = db.doc(`memberships/${membershipId}`);
      const membershipDoc = await transaction.get(membershipRef);
      if (!membershipDoc.exists) throw new Error("MEMBERSHIP_NOT_FOUND");
      const memData = membershipDoc.data();
      if (memData.status !== "active" || new Date() > memData.expiryDate.toDate()) {
        throw new Error("MEMBERSHIP_EXPIRED");
      }
      if (!memData.unlimited && memData.remainingCredits < 1) {
        throw new Error("INSUFFICIENT_CREDITS");
      }
      
      // Deduct credit
      if (!memData.unlimited) {
        transaction.update(membershipRef, {
          remainingCredits: memData.remainingCredits - 1,
          status: (memData.remainingCredits - 1 === 0) ? "depleted" : "active"
        });
        transaction.update(userRef, {
          remainingCredits: Math.max(0, (userData.remainingCredits || 1) - 1)
        });
      }
    }

    // 6. Increment class capacity
    transaction.update(classRef, {
      bookedSeats: classData.bookedSeats + 1
    });

    // 7. Write booking record
    const bookingRef = db.collection("bookings").doc();
    transaction.set(bookingRef, {
      bookingId: bookingRef.id,
      userId,
      userFullName: userData.fullName,
      userEmail: userData.email,
      classId,
      classTitle: classData.title,
      instructorName: classData.instructorName,
      classStartTime: classData.startTime,
      classEndTime: classData.endTime,
      bookingType: classData.bookingType,
      membershipId: membershipId || null,
      creditDeducted: membershipId ? 1 : 0,
      bookingStatus: "confirmed",
      paymentStatus: membershipId ? "paid" : "pending",
      createdAt: FirebaseFirestore.FieldValue.serverTimestamp()
    });

    // 8. Log activity
    const logRef = db.collection("activityLogs").doc();
    transaction.set(logRef, {
      logId: logRef.id,
      userId,
      actorRole: "customer",
      action: "BOOKING_CREATED",
      description: `Booked ${classData.title} (${classData.bookingType})`,
      timestamp: FirebaseFirestore.FieldValue.serverTimestamp()
    });

    return bookingRef.id;
  });
}
```

---

## 2. Cancellation and Credit Refund Policy

When a customer cancels a booking:
1. Verify `hoursBeforeClass`: Check if `(classStartTime - now) >= cancellationPolicyHours`.
2. If within the eligible window:
   - Restore credit in `memberships/{membershipId}`.
   - Increment `users/{userId}.remainingCredits`.
   - Decrement `classes/{classId}.bookedSeats`.
   - Update `bookings/{bookingId}.bookingStatus = 'cancelled'`.
3. If outside the eligible window:
   - Decrement `classes/{classId}.bookedSeats` so others can book.
   - Forfeit credit according to policy.
   - Update `bookings/{bookingId}.bookingStatus = 'cancelled_late'`.

---

## 3. Manual Payment Verification Flow

1. Customer chooses "Manual Bank Transfer" on mobile or web.
2. Customer uploads receipt screenshot (`proofUrl` in Firebase Storage).
3. Record created in `payments` with `paymentStatus: 'pending'`.
4. Studio Administrator views pending payments in Admin Dashboard.
5. On approval:
   - Admin clicks "Verify & Activate".
   - Transaction sets `payments/{id}.paymentStatus = 'verified'`.
   - Membership document is created with calculated `expiryDate = now + validityDays`.
   - User document updated with `activeMembershipId` and `remainingCredits`.
   - Activity log recorded.

