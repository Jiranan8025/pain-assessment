import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * แสดงข้อความเตือนเมื่อผู้ใช้พยายามออกจากหน้าที่มีข้อมูลยังไม่ได้บันทึก
 * - กดปุ่มย้อนกลับ / เปลี่ยนหน้า → React Router blocker
 * - ปิดแท็บ / รีเฟรช → beforeunload event
 */
export function useUnsavedWarning(hasUnsavedChanges: boolean) {
  // Block browser tab close / refresh
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Block React Router navigation
  const blocker = useBlocker(hasUnsavedChanges);

  return blocker;
}
