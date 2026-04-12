import React, { useState } from 'react';
import { User, Mail, Phone, Globe, Building2, Lock, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { supabase } from '../../supabase';

interface RegisterProps {
  onRegister: (user: any) => void;
  onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    agency: '',
    password: '',
    confirmPassword: '',
    role: 'partner' as 'partner',
    agreeToTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    if (refId) {
      console.log('Referral ID found in URL, storing in localStorage:', refId);
      localStorage.setItem('pending_referral', refId);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = 
    formData.firstName && 
    formData.lastName && 
    formData.email && 
    formData.phone && 
    formData.country && 
    (formData.password && formData.password === formData.confirmPassword) &&
    formData.agreeToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const finalRole = 'partner'; // Always register as a partner (recruiter)
      const urlParams = new URLSearchParams(window.location.search);
      const refId = urlParams.get('ref');

      console.log('Starting Supabase signUp...');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            country: formData.country,
            agency: formData.agency,
            role: finalRole,
            status: 'CREATED',
            referred_by_institution_id: refId || null,
          }
        }
      });

      if (signUpError) {
        console.error('Supabase signUp error:', signUpError);
        throw signUpError;
      }

      console.log('Supabase signUp successful:', data.user?.id);
      onRegister(data.user);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 p-8 md:p-12 border border-gray-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-[#4338CA] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
            <div className="w-6 h-6 bg-white rounded-md transform rotate-45"></div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Birley</h1>
          <p className="text-gray-500 text-center">Join Birley and start your journey in international education.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                First name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Enter your first name" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Last name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Enter your last name" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Phone number <span className="text-red-500">*</span>
              </label>
              <div className="relative group phone-input-container">
                <PhoneInput
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(value) => setFormData({...formData, phone: value || ''})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl focus-within:bg-white focus-within:border-[#4338CA] focus-within:ring-4 focus-within:ring-indigo-50 transition-all outline-none text-sm overflow-hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              Country <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
              <select 
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm appearance-none"
              >
                <option value="">Select your country</option>
                <option value="Portugal">Portugal</option>
                <option value="Spain">Spain</option>
                <option value="Brazil">Brazil</option>
                <option value="Angola">Angola</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ArrowRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Agency/Organization <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Your agency or organization name" 
                value={formData.agency}
                onChange={(e) => setFormData({...formData, agency: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2">
            <input 
              type="checkbox" 
              id="terms"
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
              className="mt-1 w-5 h-5 rounded-lg border-gray-300 text-[#4338CA] focus:ring-[#4338CA]"
            />
            <label htmlFor="terms" className="text-sm text-gray-500 leading-relaxed">
              I agree to the <button type="button" className="text-[#4338CA] font-bold hover:underline">Terms of Service</button> and <button type="button" className="text-[#4338CA] font-bold hover:underline">Privacy Policy</button>
            </label>
          </div>

          {error && (
            <div className="space-y-2 text-center">
              <p className="text-red-500 text-xs font-medium">{error}</p>
              {error.includes('already registered') && (
                <button 
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-[#4338CA] text-xs font-bold hover:underline block mx-auto"
                >
                  Sign in instead
                </button>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full bg-[#4338CA] text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:bg-indigo-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-white px-4 text-gray-400">or</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
        >
          <Chrome size={18} className="text-gray-600" />
          <span>Continue with Google</span>
        </button>

        <p className="mt-10 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button 
            onClick={onNavigateToLogin}
            className="text-[#4338CA] font-bold hover:underline"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
