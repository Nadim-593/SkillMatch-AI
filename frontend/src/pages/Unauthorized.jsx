import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 text-xs mt-1 mb-6">You do not have authorization to view this resource.</p>
        <button onClick={() => navigate(-1)} className="btn-outline text-xs inline-flex">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Go Back
        </button>
      </div>
    </div>
  );
}
