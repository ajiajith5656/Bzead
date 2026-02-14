import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Loader2, ChevronLeft, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../utils/domain';

const OTPVerification: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmSignUp } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isBrowser = typeof window !== 'undefined';
  const locationState = (location.state as { email?: string; purpose?: string; role?: string }) || {};

  const storedOtpContext = useMemo(() => {
    if (!isBrowser) return null;
    try {
      const raw = sessionStorage.getItem('otpContext');
      return raw ? JSON.parse(raw) as { email?: string; purpose?: string; role?: string } : null;
    } catch {
      return null;
    }
  }, [isBrowser]);

  const fallbackEmail = useMemo(() => {
    if (!isBrowser) return undefined;
    const isSellerPath = location.pathname.includes('/seller');
    const signupEmail = sessionStorage.getItem(isSellerPath ? 'sellerSignupEmail' : 'signupEmail') || undefined;
    const resetEmail = sessionStorage.getItem(isSellerPath ? 'sellerPasswordResetEmail' : 'passwordResetEmail') || undefined;
    return signupEmail || resetEmail;
  }, [isBrowser, location.pathname]);

  const purpose = locationState.purpose || storedOtpContext?.purpose || (location.pathname.includes('/seller') ? 'seller-signup' : undefined);
  const email = locationState.email || storedOtpContext?.email || fallbackEmail;
  const role = locationState.role || storedOtpContext?.role || (purpose?.includes('seller') ? 'seller' : 'user');

  // Persist context for refresh/back-nav resilience
  useEffect(() => {
    if (!isBrowser) return;
    if (email && purpose) {
      sessionStorage.setItem('otpContext', JSON.stringify({ email, purpose, role }));
    }
  }, [email, isBrowser, purpose, role]);

  // Guard: missing context — send user back to a safe auth entry point
  useEffect(() => {
    if (!email || !purpose) {
      const redirectPath = location.pathname.includes('/seller') ? '/seller/login' : '/login';
      navigate(redirectPath, {
        state: { message: 'Session expired. Please start again.' },
        replace: true,
      });
    }
  }, [email, navigate, purpose, location.pathname]);

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !purpose) {
      setError('Session expired. Please restart verification.');
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }

    setIsLoading(true);

    try {
      // Handle different purposes
      if (purpose === 'signup' || purpose === 'seller-signup') {
        // Confirm signup with the OTP code
        const result = await confirmSignUp(email, otpCode);
        
        if (result.success) {
          // Now user has a session — apply pending profile fields from signup
          const pendingCountryId = sessionStorage.getItem('signupCountryId');
          const pendingBusinessTypeId = sessionStorage.getItem('signupBusinessTypeId');

          if (pendingCountryId || pendingBusinessTypeId) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              const updates: Record<string, string> = {};
              if (pendingCountryId) updates.country_id = pendingCountryId;
              if (pendingBusinessTypeId && (purpose === 'seller-signup' || role === 'seller')) {
                updates.business_type_id = pendingBusinessTypeId;
              }

              if (Object.keys(updates).length > 0) {
                await supabase
                  .from('profiles')
                  .update(updates)
                  .eq('id', currentUser.id);
              }
            }

            sessionStorage.removeItem('signupCountryId');
            sessionStorage.removeItem('signupBusinessTypeId');
          }

          setShowSuccess(true);

          // Cleanup OTP context now that verification succeeded
          if (isBrowser) {
            sessionStorage.removeItem('otpContext');
          }
          
          setTimeout(() => {
            if (purpose === 'seller-signup' || role === 'seller') {
              // Seller signup - redirect to seller dashboard
              navigate('/seller/dashboard', { state: { loginSuccess: true } });
            } else {
              // User signup - redirect to home
              navigate('/', { state: { loginSuccess: true } });
            }
          }, 2000);
        } else if (result.alreadyConfirmed) {
          // User is already confirmed and signed in
          setError('This account is already verified. Redirecting to login...');
          setTimeout(() => {
            if (purpose === 'seller-signup' || role === 'seller') {
              navigate('/seller/login');
            } else {
              navigate('/login');
            }
          }, 2000);
        } else {
          setError(result.error?.message || 'Failed to verify OTP. Please try again.');
          setIsLoading(false);
        }
      } else if (purpose === 'password-reset' || purpose === 'seller-password-reset') {
        // Store OTP for password reset - navigate to new password page
        setShowSuccess(true);

        if (isBrowser) {
          sessionStorage.setItem('resetContext', JSON.stringify({ email, otpCode, role }));
          sessionStorage.removeItem('otpContext');
        }
        
        setTimeout(() => {
          const newPasswordPath = purpose === 'seller-password-reset' 
            ? '/seller/new-password' 
            : '/new-password';
            
          navigate(newPasswordPath, { 
            state: { 
              email, 
              otpCode,
              purpose: 'reset',
              role: purpose === 'seller-password-reset' ? 'seller' : 'user'
            }
          });
        }, 1500);
      } else {
        setError('Invalid verification purpose');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying OTP');
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    if (!email || !purpose) {
      setError('Session expired. Please restart verification.');
      return;
    }
    setError('');
    setResendTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);

    try {
      if (purpose === 'password-reset' || purpose === 'seller-password-reset') {
        // For recovery, Supabase recommends resetPasswordForEmail instead of resend
        const { error: resendError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getAuthRedirectUrl('/new-password'),
        });

        if (resendError) {
          throw new Error(resendError.message);
        }
      } else {
        const { error: resendError } = await supabase.auth.resend({
          email,
          type: 'signup',
        });

        if (resendError) {
          throw new Error(resendError.message);
        }
      }

      // Focus first input
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      {showSuccess ? (
        <div className="w-full max-w-md bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">Email Verified!</h1>
          <p className="text-gray-600 text-sm mb-4">Your account has been successfully created.</p>
          <p className="text-gray-500 text-xs">Redirecting to homepage...</p>
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
          </div>
        </div>
      ) : (
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
            <h1 className="text-2xl md:text-3xl font-semibold">Verify your email</h1>
            <p className="text-gray-500 text-sm mt-2">
              We've sent a 6-digit code to <span className="font-semibold text-black">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                Enter OTP Code
              </label>
              <div className="flex gap-2 md:gap-3 justify-between">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 md:w-14 md:h-14 text-center text-lg md:text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition bg-white"
                    placeholder="0"
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full bg-white text-gray-900 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Didn't receive the code?{' '}
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-black font-semibold hover:underline flex items-center justify-center gap-1 mx-auto mt-1"
                  >
                    <RotateCcw size={14} />
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-gray-500">Resend in {resendTimer}s</span>
                )}
              </p>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              The code will expire in 10 minutes
            </p>
          </form>

          {/* Footer Links */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <Link to="/" className="text-xs text-gray-500 hover:text-black transition">
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTPVerification;
