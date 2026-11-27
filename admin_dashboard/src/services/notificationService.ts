import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { StudioNotification } from '../types';
import { readLocalCollection, writeLocalCollection, subscribeToLocalSync } from '../utils/localStoreSync';
import { sanitizeText } from '../utils/security';

const COLLECTION_NAME = 'notifications';
const LOCAL_STORAGE_KEY_NOTIFS = 'gvya_notifications_cache_v1';

export const DEFAULT_NOTIFICATIONS: StudioNotification[] = [
  {
    id: 'notif-gvya-001',
    title: 'Admissions Open: Batch 2026 Limited to 50 Students',
    message: 'Enroll in Annual Kids Yoga (₹1,500/mo) or Pro Prop Mastery (₹6,000/mo) with instant video & studio access.',
    type: 'announcement',
    targetAudience: 'all_customers',
    sentAt: 'Today • 08:00 AM',
    status: 'sent',
  },
];

export const subscribeToNotifications = (
  callback: (list: StudioNotification[]) => void
) => {
  const emitLocal = () => callback(readLocalCollection(LOCAL_STORAGE_KEY_NOTIFS, DEFAULT_NOTIFICATIONS));
  emitLocal();
  const unsubLocal = subscribeToLocalSync(LOCAL_STORAGE_KEY_NOTIFS, emitLocal);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, COLLECTION_NAME));
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<StudioNotification, 'id'>),
          }));
          writeLocalCollection(LOCAL_STORAGE_KEY_NOTIFS, list);
          callback(list);
        }
      },
      () => {}
    );
  } catch {}

  return () => {
    unsubLocal();
    unsubFirestore();
  };
};

export const sendStudioNotification = async (
  payload: Omit<StudioNotification, 'id' | 'sentAt' | 'status'>
): Promise<StudioNotification> => {
  const newNotif: StudioNotification = {
    id: `notif_${Date.now()}`,
    title: sanitizeText(payload.title, 120),
    message: sanitizeText(payload.message, 600),
    type: payload.type,
    targetAudience: payload.targetAudience,
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
    status: 'sent',
  };

  const current = readLocalCollection(LOCAL_STORAGE_KEY_NOTIFS, DEFAULT_NOTIFICATIONS);
  writeLocalCollection(LOCAL_STORAGE_KEY_NOTIFS, [newNotif, ...current]);

  try {
    await setDoc(doc(db, COLLECTION_NAME, newNotif.id), {
      ...newNotif,
      createdAt: serverTimestamp(),
    });
  } catch {}

  return newNotif;
};
