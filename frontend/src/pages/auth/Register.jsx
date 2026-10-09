import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: 'candidate' },
  });
  const password = watch('password');

  const onSubmit = async ({ name, email, password, role }) => {
    try {
      await registerUser({ name, email, password, role });
      toast.success('Account created! Please sign in with your credentials.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Create Account</h2>
      <p className="text-gray-500 text-xs mb-5">Get started with SkillMatch AI</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div>
          <label className="label text-xs">Full Name</label>
          <input
            className="input text-xs"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name too short' } })}
          />
          {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label text-xs">Email Address</label>
          <input
            type="email"
            className="input text-xs"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
          />
          {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label text-xs">I am a</label>
          <select className="input text-xs" {...register('role')}>
            <option value="candidate">Candidate — Looking for jobs</option>
            <option value="recruiter">Recruiter — Hiring talent</option>
          </select>
        </div>

        <div>
          <label className="label text-xs">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input text-xs pr-10"
              placeholder="Minimum 8 characters"
              {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
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

        <div>
          <label className="label text-xs">Confirm Password</label>
          <input
            type="password"
            className="input text-xs"
            placeholder="Repeat password"
            {...register('confirmPassword', {
              required: 'Please confirm password',
              validate: (v) => v === password || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && <p className="text-red-500 text-[11px] mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" className="btn-primary w-full py-2 text-xs" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
          {!isSubmitting && <UserPlus className="w-4 h-4 ml-1" />}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
