import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMainDomainUrl } from '../../utils/domain';

const SellerLogin: React.FC = () => {
  const { signIn, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    setIsLoading(true);

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
      setIsLoading(false);
      return;
    }

    // Redirect based on the actual user role from the result
    const userRole = result.role;
    
    if (userRole === 'seller') {
      navigate('/seller/dashboard');
    } else {
      // Non-sellers should not stay signed in via seller portal
      setError('Only sellers can sign in here. Please use the customer login.');
      await signOut();
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-10 relative">
        <a
          href={getMainDomainUrl('/')}
          className="absolute top-4 left-4 text-xs font-semibold text-gray-500 hover:text-black"
        >
          Back to Home
        </a>
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold">Seller Login</h1>
          <p className="text-gray-500 text-sm mt-2">Enter your email and password to access your seller account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {successMessage && (
            <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="seller-email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="seller-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="seller-password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="seller-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end">
              <Link
                to="/seller/forgot-password"
                className="text-xs font-semibold text-gray-500 hover:text-black"
              >
                Forgot Key?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          New here?{' '}
          <Link to="/seller/signup" className="font-semibold text-black hover:underline">
            Create your account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;
