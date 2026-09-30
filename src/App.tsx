import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { DocumentUploadPage } from '@/pages/DocumentUploadPage';
import { DocumentDetailPage } from '@/pages/DocumentDetailPage';
import { ProcessingPage } from '@/pages/ProcessingPage';
import { RecordsPage } from '@/pages/RecordsPage';
import { RecordDetailPage } from '@/pages/RecordDetailPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { RegistrarApprovalPage } from '@/pages/RegistrarApprovalPage';
import { PipelinePage } from '@/pages/PipelinePage';
import { MapsPage } from '@/pages/MapsPage';
import { SearchPage } from '@/pages/SearchPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AuditPage } from '@/pages/AuditPage';
import { UsersPage } from '@/pages/UsersPage';
import { SettingsPage } from '@/pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f6f2]">
        <div className="w-10 h-10 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f6f2]">
        <div className="w-10 h-10 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
      <Route path="/documents/upload" element={<ProtectedRoute><DocumentUploadPage /></ProtectedRoute>} />
      <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetailPage /></ProtectedRoute>} />
      <Route path="/processing" element={<ProtectedRoute><ProcessingPage /></ProtectedRoute>} />
      <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
      <Route path="/records/:id" element={<ProtectedRoute><RecordDetailPage /></ProtectedRoute>} />
      <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
      <Route path="/registrar-approval" element={<ProtectedRoute><RegistrarApprovalPage /></ProtectedRoute>} />
      <Route path="/pipeline/:id" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
      <Route path="/maps" element={<ProtectedRoute><MapsPage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
