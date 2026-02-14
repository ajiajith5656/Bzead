import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Globe, ChevronDown } from 'lucide-react';
import { detectDomain } from '../../utils/domain';

interface SignupProps {
  role?: 'user' | 'seller' | 'admin';
}

interface Country {
  id: string;
  countryName: string;
  shortCode: string;
  currency: string;
  dialCode?: string;
}

export const Signup: React.FC<SignupProps> = ({ role: roleProp }) => {
  const detectedDomain = detectDomain();
  const role = roleProp ?? (detectedDomain === 'seller' ? 'seller' : 'user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryId, setCountryId] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Load countries from Supabase
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('countries')
          .select('id, country_name, short_code, currency_code, dialing_code')
          .eq('is_active', true)
          .order('country_name');

        if (fetchErr || !data || data.length === 0) {
          setError('Unable to load countries. Please try again later.');
          return;
        }

        const mapped: Country[] = data.map((c: any) => ({
          id: c.id,
          countryName: c.country_name,
          shortCode: c.short_code,
          currency: c.currency_code,
          dialCode: c.dialing_code,
        }));
        setCountries(mapped);
        const india = mapped.find(c => c.shortCode === 'IN');
        setCountryId(india?.id || mapped[0].id);
      } catch (err) {
        console.error('Error loading countries:', err);
        setError('Unable to load countries. Please try again later.');
      }
    };
    loadCountries();
  }, []);

  const selectedCountry = countries.find((c) => c.id === countryId);

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

  const validateFullName = (name: string): string => {
    if (!name || name.length === 0) {
      return 'Full name is required';
    }
    if (!/^[A-Z]/.test(name)) {
      return 'First letter must be capital';
    }
    return '';
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      setPasswordErrors(validatePassword(value));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    setError('');
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate full name
    const nameError = validateFullName(fullName);
    if (nameError) {
      setError(nameError);
      return;
    }

    // Validate password
    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      setPasswordErrors(pwErrors);
      return;
    }

    if (!countryId) {
      setError('Please select a country');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, role, fullName, selectedCountry?.currency, undefined, countryId);

      if (result.success) {
        // Store email & country_id for use after OTP verification
        // (can't update profile yet — no active session until OTP is confirmed)
        sessionStorage.setItem('signupEmail', email);
        if (countryId) {
          sessionStorage.setItem('signupCountryId', countryId);
        }
        sessionStorage.setItem(
          'otpContext',
          JSON.stringify({ email, purpose: role === 'seller' ? 'seller-signup' : 'signup', role })
        );
        setLoading(false);
        
        // Navigate to OTP page
        const otpPath = role === 'seller' ? '/seller/otp-verification' : '/otp-verification';
        navigate(otpPath, {
          state: {
            email,
            purpose: role === 'seller' ? 'seller-signup' : 'signup',
            role: role
          }
        });
      } else {
        setError(result.error?.message || 'Failed to sign up');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      setLoading(false);
    }
  };

  const getLoginLink = () => {
    if (role === 'seller') return '/seller/login';
    return '/login';
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
          <h1 className="text-2xl md:text-3xl font-semibold">Create your account</h1>
          <p className="text-gray-500 text-sm mt-2">Complete your details to continue.</p>
        </div>

        <form className="space-y-5" onSubmit={handleDetailsSubmit}>
            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <select
                    id="country"
                    value={countryId}
                    onChange={(e) => setCountryId(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm appearance-none bg-white"
                  >
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.countryName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                </div>
                {selectedCountry && (
                  <p className="mt-1 text-xs text-gray-500">
                    Currency: <span className="text-black font-semibold">{selectedCountry.currency}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm"
                    placeholder="First letter must be capital"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-black/10 ${
                      passwordErrors.length > 0 ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
                    }`}
                    placeholder="Min 8 chars, upper/lower, number, special char"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordErrors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-600 flex items-start gap-2">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || passwordErrors.length > 0 || !fullName || !email || !password || !countryId}
                className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to={getLoginLink()} className="font-semibold text-black hover:underline">
                Sign in
              </Link>
            </div>
          </form>
      </div>
    </div>
  );
};
