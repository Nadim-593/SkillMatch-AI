import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-8xl font-black text-gray-200">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Page Not Found</h2>
        <p className="text-gray-500 text-xs mt-1 mb-6">The requested URL does not exist on this server.</p>
        <Link to="/" className="btn-primary text-xs inline-flex">
          <Home className="w-4 h-4 mr-1.5" />
          Return to Home
        </Link>
      </div>
    </div>
  );
}
