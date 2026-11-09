import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain } from 'lucide-react';

export default function AuthLayout() {
  const { user } = useAuth();
  
  if (user) {
    const redirects = {
      candidate: '/candidate/dashboard',
      recruiter: '/recruiter/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={redirects[user.role] || '/candidate/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 mb-3 shadow-md">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SkillMatch AI</h1>
          <p className="text-gray-500 text-sm mt-1">AI-Powered Job–Candidate Matching Platform</p>
        </div>
        <div className="card p-6 sm:p-8 shadow-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
