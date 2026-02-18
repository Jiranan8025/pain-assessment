import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './lib/toast';
import PatientListPage from './pages/PatientListPage';
import NewAssessmentPage from './pages/NewAssessmentPage';
import SummaryPage from './pages/SummaryPage';
import AssessmentHistoryPage from './pages/AssessmentHistoryPage';
import PatientFormPage from './pages/PatientFormPage';
import PatientCompletePage from './pages/PatientCompletePage';
import EditAssessmentPage from './pages/EditAssessmentPage';

function AppLayout() {
  const location = useLocation();
  const isPatientRoute = location.pathname.startsWith('/form');

  // หน้าสำหรับคนไข้ไม่แสดง admin header
  if (isPatientRoute) {
    return (
      <Routes>
        <Route path="/form" element={<PatientFormPage />} />
        <Route path="/form/complete/:id" element={<PatientCompletePage />} />
      </Routes>
    );
  }

  // หน้าสำหรับพยาบาล (admin)
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print bg-primary text-white py-3 px-6 shadow-md">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-bold text-sm leading-tight">Siriraj Pain Assessment</h1>
          <p className="text-[10px] text-blue-200">แผนกระงับปวด โรงพยาบาลศิริราช</p>
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
        <Toaster />
        <AppLayout />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
