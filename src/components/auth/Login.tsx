import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { detectDomain, getMainDomainUrl, getSellerDomainUrl } from '../../utils/domain';

interface LoginProps {
  role?: 'user' | 'seller' | 'admin';
}

export const Login: React.FC<LoginProps> = ({ role: roleProp }) => {
  // Auto-detect role from subdomain; fallback to prop
  const detectedDomain = detectDomain();
  const role = roleProp ?? (detectedDomain === 'admin' ? 'admin' : detectedDomain === 'seller' ? 'seller' : 'user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from password reset
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state so message doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);

    if (!result.success || result.error) {
      // Better error messages
      const errorMessage = result.error?.message || '';
      if (errorMessage.includes('Incorrect username or password')) {
        setError('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('User does not exist')) {
        setError('No account found with this email. Please sign up first.');
      } else if (errorMessage.includes('NotAuthorizedException')) {
        setError('Incorrect email or password.');
      } else {
        setError(errorMessage || 'Failed to sign in');
      }
      setLoading(false);
      return;
    }

    // Wait a moment for the user profile to be fetched
    setTimeout(() => {
      const userRole = result.role || role;
      
      // Redirect based on role and current domain
      if (userRole === 'admin') {
        // Admin must be on admin subdomain
        if (detectedDomain === 'admin') {
          navigate('/admin');
        } else {
          // Redirect to admin subdomain
          window.location.href = getMainDomainUrl('/admin');
        }
      } else if (userRole === 'seller') {
        if (detectedDomain === 'seller') {
          navigate('/seller/dashboard');
        } else {
          window.location.href = getSellerDomainUrl('/dashboard');
        }
      } else {
        if (detectedDomain === 'main' || detectedDomain === 'seller' || detectedDomain === 'admin') {
          window.location.href = getMainDomainUrl('/');
        } else {
          navigate('/');
        }
      }
      setLoading(false);
    }, 500);
  };

  const getSignupLink = () => {
    if (role === 'admin') return null; // Admin accounts are created via backend only
    if (role === 'seller' || detectedDomain === 'seller') return '/seller/signup';
    return '/signup';
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-10 relative">
        <Link
          to="/"
          className="absolute top-4 left-4 text-xs font-semibold text-gray-500 hover:text-black"
        >
          Back to Home
        </Link>
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold">Sign in to your account</h1>
          <p className="text-gray-500 text-sm mt-2">Enter your email and password to continue.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {successMessage && (
            <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-gray-500 hover:text-black"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {getSignupLink() && (
            <div className="text-center text-sm text-gray-600">
              New here?{' '}
              <Link to={getSignupLink()!} className="font-semibold text-black hover:underline">
                Create your account
              </Link>
            </div>
          )}

          {role === 'admin' && !getSignupLink() && (
            <div className="text-center text-sm text-gray-500">
              Admin accounts are created via backend only.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
