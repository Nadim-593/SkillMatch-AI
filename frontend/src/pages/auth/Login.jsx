import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const result = await login(data);
      const redirects = {
        candidate: '/candidate/dashboard',
        recruiter: '/recruiter/dashboard',
        admin: '/admin/dashboard',
      };
      const from = location.state?.from?.pathname || redirects[result.user.role] || '/candidate/dashboard';
      toast.success(`Welcome back, ${result.user.name || 'User'}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in</h2>
      <p className="text-gray-500 text-xs mb-6">Access your SkillMatch AI account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label text-xs">Email Address</label>
          <input
            type="email"
            className="input text-xs"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label text-xs">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input text-xs pr-10"
              placeholder="Your password"
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-[11px] mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" className="btn-primary w-full py-2 text-xs" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
          {!isSubmitting && <LogIn className="w-4 h-4 ml-1" />}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-5">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-primary-600 font-semibold hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
