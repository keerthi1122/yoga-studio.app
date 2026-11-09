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
import { Payment } from '../types';

const COLLECTION_NAME = 'payments';

export const subscribeToPayments = (
  callback: (payments: Payment[]) => void
) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              paymentId: docSnap.id,
              userId: data.userId || '',
              userFullName: data.userFullName || 'Yogi',
              packageId: data.packageId || '',
              packageName: data.packageName || '',
              amount: data.amount || 0,
              currency: data.currency || 'USD',
              paymentMethod: data.paymentMethod || 'card',
              transactionId: data.transactionId || docSnap.id,
              proofUrl: data.proofUrl,
              paymentStatus: data.paymentStatus || 'pending',
              verifiedBy: data.verifiedBy,
              verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate().toISOString() : data.verifiedAt,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            } as Payment;
          });
          callback(list);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn('[paymentService] Firestore snapshot error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('[paymentService] Could not establish Firestore connection:', err);
    callback([]);
    return () => {};
  }
};

export const verifyBankTransferPayment = async (
  payment: Payment,
  adminName: string
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const paymentRef = doc(db, COLLECTION_NAME, payment.paymentId);
    const userRef = doc(db, 'users', payment.userId);
    const packageRef = doc(db, 'packages', payment.packageId);

    const packageDoc = await transaction.get(packageRef);
    const userDoc = await transaction.get(userRef);

    // Fallbacks if package is standard
    const validityDays = packageDoc.exists() ? packageDoc.data().validityDays || 60 : 60;
    const credits = packageDoc.exists() ? packageDoc.data().credits ?? 10 : 10;
    const unlimited = packageDoc.exists() ? packageDoc.data().unlimited ?? false : false;

    // 1. Update Payment status
    transaction.update(paymentRef, {
      paymentStatus: 'verified',
      verifiedBy: adminName,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Create Active Membership
    const membershipRef = doc(collection(db, 'memberships'));
    const now = new Date();
    const expiry = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    transaction.set(membershipRef, {
      membershipId: membershipRef.id,
      userId: payment.userId,
      packageId: payment.packageId,
      packageName: payment.packageName,
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      totalCredits: credits,
      remainingCredits: credits,
      unlimited,
      status: 'active',
      purchaseId: payment.paymentId,
      createdAt: serverTimestamp(),
    });

    // 3. Update User document with credits and active membership
    if (userDoc.exists()) {
      const currentCredits = userDoc.data().remainingCredits || 0;
      transaction.update(userRef, {
        activeMembershipId: membershipRef.id,
        remainingCredits: unlimited ? 999 : currentCredits + credits,
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Log in Activity Logs
    const logRef = doc(collection(db, 'activityLogs'));
    transaction.set(logRef, {
      userId: payment.userId,
      actorRole: 'admin',
      action: 'PAYMENT_VERIFIED',
      description: `Manual transfer receipt verified by ${adminName}. ${unlimited ? 'Unlimited' : credits} credits activated.`,
      timestamp: serverTimestamp(),
    });
  });
};

export const rejectBankTransferPayment = async (
  paymentId: string,
  userId: string,
  adminName: string
): Promise<void> => {
  const paymentRef = doc(db, COLLECTION_NAME, paymentId);
  await runTransaction(db, async (transaction) => {
    transaction.update(paymentRef, {
      paymentStatus: 'rejected',
      verifiedBy: adminName,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const logRef = doc(collection(db, 'activityLogs'));
    transaction.set(logRef, {
      userId,
      actorRole: 'admin',
      action: 'PAYMENT_REJECTED',
      description: `Manual transfer receipt rejected by ${adminName}.`,
      timestamp: serverTimestamp(),
    });
  });
};

