import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CoupleProvider } from '@/context/CoupleContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HeartBurstLayer } from '@/components/effects/HeartBurst';
import { FullScreenLoader } from '@/components/ui/Spinner';

import Welcome from '@/pages/auth/Welcome';
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';
import ChooseRole from '@/pages/auth/ChooseRole';
import LinkPartner from '@/pages/auth/LinkPartner';

import Home from '@/pages/Home';
import LoveNotes from '@/pages/LoveNotes';
import Memories from '@/pages/Memories';
import CalendarPage from '@/pages/CalendarPage';
import StudyTogether from '@/pages/StudyTogether';
import MoodPage from '@/pages/MoodPage';
import Locket from '@/pages/Locket';
import BucketList from '@/pages/BucketList';
import SecretSurprise from '@/pages/SecretSurprise';
import More from '@/pages/More';
import Settings from '@/pages/Settings';

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return <Navigate to={session ? '/home' : '/welcome'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route
        path="/choose-role"
        element={
          <ProtectedRoute stage="auth-only">
            <ChooseRole />
          </ProtectedRoute>
        }
      />
      <Route
        path="/link-partner"
        element={
          <ProtectedRoute stage="role-only">
            <LinkPartner />
          </ProtectedRoute>
        }
      />

      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><LoveNotes /></ProtectedRoute>} />
      <Route path="/memories" element={<ProtectedRoute><Memories /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/study" element={<ProtectedRoute><StudyTogether /></ProtectedRoute>} />
      <Route path="/mood" element={<ProtectedRoute><MoodPage /></ProtectedRoute>} />
      <Route path="/locket" element={<ProtectedRoute><Locket /></ProtectedRoute>} />
      <Route path="/bucket-list" element={<ProtectedRoute><BucketList /></ProtectedRoute>} />
      <Route path="/surprises" element={<ProtectedRoute><SecretSurprise /></ProtectedRoute>} />
      <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CoupleProvider>
          <BrowserRouter>
            <div className="mx-auto max-w-md">
              <AppRoutes />
            </div>
            <HeartBurstLayer />
          </BrowserRouter>
        </CoupleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
