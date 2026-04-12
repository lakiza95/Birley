import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../supabase';

interface LoginProps {
  onLogin: () => void;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'set-password'>('email');
  const [userStatus, setUserStatus] = useState<'existing' | 'new_institution' | null>(null);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setError('');
    
    try {
      const emailLower = email.trim().toLowerCase();
      console.log(`[Login] Checking email: ${emailLower}`);
      
      // Use RPC to check user status safely (bypasses RLS recursion/visibility issues)
      const { data, error: rpcError } = await supabase.rpc('check_user_status', {
        email_input: emailLower
      });

      console.log('[Login] RPC check result:', { data, rpcError });

      if (rpcError) {
        console.error('[Login] RPC check error:', rpcError);
        // Fallback to old method if RPC fails for some reason
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', emailLower)
          .maybeSingle();
        
        if (profile) {
          setUserStatus('existing');
          setStep('password');
        } else {
          setError('Account not found. Please register first.');
        }
        return;
      }

      const result = data?.[0];
      if (!result || result.status === 'not_found') {
        console.log('[Login] No account found for this email');
        setError('Account not found. Please register first.');
      } else if (result.status === 'existing') {
        console.log(`[Login] Profile found: role=${result.user_role}`);
        setUserStatus('existing');
        setStep('password');
      } else if (result.status === 'new_institution') {
        console.log('[Login] Institution found, directing to set-password');
        setUserStatus('new_institution');
        setStep('set-password');
      }
    } catch (err: any) {
      console.error('Email check error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            role: 'institution'
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // Create profile immediately with EMAIL_VERIFIED status
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email.trim().toLowerCase(),
            role: 'institution',
            status: 'EMAIL_VERIFIED',
            full_name: '',
            phone: '',
            avatar_url: null
          });
          
        if (profileError) console.error('Error creating profile:', profileError);
      }

      setSuccessMessage('Account created! You can now sign in.');
      setStep('password'); // Go to password step to sign in
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Email not confirmed') {
        setError('Email not confirmed. Please disable "Confirm Email" in Supabase Auth settings or check your inbox.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) throw error;
      setSuccessMessage('Password reset link sent to your email');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleEmailCheck} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" 
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4338CA] text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        );

      case 'password':
        return (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-2xl mb-2">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[#4338CA] shadow-sm">
                <Mail size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Signing in as</p>
                <p className="text-xs font-bold text-gray-900 truncate">{email}</p>
              </div>
              <button 
                type="button"
                onClick={() => setStep('email')}
                className="text-[10px] font-bold text-[#4338CA] hover:underline"
              >
                Change
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-[#4338CA] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-red-500 text-xs font-medium">{error}</p>
                {error.includes('Invalid email or password') && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[#4338CA] text-xs font-bold hover:underline block"
                  >
                    Reset password now?
                  </button>
                )}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4338CA] text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        );

      case 'set-password':
        return (
          <form onSubmit={handleSetPassword} className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-4">
              <p className="text-xs font-bold text-emerald-800 mb-1">Welcome, University Representative!</p>
              <p className="text-[11px] text-emerald-600 leading-relaxed">
                Your university has been added to the system. Please set a password for your account to continue.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Create Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password" 
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password" 
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#4338CA] focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4338CA] text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-xl shadow-indigo-100/50 p-8 md:p-12 border border-gray-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-[#4338CA] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
            <div className="w-6 h-6 bg-white rounded-md transform rotate-45"></div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Birley</h1>
          <p className="text-gray-500 text-center">
            {step === 'email' ? 'Sign in to your recruiter cabinet' : 
             step === 'password' ? 'Welcome back!' : 'Set up your account'}
          </p>
        </div>

        {renderStep()}

        {step === 'email' && (
          <>
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
              Don't have an account?{' '}
              <button 
                onClick={onNavigateToRegister}
                className="text-[#4338CA] font-bold hover:underline"
              >
                Sign up
              </button>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
