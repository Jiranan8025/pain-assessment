import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * แสดงข้อความเตือนเมื่อผู้ใช้พยายามออกจากหน้าที่มีข้อมูลยังไม่ได้บันทึก
 * - ปิดแท็บ / รีเฟรช → beforeunload event
 * - เปลี่ยนหน้าใน app → ใช้ custom confirm dialog (ไม่ใช้ useBlocker เพราะต้องการ data router)
 */
export function useUnsavedWarning(hasUnsavedChanges: boolean) {
  const [blockerState, setBlockerState] = useState<'idle' | 'blocked'>('idle');
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigate = useNavigate();

  // Block browser tab close / refresh
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const proceed = useCallback(() => {
    setBlockerState('idle');
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  }, [pendingPath, navigate]);

  const reset = useCallback(() => {
    setBlockerState('idle');
    setPendingPath(null);
  }, []);

  return {
    state: blockerState as 'idle' | 'blocked',
    proceed,
    reset,
  };
}
