import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type ResetStep = 'email' | 'otp' | 'password' | 'success';

const SellerForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword, confirmPasswordReset } = useAuth();
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resend OTP
  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        sessionStorage.setItem('sellerPasswordResetEmail', email);
        sessionStorage.setItem('otpContext', JSON.stringify({ email, purpose: 'seller-password-reset', role: 'seller' }));
        setIsLoading(false);
        // Navigate to OTP verification page
        navigate('/seller/otp-verification', {
          state: {
            email,
            purpose: 'seller-password-reset',
            role: 'seller'
          }
        });
      } else {
        setError(result.error?.message || 'Failed to send reset code');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Just move to password step - actual verification happens on password reset
      setIsLoading(false);
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setIsLoading(false);
        setResendTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      } else {
        setError(result.error?.message || 'Failed to resend code');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password strength (uppercase, lowercase, numeric, special)
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumeric = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};:'\",.<>?/]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumeric || !hasSpecialChar) {
      setError('Password must contain uppercase, lowercase, numeric, and special characters.');
      return;
    }

    setIsLoading(true);

    try {
      const otpValue = otp.join('');
      if (otpValue.length < 6) {
        setError('Please verify the code first');
        setIsLoading(false);
        return;
      }

      const result = await confirmPasswordReset(email, otpValue, newPassword);
      if (result.success) {
        setIsLoading(false);
        setStep('success');
      } else {
        setError(result.error?.message || 'Failed to reset password');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/seller/login');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Email Step */}
        {step === 'email' && (
          <div className="bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-10">
            <Link
              to="/seller/login"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-sm font-medium mb-6"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>

            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold">Reset Your Password</h1>
              <p className="text-gray-500 text-sm mt-2">
                Enter your email address and we'll send you a verification code.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-5">
              {error && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@metricfluxsolutions.shop"
                    className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Verification Code'}
              </button>
            </form>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-10">
            <button
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-sm font-medium mb-6"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold">Verify Your Email</h1>
              <p className="text-gray-500 text-sm mt-2">
                Enter the 6-digit code sent to <span className="font-medium text-black">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {error && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      if (el) otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 bg-white border-2 border-gray-200 rounded-lg text-center text-xl font-semibold text-black focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length < 6}
                className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
              </button>

              <div className="text-center text-sm">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-black font-semibold hover:underline disabled:opacity-60"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span className="text-gray-500">
                    Resend code in <span className="font-semibold text-black">{resendTimer}s</span>
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Password Step */}
        {step === 'password' && (
          <div className="bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold">Create New Password</h1>
              <p className="text-gray-500 text-sm mt-2">
                Choose a strong password for your seller account.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {error && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold mb-3">Password Reset Successfully</h1>
            <p className="text-gray-500 text-sm mb-8">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>

            <button
              onClick={handleBackToLogin}
              className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Continue to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerForgotPassword;
