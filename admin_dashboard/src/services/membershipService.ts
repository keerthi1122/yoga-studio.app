import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { MembershipPlan, MembershipEnquiry } from '../types';
import { readLocalCollection, writeLocalCollection, subscribeToLocalSync } from '../utils/localStoreSync';
import { sanitizeText, sanitizeTransactionRef } from '../utils/security';
import { upsertCustomerFromPublic } from './customerService';
import { recordPublicPayment } from './paymentService';

const PLANS_COLLECTION = 'membershipPlans';
const ENQUIRIES_COLLECTION = 'membershipEnquiries';
const LOCAL_STORAGE_KEY_PLANS = 'gvya_membership_plans_v1';
const LOCAL_STORAGE_KEY_ENQUIRIES = 'gvya_membership_enquiries_v1';

export const DEFAULT_MEMBERSHIP_PLANS: MembershipPlan[] = [
  // KIDS MEMBERSHIP
  {
    planId: 'kids-1m',
    name: 'Kids Yoga — 1 Month',
    category: 'kids',
    durationMonths: 1,
    durationLabel: '1 MONTH',
    monthlyPrice: 2500,
    totalPrice: 2500,
    currency: 'INR',
    weeklyFrequency: 'Flexible Batches',
    includedClasses: ['Kids Foundation Yoga', 'Posture Alignment', 'Fun & Focus Asanas'],
    features: [
      'Posture & Flexibility Training',
      'Breathwork & Concentration Development',
      'Certified Kids Yoga Instructors',
      'Monthly Progress Assessment'
    ],
    bestValue: false,
    freeTrialAvailable: true,
    active: true,
    order: 1,
  },
  {
    planId: 'kids-3m',
    name: 'Kids Yoga — 3 Months',
    category: 'kids',
    durationMonths: 3,
    durationLabel: '3 MONTHS',
    monthlyPrice: 2000,
    totalPrice: 6000,
    currency: 'INR',
    weeklyFrequency: 'Flexible Batches',
    includedClasses: ['Kids Foundation Yoga', 'Posture Alignment', 'Fun & Focus Asanas'],
    features: [
      'Save ₹1,500 over monthly plan',
      'Spine Health & Agility Training',
      'Mindfulness & Calming Techniques',
      'Certificate of Foundation Stage'
    ],
    bestValue: false,
    freeTrialAvailable: true,
    active: true,
    order: 2,
  },
  {
    planId: 'kids-6m',
    name: 'Kids Yoga — 6 Months',
    category: 'kids',
    durationMonths: 6,
    durationLabel: '6 MONTHS',
    monthlyPrice: 1750,
    totalPrice: 10500,
    currency: 'INR',
    weeklyFrequency: 'Flexible Batches',
    includedClasses: ['Kids Foundation Yoga', 'Advanced Postures', 'Mindfulness & Agility'],
    features: [
      'Save ₹4,500 over monthly plan',
      'Advanced Balance & Strength Asanas',
      'Memory & Focus Enhancement Drills',
      'Guinness Vijay Academy Welcome Kit'
    ],
    bestValue: false,
    freeTrialAvailable: true,
    active: true,
    order: 3,
  },
  {
    planId: 'kids-1y',
    name: 'Kids Yoga — 1 Year',
    category: 'kids',
    durationMonths: 12,
    durationLabel: '1 YEAR',
    monthlyPrice: 1500,
    totalPrice: 18000,
    currency: 'INR',
    weeklyFrequency: 'Flexible Batches',
    includedClasses: ['Master Kids Curriculum', 'Advanced Postures & Flexibility', 'Asana Mastery'],
    features: [
      'Save ₹12,000 (Maximum Annual Savings)',
      'Annual Certificate of Mastery',
      'Personalized Mentor Guidance',
      'Exclusive Academy Uniform & Mat'
    ],
    bestValue: true,
    freeTrialAvailable: true,
    specialOfferText: 'SPECIAL OFFER - 1 YEAR MEMBERSHIP TOTAL RS. 18000 AT RS. 1500 PER MONTH • ONLY FOR FIRST 50 KIDS - LIMITED SEATS',
    active: true,
    order: 4,
  },

  // PRO CLASSES WITH PROPS
  {
    planId: 'pro-1m',
    name: 'Pro Classes with Props — 1 Month',
    category: 'pro',
    durationMonths: 1,
    durationLabel: '1 MONTH',
    monthlyPrice: 10000,
    totalPrice: 10000,
    currency: 'INR',
    weeklyFrequency: 'Weekly 3 Days',
    includedClasses: ['Aerial Yoga', 'Wheel Yoga', 'Wheel and Wall Yoga'],
    features: [
      'All 3 Specialized Prop Disciplines',
      'Weekly 3 Days Studio Sessions',
      'Studio Aerial Hammocks & Wheels Included',
      'Free Trial Available for All Classes'
    ],
    bestValue: false,
    freeTrialAvailable: true,
    active: true,
    order: 5,
  },
  {
    planId: 'pro-3m',
    name: 'Pro Classes with Props — 3 Months',
    category: 'pro',
    durationMonths: 3,
    durationLabel: '3 MONTHS',
    monthlyPrice: 8000,
    totalPrice: 24000,
    currency: 'INR',
    weeklyFrequency: 'Weekly 3 Days',
    includedClasses: ['Aerial Yoga', 'Wheel Yoga', 'Wheel and Wall Yoga'],
    features: [
      'Save ₹6,000 over monthly plan',
      'Weekly 3 Days Studio Sessions',
      'Deep Spinal Decompression Mastery',
      'Priority Studio Slot Booking'
    ],
    bestValue: false,
    freeTrialAvailable: true,
    active: true,
    order: 6,
  },
  {
    planId: 'pro-6m',
    name: 'Pro Classes with Props — 6 Months',
    category: 'pro',
    durationMonths: 6,
    durationLabel: '6 MONTHS',
    monthlyPrice: 7000,
    totalPrice: 42000,
    currency: 'INR',
    weeklyFrequency: 'Weekly 3 Days',
    includedClasses: ['Aerial Yoga', 'Wheel Yoga', 'Wheel and Wall Yoga'],
    features: [
      'Save ₹18,000 over monthly plan',
      'Weekly 3 Days Studio Sessions',
      'Advanced Inversion & Flow Techniques',
      'Complimentary Master Workshop Access'
    ],
    bestValue: false,
    freeTrialAvailable: true,
    active: true,
    order: 7,
  },
  {
    planId: 'pro-1y',
    name: 'Pro Classes with Props — 1 Year',
    category: 'pro',
    durationMonths: 12,
    durationLabel: '1 YEAR',
    monthlyPrice: 6000,
    totalPrice: 72000,
    currency: 'INR',
    weeklyFrequency: 'Weekly 3 Days',
    includedClasses: ['Aerial Yoga', 'Wheel Yoga', 'Wheel and Wall Yoga'],
    features: [
      'Save ₹48,000 (Maximum Annual Discount)',
      'Weekly 3 Days Complete Disciplines',
      'VIP Class Reservation Priority',
      'Master Level Inversion Certification'
    ],
    bestValue: true,
    freeTrialAvailable: true,
    specialOfferText: 'BEST VALUE ANNUAL PASS • SAVE ₹48,000 WITH YEAR-ROUND ADVANCED PROP ACCESS',
    active: true,
    order: 8,
  },
];

export const subscribeToMembershipPlans = (
  callback: (plans: MembershipPlan[]) => void
): (() => void) => {
  const emitLocal = () => callback(readLocalCollection(LOCAL_STORAGE_KEY_PLANS, DEFAULT_MEMBERSHIP_PLANS));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_PLANS, emitLocal);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, PLANS_COLLECTION), orderBy('order', 'asc'));
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              planId: docSnap.id,
              name: data.name || '',
              category: data.category || 'kids',
              durationMonths: Number(data.durationMonths) || 1,
              durationLabel: data.durationLabel || `${data.durationMonths || 1} MONTH`,
              monthlyPrice: Number(data.monthlyPrice) || 0,
              totalPrice: Number(data.totalPrice) || 0,
              currency: data.currency || 'INR',
              weeklyFrequency: data.weeklyFrequency || 'Weekly 3 Days',
              includedClasses: Array.isArray(data.includedClasses) ? data.includedClasses : [],
              features: Array.isArray(data.features) ? data.features : [],
              bestValue: Boolean(data.bestValue),
              freeTrialAvailable: data.freeTrialAvailable !== false,
              specialOfferText: data.specialOfferText || '',
              active: data.active !== false,
              order: Number(data.order) || 99,
            } as MembershipPlan;
          });
          writeLocalCollection(LOCAL_STORAGE_KEY_PLANS, list);
          callback(list);
        } else {
          writeLocalCollection(LOCAL_STORAGE_KEY_PLANS, DEFAULT_MEMBERSHIP_PLANS);
          emitLocal();
        }
      },
      (error) => {
        console.warn('[membershipService] Firestore listener note:', error.message);
        emitLocal();
      }
    );
  } catch (err) {
    console.warn('[membershipService] Firestore query error:', err);
  }

  return () => {
    unsubLocal();
    unsubFirestore();
  };
};

export const createMembershipPlan = async (
  planData: Omit<MembershipPlan, 'planId'>
): Promise<string> => {
  const newId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const plan: MembershipPlan = {
    ...planData,
    name: sanitizeText(planData.name, 120),
    planId: newId,
  };

  const current = readLocalCollection(LOCAL_STORAGE_KEY_PLANS, DEFAULT_MEMBERSHIP_PLANS);
  writeLocalCollection(LOCAL_STORAGE_KEY_PLANS, [...current, plan]);

  try {
    const docRef = doc(db, PLANS_COLLECTION, newId);
    await setDoc(docRef, {
      ...plan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[membershipService] Saved locally, remote sync postponed:', err);
  }

  return newId;
};

export const updateMembershipPlan = async (
  planId: string,
  updates: Partial<MembershipPlan>
): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_PLANS, DEFAULT_MEMBERSHIP_PLANS);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_PLANS,
    current.map((p) => (p.planId === planId ? { ...p, ...updates } : p))
  );

  try {
    const docRef = doc(db, PLANS_COLLECTION, planId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[membershipService] Updated locally, remote sync postponed:', err);
  }
};

export const deleteMembershipPlan = async (planId: string): Promise<void> => {
  const current = readLocalCollection(LOCAL_STORAGE_KEY_PLANS, DEFAULT_MEMBERSHIP_PLANS);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_PLANS,
    current.filter((p) => p.planId !== planId)
  );

  try {
    const docRef = doc(db, PLANS_COLLECTION, planId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[membershipService] Deleted locally, remote sync postponed:', err);
  }
};

export const toggleMembershipPlanActive = async (
  planId: string,
  currentActive: boolean
): Promise<void> => {
  await updateMembershipPlan(planId, { active: !currentActive });
};

export const seedDefaultMembershipPlans = async (): Promise<void> => {
  writeLocalCollection(LOCAL_STORAGE_KEY_PLANS, DEFAULT_MEMBERSHIP_PLANS);
  try {
    for (const plan of DEFAULT_MEMBERSHIP_PLANS) {
      const docRef = doc(db, PLANS_COLLECTION, plan.planId);
      await setDoc(docRef, {
        ...plan,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.warn('[membershipService] Note on seed sync:', err);
  }
};

// --- Enquiries, Purchases & Free Trial Submissions ---

export const submitMembershipEnquiry = async (
  enquiryData: Omit<MembershipEnquiry, 'enquiryId' | 'createdAt' | 'status'>
): Promise<string> => {
  const enquiryId = `enq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const isPurchase = enquiryData.submissionType === 'purchase' && (enquiryData.amountPaid || 0) > 0;
  const cleanTx = sanitizeTransactionRef(enquiryData.transactionId);

  const enquiry: MembershipEnquiry = {
    ...enquiryData,
    fullName: sanitizeText(enquiryData.fullName, 100),
    phone: sanitizeText(enquiryData.phone, 24),
    email: sanitizeText(enquiryData.email || '', 120) || undefined,
    ageOrGroup: sanitizeText(enquiryData.ageOrGroup || '', 40) || undefined,
    planName: sanitizeText(enquiryData.planName || '', 140) || undefined,
    promoCode: sanitizeText(enquiryData.promoCode || '', 24).toUpperCase() || undefined,
    transactionId: cleanTx || (isPurchase ? `GVYA-${Date.now().toString().slice(-6)}` : undefined),
    notes: sanitizeText(enquiryData.notes || '', 400) || undefined,
    enquiryId,
    status: isPurchase ? 'enrolled' : 'new',
    createdAt: new Date().toISOString(),
  };

  // 1. Save enquiry locally & broadcast across tabs
  const current = readLocalCollection<MembershipEnquiry>(LOCAL_STORAGE_KEY_ENQUIRIES, []);
  writeLocalCollection(LOCAL_STORAGE_KEY_ENQUIRIES, [enquiry, ...current]);

  // 2. If user purchased/enrolled, synchronize Customer + Payment Ledger + Credits immediately!
  if (isPurchase) {
    const months = Number(enquiry.durationMonths) || 1;
    const creditsEarned = months * 12; // 3 sessions/week approx
    const userId = await upsertCustomerFromPublic({
      fullName: enquiry.fullName,
      phone: enquiry.phone,
      email: enquiry.email,
      activeMembershipId: enquiry.planId,
      activeMembershipName: enquiry.planName,
      selectedMode: enquiry.selectedMode || 'offline',
      selectedProps: enquiry.selectedProps,
      creditsToAdd: creditsEarned,
    });

    const choicesParts = [
      enquiry.selectedMode ? `Mode: ${enquiry.selectedMode.toUpperCase()}` : '',
      enquiry.selectedProps?.length ? `Focus: ${enquiry.selectedProps.join(', ')}` : '',
      enquiry.preferredDays ? `${enquiry.preferredDays}` : '',
    ].filter(Boolean);

    const payMethod =
      enquiry.paymentMethod && enquiry.paymentMethod !== 'free_trial'
        ? enquiry.paymentMethod
        : 'upi';

    await recordPublicPayment({
      userId,
      userFullName: enquiry.fullName,
      phone: enquiry.phone,
      email: enquiry.email,
      packageId: enquiry.planId || 'custom-membership',
      packageName: enquiry.planName || 'GVYA Membership',
      selectedChoices: choicesParts.join(' • '),
      amount: enquiry.amountPaid || 0,
      paymentMethod: payMethod,
      transactionId: enquiry.transactionId,
      paymentStatus: enquiry.paymentStatus || (payMethod === 'card' || payMethod === 'upi' ? 'verified' : 'pending'),
    });
  }

  // 3. Persist to Firestore (respecting public create rules)
  try {
    const docRef = doc(db, ENQUIRIES_COLLECTION, enquiryId);
    await setDoc(docRef, {
      ...enquiry,
      serverTime: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[membershipService] Enquiry saved locally:', err);
  }

  return enquiryId;
};

export const subscribeToEnquiries = (
  callback: (enquiries: MembershipEnquiry[]) => void
): (() => void) => {
  const emitLocal = () => callback(readLocalCollection<MembershipEnquiry>(LOCAL_STORAGE_KEY_ENQUIRIES, []));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_ENQUIRIES, emitLocal);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, ENQUIRIES_COLLECTION));
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteList = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              enquiryId: docSnap.id,
              ...(data as Omit<MembershipEnquiry, 'enquiryId'>),
            } as MembershipEnquiry;
          });
          // Merge remote with local so nothing unsynced disappears
          const localList = readLocalCollection<MembershipEnquiry>(LOCAL_STORAGE_KEY_ENQUIRIES, []);
          const map = new Map<string, MembershipEnquiry>();
          localList.forEach((e) => map.set(e.enquiryId, e));
          remoteList.forEach((e) => map.set(e.enquiryId, e));
          const merged = Array.from(map.values()).sort((a, b) =>
            (b.createdAt || '').localeCompare(a.createdAt || '')
          );
          writeLocalCollection(LOCAL_STORAGE_KEY_ENQUIRIES, merged);
          callback(merged);
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

export const updateEnquiryStatus = async (
  enquiryId: string,
  status: MembershipEnquiry['status']
): Promise<void> => {
  const current = readLocalCollection<MembershipEnquiry>(LOCAL_STORAGE_KEY_ENQUIRIES, []);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_ENQUIRIES,
    current.map((e) => (e.enquiryId === enquiryId ? { ...e, status } : e))
  );

  try {
    const docRef = doc(db, ENQUIRIES_COLLECTION, enquiryId);
    await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
  } catch {}
};

export const convertEnquiryToActiveMember = async (
  enquiry: MembershipEnquiry,
  amountCollected: number
): Promise<void> => {
  const current = readLocalCollection<MembershipEnquiry>(LOCAL_STORAGE_KEY_ENQUIRIES, []);
  writeLocalCollection(
    LOCAL_STORAGE_KEY_ENQUIRIES,
    current.map((e) =>
      e.enquiryId === enquiry.enquiryId
        ? {
            ...e,
            status: 'enrolled',
            amountPaid: amountCollected,
            paymentStatus: 'verified',
          }
        : e
    )
  );

  const months = enquiry.durationMonths || 1;
  const userId = await upsertCustomerFromPublic({
    fullName: enquiry.fullName,
    phone: enquiry.phone,
    email: enquiry.email,
    activeMembershipId: enquiry.planId || 'custom-membership',
    activeMembershipName: enquiry.planName || 'GVYA Membership',
    selectedMode: enquiry.selectedMode || 'offline',
    selectedProps: enquiry.selectedProps,
    creditsToAdd: months * 12,
  });

  if (amountCollected > 0) {
    await recordPublicPayment({
      userId,
      userFullName: enquiry.fullName,
      phone: enquiry.phone,
      email: enquiry.email,
      packageId: enquiry.planId || 'custom-membership',
      packageName: enquiry.planName || 'GVYA Membership',
      selectedChoices: `${enquiry.selectedMode?.toUpperCase() || 'STUDIO'} • ${enquiry.selectedProps?.join(', ') || 'Standard'}`,
      amount: amountCollected,
      paymentMethod: enquiry.paymentMethod && enquiry.paymentMethod !== 'free_trial' ? enquiry.paymentMethod : 'upi',
      transactionId: enquiry.transactionId || `ADM-${Date.now().toString().slice(-6)}`,
      paymentStatus: 'verified',
    });
  }
};
