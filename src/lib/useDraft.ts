import { useEffect, useCallback, useRef } from 'react';

const DRAFT_PREFIX = 'pain_draft_';

export function useDraft<T>(key: string, data: T, onRestore: (data: T) => void) {
  const storageKey = DRAFT_PREFIX + key;
  const restoredRef = useRef(false);

  // Restore draft on mount (once)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { data: T; savedAt: string };
        // Only restore if less than 24 hours old
        const age = Date.now() - new Date(parsed.savedAt).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          onRestore(parsed.data);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // ignore corrupted data
    }
  }, [storageKey, onRestore]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          data,
          savedAt: new Date().toISOString(),
        }));
      } catch {
        // storage full, ignore
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [storageKey, data]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const hasDraft = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      const age = Date.now() - new Date(parsed.savedAt).getTime();
      return age < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }, [storageKey]);

  return { clearDraft, hasDraft };
}
