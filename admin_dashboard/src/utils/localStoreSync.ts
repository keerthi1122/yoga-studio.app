import { safeJsonParse } from './security';

const SYNC_EVENT_NAME = 'gvya:data_updated';
const CHANNEL_NAME = 'gvya_realtime_sync_channel';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

/**
 * Reads an array store safely from localStorage with fallback seed.
 */
export const readLocalCollection = <T>(storageKey: string, fallbackSeed: T[]): T[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallbackSeed;
    const parsed = safeJsonParse<T[] | null>(raw, null);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    if (Array.isArray(parsed) && fallbackSeed.length === 0) {
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return fallbackSeed;
};

/**
 * Writes an array store to localStorage AND notifies listeners across
 * same-tab components AND other open browser tabs (public site <-> admin portal).
 */
export const writeLocalCollection = <T>(storageKey: string, list: T[]): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { key: storageKey } }));
    }
    broadcastChannel?.postMessage({ key: storageKey, ts: Date.now() });
  } catch {
    // ignore storage quota errors
  }
};

/**
 * Subscribes a callback to both same-tab updates, cross-tab storage events,
 * and BroadcastChannel updates for a given localStorage key.
 */
export const subscribeToLocalSync = (storageKey: string, onSync: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e: Event) => {
    const customEvent = e as CustomEvent<{ key?: string }>;
    if (!customEvent.detail?.key || customEvent.detail.key === storageKey) {
      onSync();
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (!e.key || e.key === storageKey) {
      onSync();
    }
  };

  const handleBroadcast = (e: MessageEvent<{ key?: string }>) => {
    if (!e.data?.key || e.data.key === storageKey) {
      onSync();
    }
  };

  window.addEventListener(SYNC_EVENT_NAME, handleCustom);
  window.addEventListener('storage', handleStorage);
  broadcastChannel?.addEventListener('message', handleBroadcast);

  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, handleCustom);
    window.removeEventListener('storage', handleStorage);
    broadcastChannel?.removeEventListener('message', handleBroadcast);
  };
};
