import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { StudioSettings } from '../types';

export const subscribeToStudioSettings = (
  callback: (settings: StudioSettings) => void,
  fallbackData: StudioSettings
) => {
  try {
    const docRef = doc(db, 'studioSettings', 'default');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as StudioSettings);
        } else {
          callback(fallbackData);
        }
      },
      (err) => {
        console.warn('[studioService] Using fallback settings:', err);
        callback(fallbackData);
      }
    );
  } catch (err) {
    callback(fallbackData);
    return () => {};
  }
};

export const updateStudioSettings = async (settings: StudioSettings): Promise<void> => {
  const docRef = doc(db, 'studioSettings', 'default');
  await setDoc(
    docRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

