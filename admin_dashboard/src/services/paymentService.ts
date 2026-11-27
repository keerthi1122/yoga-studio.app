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
import { Payment, PaymentStatus } from '../types';
import { readLocalCollection, writeLocalCollection, subscribeToLocalSync } from '../utils/localStoreSync';
import { sanitizeText, sanitizeTransactionRef } from '../utils/security';

const COLLECTION_NAME = 'payments';
const LOCAL_STORAGE_KEY_PAYMENTS = 'gvya_payments_cache_v1';

export const DEFAULT_GVYA_PAYMENTS: Payment[] = [
  {
    paymentId: 'pay-gvya-001',
    userId: 'u-gvya-001',
    userFullName: 'Ramesh Sundaram',
    phone: '+91 98410 54321',
    packageId: 'pro-1y',
    packageName: 'Pro Classes with Props — 1 Year',
    selectedChoices: 'Hybrid • Aerial, Wheel, Wall Yoga',
    amount: 72000,
    currency: 'INR',
    paymentMethod: 'upi',
    transactionId: 'UPI-98410-202611-001',
    paymentStatus: 'verified',
    verifiedBy: 'Master Vijay (Director)',
    verifiedAt: '2026-11-20T10:30:00.000Z',
    createdAt: '2026-11-20T10:28:00.000Z',
  },
  {
    paymentId: 'pay-gvya-002',
    userId: 'u-gvya-002',
    userFullName: 'Ananya & Aarav Iyer (Kids)',
    phone: '+91 98840 98765',
    packageId: 'kids-1y',
    packageName: 'Kids Yoga — 1 Year',
    selectedChoices: 'Studio Offline • Kids Agility & Focus',
    amount: 18000,
    currency: 'INR',
    paymentMethod: 'card',
    transactionId: 'TXN-HDFC-88912-KIDS',
    paymentStatus: 'verified',
    verifiedBy: 'Master Vijay (Director)',
    verifiedAt: '2026-11-21T14:15:00.000Z',
    createdAt: '2026-11-21T14:12:00.000Z',
  },
  {
    paymentId: 'pay-gvya-003',
    userId: 'u-gvya-003',
    userFullName: 'Dr. Vikramaditya Rao',
    phone: '+91 97900 11223',
    packageId: 'pro-6m',
    packageName: 'Pro Classes with Props — 6 Months',
    selectedChoices: 'Online Live Video • Spine Alignment',
    amount: 42000,
    currency: 'INR',
    paymentMethod: 'upi',
    transactionId: 'UPI-RAO-97900-AXIS',
    paymentStatus: 'verified',
    verifiedBy: 'Master Vijay (Director)',
    verifiedAt: '2026-11-22T09:00:00.000Z',
    createdAt: '2026-11-22T08:55:00.000Z',
  },
  {
    paymentId: 'pay-gvya-004',
    userId: 'u-gvya-004',
    userFullName: 'Sunita Mehra (Spine Care)',
    phone: '+91 94440 33445',
    packageId: 'pro-3m',
    packageName: 'Pro Classes with Props — 3 Months',
    selectedChoices: 'Studio Offline • Wall & Wheel Therapy',
    amount: 24000,
    currency: 'INR',
    paymentMethod: 'bank_transfer',
    transactionId: 'NEFT-SBIN-44033-SPINE',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
    paymentStatus: 'pending',
    createdAt: '2026-11-23T16:20:00.000Z',
  },
  {
    paymentId: 'pay-gvya-005',
    userId: 'u-gvya-005',
    userFullName: 'Rohan Verma (Kids Batch B)',
    phone: '+91 99620 55667',
    packageId: 'kids-6m',
    packageName: 'Kids Yoga — 6 Months',
    selectedChoices: 'Studio Offline • Junior Focus Batch',
    amount: 10500,
    currency: 'INR',
    paymentMethod: 'upi',
    transactionId: 'UPI-VERMA-99620-GPAY',
    paymentStatus: 'verified',
    verifiedBy: 'Master Vijay (Director)',
    verifiedAt: '2026-11-24T08:30:00.000Z',
    createdAt: '2026-11-24T08:25:00.000Z',
  }
];

export const subscribeToPayments = (
  callback: (payments: Payment[]) => void
) => {
  const emitLocal = () => callback(readLocalCollection(LOCAL_STORAGE_KEY_PAYMENTS, DEFAULT_GVYA_PAYMENTS));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_PAYMENTS, emitLocal);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              paymentId: docSnap.id,
              userId: data.userId || '',
              userFullName: data.userFullName || 'Yogi',
              phone: data.phone,
              email: data.email,
              packageId: data.packageId || '',
              packageName: data.packageName || '',
              selectedChoices: data.selectedChoices,
              amount: data.amount || 0,
              currency: data.currency || 'INR',
              paymentMethod: data.paymentMethod || 'upi',
              transactionId: data.transactionId || docSnap.id,
              proofUrl: data.proofUrl,
              paymentStatus: data.paymentStatus || 'pending',
              verifiedBy: data.verifiedBy,
              verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate().toISOString() : data.verifiedAt,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            } as Payment;
          });
          writeLocalCollection(LOCAL_STORAGE_KEY_PAYMENTS, list);
          callback(list);
        } else {
          seedDefaultPaymentsToFirestore();
          emitLocal();
        }
      },
      (error) => {
        console.warn('[paymentService] Using synced local payments cache:', error.message);
        emitLocal();
      }
    );
  } catch (err) {
    console.warn('[paymentService] Could not establish Firestore connection:', err);
  }

  return () => {
    unsubLocal();
    unsubFirestore();
  };
};

const seedDefaultPaymentsToFirestore = async () => {
  try {
    for (const p of DEFAULT_GVYA_PAYMENTS) {
      await setDoc(doc(db, COLLECTION_NAME, p.paymentId), {
        ...p,
        createdAt: serverTimestamp(),
      });
    }
  } catch {}
};

export const recordPublicPayment = async (payload: {
  userId: string;
  userFullName: string;
  phone?: string;
  email?: string;
  packageId: string;
  packageName: string;
  selectedChoices?: string;
  amount: number;
  paymentMethod: Payment['paymentMethod'];
  transactionId?: string;
  paymentStatus?: PaymentStatus;
}): Promise<Payment> => {
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const cleanAmount = Math.max(0, Math.min(500_000, Math.round(Number(payload.amount) || 0)));
  const status: PaymentStatus = payload.paymentStatus || (payload.paymentMethod === 'bank_transfer' || payload.paymentMethod === 'pay_at_studio' ? 'pending' : 'paid');

  const paymentRecord: Payment = {
    paymentId,
    userId: payload.userId,
    userFullName: sanitizeText(payload.userFullName, 100),
    phone: sanitizeText(payload.phone || '', 24) || undefined,
    email: sanitizeText(payload.email || '', 120) || undefined,
    packageId: sanitizeText(payload.packageId, 60),
    packageName: sanitizeText(payload.packageName, 140),
    selectedChoices: sanitizeText(payload.selectedChoices || '', 200) || undefined,
    amount: cleanAmount,
    currency: 'INR',
    paymentMethod: payload.paymentMethod,
    transactionId: sanitizeTransactionRef(payload.transactionId) || `GVYA-${Date.now().toString().slice(-6)}`,
    paymentStatus: status,
    createdAt: new Date().toISOString(),
  };

  const current = readLocalCollection(LOCAL_STORAGE_KEY_PAYMENTS, DEFAULT_GVYA_PAYMENTS);
  writeLocalCollection(LOCAL_STORAGE_KEY_PAYMENTS, [paymentRecord, ...current]);

  try {
    await setDoc(doc(db, COLLECTION_NAME, paymentId), {
      ...paymentRecord,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[paymentService] Public payment saved to local sync cache:', err);
  }

  return paymentRecord;
};

export const verifyBankTransferPayment = async (
  payment: Payment,
  adminName: string
): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_PAYMENTS, DEFAULT_GVYA_PAYMENTS);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_PAYMENTS,
    current.map((p) => {
      if (p.paymentId === payment.paymentId) {
        return {
          ...p,
          paymentStatus: 'verified',
          verifiedBy: adminName,
          verifiedAt: new Date().toISOString(),
        };
      }
      return p;
    })
  );

  try {
    await runTransaction(db, async (transaction) => {
      const paymentRef = doc(db, COLLECTION_NAME, payment.paymentId);
      transaction.update(paymentRef, {
        paymentStatus: 'verified',
        verifiedBy: adminName,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.warn('[paymentService] Verification saved locally:', err);
  }
};

export const rejectBankTransferPayment = async (
  paymentId: string,
  _userId: string,
  adminName: string
): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_PAYMENTS, DEFAULT_GVYA_PAYMENTS);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_PAYMENTS,
    current.map((p) => {
      if (p.paymentId === paymentId) {
        return {
          ...p,
          paymentStatus: 'rejected',
          verifiedBy: adminName,
          verifiedAt: new Date().toISOString(),
        };
      }
      return p;
    })
  );

  try {
    const paymentRef = doc(db, COLLECTION_NAME, paymentId);
    await runTransaction(db, async (transaction) => {
      transaction.update(paymentRef, {
        paymentStatus: 'rejected',
        verifiedBy: adminName,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.warn('[paymentService] Rejection saved locally:', err);
  }
};
