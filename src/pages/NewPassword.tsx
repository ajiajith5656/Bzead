import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Loader2, ChevronLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NewPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmPasswordReset } = useAuth();
  const isBrowser = typeof window !== 'undefined';
  const { email: stateEmail, otpCode: stateOtpCode, role: stateRole } = location.state || {};

  const storedResetContext = useMemo(() => {
    if (!isBrowser) return null;
    try {
      const raw = sessionStorage.getItem('resetContext');
      return raw ? JSON.parse(raw) as { email?: string; otpCode?: string; role?: string } : null;
    } catch {
      return null;
    }
  }, [isBrowser]);

  const email = stateEmail || storedResetContext?.email;
  const otpCode = stateOtpCode || storedResetContext?.otpCode;
  const role = stateRole || storedResetContext?.role || (location.pathname.includes('/seller') ? 'seller' : 'user');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Redirect if no email or OTP code
  useEffect(() => {
    if (!email || !otpCode) {
      const redirectPath = role === 'seller' ? '/seller/forgot-password' : '/forgot-password';
      navigate(redirectPath, { 
        state: { error: 'Invalid session. Please start the password reset process again.' }
      });
    }
  }, [email, otpCode, navigate, role]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password.length > 16) {
      errors.push('Password must not exceed 16 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Must contain at least one special character (!@#$%^&*...)');
    }

    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    if (value) {
      setPasswordErrors(validatePassword(value));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !otpCode) {
      setError('Session expired. Please restart the reset process.');
      return;
    }

    // Validate
    if (!newPassword || !confirmPassword) {
      setError('Please enter both passwords');
      return;
    }

    const pwErrors = validatePassword(newPassword);
    if (pwErrors.length > 0) {
      setPasswordErrors(pwErrors);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Call confirmPasswordReset with email, OTP code, and new password
      const result = await confirmPasswordReset(email, otpCode, newPassword);

      if (result.success) {
        setSuccess(true);
        if (isBrowser) {
          sessionStorage.removeItem('resetContext');
        }
        setTimeout(() => {
          // Redirect to appropriate login page based on role
          const loginPath = role === 'seller' ? '/seller/login' : '/login';
          navigate(loginPath, {
            state: { message: 'Password reset successfully! Please login with your new password.' }
          });
        }, 2000);
      } else {
        setError(result.error?.message || 'Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Error resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-6 md:p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">Password Reset Successful</h1>
          <p className="text-gray-600 text-sm mb-6">
            Your password has been updated successfully. Redirecting to login...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-6 md:p-8 relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-gray-500 hover:text-black transition flex items-center gap-1 text-xs md:text-sm"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl md:text-3xl font-semibold">Set new password</h1>
          <p className="text-gray-500 text-sm mt-2">
            Enter a strong password for your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* New Password Field */}
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 md:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition bg-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Validation Feedback */}
            {newPassword && (
              <div className="space-y-1 mt-2">
                {passwordErrors.length === 0 ? (
                  <p className="text-green-600 text-xs flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Password is strong
                  </p>
                ) : (
                  passwordErrors.map((error, idx) => (
                    <p key={idx} className="text-red-600 text-xs">
                      • {error}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-2.5 md:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition bg-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Match Feedback */}
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-600 text-xs">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword && (
              <p className="text-green-600 text-xs flex items-center gap-1">
                <CheckCircle2 size={14} />
                Passwords match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || passwordErrors.length > 0 || !newPassword || !confirmPassword}
            className="w-full bg-white text-gray-900 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {isLoading ? 'Updating Password...' : 'Set New Password'}
          </button>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Use a strong password with uppercase, lowercase, numbers, and symbols
          </p>
        </form>

        {/* Footer Links */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <Link to="/" className="text-xs text-gray-500 hover:text-black transition">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;
