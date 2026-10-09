import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

import CandidateDashboard from './pages/candidate/Dashboard';
import CvUploadReview from './pages/candidate/CvUploadReview';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '8px', fontSize: '13px' },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Candidate routes */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute roles={['candidate']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route path="profile" element={<CandidateDashboard />} />
            <Route path="cv" element={<CvUploadReview />} />
            <Route path="jobs" element={<CandidateDashboard />} />
            <Route path="matches" element={<CandidateDashboard />} />
            <Route path="history" element={<CandidateDashboard />} />
          </Route>

          {/* Recruiter routes */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute roles={['recruiter']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<RecruiterDashboard />} />
            <Route path="jobs" element={<RecruiterDashboard />} />
            <Route path="candidates" element={<RecruiterDashboard />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="jobs" element={<AdminDashboard />} />
            <Route path="skills" element={<AdminDashboard />} />
            <Route path="resources" element={<AdminDashboard />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
