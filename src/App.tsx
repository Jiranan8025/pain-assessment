import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './lib/toast';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import PatientListPage from './pages/PatientListPage';
import NewAssessmentPage from './pages/NewAssessmentPage';
import SummaryPage from './pages/SummaryPage';
import AssessmentHistoryPage from './pages/AssessmentHistoryPage';
import PatientFormPage from './pages/PatientFormPage';
import PatientCompletePage from './pages/PatientCompletePage';
import EditAssessmentPage from './pages/EditAssessmentPage';

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, loading, logout, userEmail } = useAuth();
  const isPatientRoute = location.pathname.startsWith('/form');

  // หน้าสำหรับคนไข้ไม่ต้อง login
  if (isPatientRoute) {
    return (
      <Routes>
        <Route path="/form" element={<PatientFormPage />} />
        <Route path="/form/complete/:id" element={<PatientCompletePage />} />
      </Routes>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500 text-sm">กำลังตรวจสอบ...</p>
        </div>
      </div>
    );
  }

  // ยังไม่ login → แสดงหน้า Login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // หน้าสำหรับพยาบาล (admin) — ต้อง login แล้ว
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print bg-primary text-white py-3 px-6 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-sm leading-tight">Siriraj Pain Assessment</h1>
            <p className="text-[10px] text-blue-200">แผนกระงับปวด โรงพยาบาลศิริราช</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-blue-200">{userEmail}</span>
            <button
              onClick={logout}
              className="px-3 py-1 text-[11px] bg-white/15 hover:bg-white/25 rounded text-white transition-all"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <Routes>
          <Route path="/" element={<PatientListPage />} />
          <Route path="/new" element={<NewAssessmentPage />} />
          <Route path="/summary/:id" element={<SummaryPage />} />
          <Route path="/edit/:id" element={<EditAssessmentPage />} />
          <Route path="/patient/:patientId" element={<AssessmentHistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
