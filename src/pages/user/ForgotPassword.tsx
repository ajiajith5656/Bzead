import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type ResetStep = 'email' | 'otp' | 'password' | 'success';

const ForgotPassword: React.FC = () => {
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
        sessionStorage.setItem('passwordResetEmail', email);
        sessionStorage.setItem('otpContext', JSON.stringify({ email, purpose: 'password-reset', role: 'user' }));
        setIsLoading(false);
        // Navigate to OTP verification page
        navigate('/otp-verification', {
          state: {
            email,
            purpose: 'password-reset',
            role: 'user'
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

    // Simulate resending OTP
    await new Promise((r) => setTimeout(r, 1000));

    setIsLoading(false);
    setResendTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-10 relative">
        <Link
          to="/"
          className="absolute top-4 left-4 text-xs font-semibold text-gray-500 hover:text-black"
        >
          Back to Home
        </Link>

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold">Reset Password</h1>
              <p className="text-gray-500 text-sm mt-2">Enter your email to receive reset code</p>
            </div>

            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                {error}
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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="inline animate-spin mr-2" size={18} /> : ''}
              Send Reset Code
            </button>

            <div className="text-center text-sm">
              <Link to="/login" className="text-gray-600 hover:text-black font-semibold">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold">Verify Code</h1>
              <p className="text-gray-500 text-sm mt-2">Enter the 6-digit code sent to {email}</p>
            </div>

            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-6 gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    if (el) otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-full py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-center text-2xl font-bold"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.join('').length < 6}
              className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="inline animate-spin mr-2" size={18} /> : ''}
              Verify Code
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || isLoading}
                className="text-xs font-semibold text-gray-600 hover:text-black disabled:text-gray-500"
              >
                {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError('');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="text-xs font-semibold text-gray-500 hover:text-black"
                >
                  Change Email
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold">Create New Password</h1>
              <p className="text-gray-500 text-sm mt-2">Enter your new password</p>
            </div>

            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="inline animate-spin mr-2" size={18} /> : ''}
              Reset Password
            </button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Password Reset Success!</h1>
              <p className="text-gray-500 text-sm mt-2">Your password has been reset successfully</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
