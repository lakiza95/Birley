/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import Layout from './components/Layout';
import { motion } from 'motion/react';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/dashboard/UserManagement';
import StudentsList from './components/dashboard/StudentsList';
import StudentDetail from './components/dashboard/StudentDetail';
import ApplicationsList from './components/dashboard/ApplicationsList';
import Catalog from './components/dashboard/Catalog';
import InstitutionsList from './components/dashboard/InstitutionsList';
import ProgramsList from './components/dashboard/ProgramsList';
import UniversityCard from './components/dashboard/UniversityCard';
import SystemSettings from './components/dashboard/SystemSettings';
import ProfileSettings from './components/dashboard/ProfileSettings';
import Inbox from './components/dashboard/Inbox';
import Payouts from './components/dashboard/Payouts';
import AdminPayouts from './components/dashboard/AdminPayouts';
import HelpCenter from './components/dashboard/HelpCenter';
import VerificationRequests from './components/dashboard/VerificationRequests';
import RecruiterVerification from './components/dashboard/RecruiterVerification';
import OnboardingModal from './components/dashboard/OnboardingModal';
import ReferralProgram from './components/dashboard/ReferralProgram';
import { UserProfile } from './types';
import { TimezoneProvider } from './context/TimezoneContext';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [tempUser, setTempUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [selectedProgramForCard, setSelectedProgramForCard] = useState<any | null>(null);
  const [selectedInstitutionForCard, setSelectedInstitutionForCard] = useState<any | null>(null);

  // Financial State
  const [balance, setBalance] = useState(0); 
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role === 'partner') {
      fetchWithdrawals();
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedWithdrawals = (data || []).map(w => ({
        id: `WD-${w.id.slice(0, 4).toUpperCase()}`,
        amount: w.amount,
        method: w.method,
        status: w.status,
        date: new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }));
      
      setWithdrawals(mappedWithdrawals);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const handleWithdraw = async (amount: number, method: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const methodLabel = method === 'bank_transfer' ? 'Bank Transfer' : method === 'paypal' ? 'PayPal' : 'Crypto Wallet';

      // Try secure RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('request_withdrawal', {
        p_amount: amount,
        p_method: methodLabel
      });

      if (!rpcError && rpcData?.success) {
        // RPC succeeded
        const newWithdrawal = {
          id: `WD-${rpcData.withdrawal_id.slice(0, 4).toUpperCase()}`,
          amount: amount,
          method: methodLabel,
          status: 'pending',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        setWithdrawals([newWithdrawal, ...withdrawals]);
        setBalance(rpcData.new_balance);
        return;
      }

      // Fallback if RPC doesn't exist (e.g., migration not run)
      console.warn('Secure RPC failed or not found, falling back to client-side update', rpcError);
      
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([{
          user_id: authUser.id,
          amount,
          method: methodLabel,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      const newWithdrawal = {
        id: `WD-${data.id.slice(0, 4).toUpperCase()}`,
        amount: data.amount,
        method: data.method,
        status: data.status,
        date: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      setWithdrawals([newWithdrawal, ...withdrawals]);
      setBalance(prev => prev - amount);
      
      // Update balance in profiles table
      if (user) {
        await supabase
          .from('profiles')
          .update({ balance: balance - amount })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Error creating withdrawal:', err);
      alert('Failed to process withdrawal. Please try again.');
    }
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setSessionUser(updatedUser);
  };

  // Use refs to access latest state in auth listener without re-subscribing
  const authViewRef = React.useRef(authView);
  const tempUserRef = React.useRef(tempUser);

  React.useEffect(() => {
    authViewRef.current = authView;
  }, [authView]);

  React.useEffect(() => {
    tempUserRef.current = tempUser;
  }, [tempUser]);

  const fetchProfile = async (userId: string) => {
    try {
      // Use RPC to fetch profile safely (handles both recruiters and institutions, bypasses RLS issues)
      const { data, error } = await supabase.rpc('get_my_profile');
      
      if (!error && data) {
        return data;
      }
      
      if (error) {
        console.error('Error fetching profile via RPC:', error);
      }
      
      return null;
    } catch (err) {
      console.error('Exception fetching profile:', err);
      return null;
    }
  };

  const clean = (val: any) => (val === 'undefined' || val === 'null' || !val) ? '' : val;

  const refreshProfile = async () => {
    const currentId = sessionUser?.id || tempUser?.id;
    if (currentId) {
      const profile = await fetchProfile(currentId);
      if (profile) {
        const sUser = sessionUser || tempUser;
        const mergedProfile = {
          ...profile,
          firstName: clean(profile.firstName || profile.first_name || sUser?.user_metadata?.first_name || sUser?.user_metadata?.firstName),
          lastName: clean(profile.lastName || profile.last_name || sUser?.user_metadata?.last_name || sUser?.user_metadata?.lastName),
          balance: profile.balance ? Number(profile.balance) : 0,
          onboarding_completed: profile.onboarding_completed,
          studentsPerYear: profile.students_per_year || profile.studentsPerYear,
          region: profile.region,
          institution_id: profile.institution_id,
          referred_by_institution_id: sUser?.user_metadata?.referred_by_institution_id || profile.referred_by_institution_id,
        };
        setUser(mergedProfile);
        if (mergedProfile.balance !== undefined) {
          setBalance(mergedProfile.balance);
        }
      }
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const handleAuthState = async (session: any, event?: string) => {
      const currentAuthView = authViewRef.current;
      const currentTempUser = tempUserRef.current;
      
      const userId = session?.user?.id;
      const userEmail = session?.user?.email;
      
      console.log(`[Auth] Event: ${event || 'INITIAL'}, View: ${currentAuthView}, UserID: ${userId || 'none'}, Email: ${userEmail || 'none'}`);
      
      try {
        const sUser = session?.user || null;
        setSessionUser(sUser);

        if (sUser) {
          console.log(`[Auth] Session found for ${sUser.email}, fetching profile...`);
          const profile = await fetchProfile(sUser.id);
          
          if (!isMounted) return;

          if (profile) {
            console.log(`[Auth] Profile found for ${sUser.email}: role=${profile.role}, status=${profile.status}, instId=${profile.institution_id}`);
            
            const mergedProfile = {
              ...profile,
              email: profile.email || sUser.email,
              firstName: clean(profile.firstName || profile.first_name || sUser.user_metadata?.first_name || sUser.user_metadata?.firstName),
              lastName: clean(profile.lastName || profile.last_name || sUser.user_metadata?.last_name || sUser.user_metadata?.lastName),
              onboarding_completed: profile.onboarding_completed,
              studentsPerYear: profile.students_per_year || profile.studentsPerYear,
              region: profile.region,
              institution_id: profile.institution_id,
              referred_by_institution_id: sUser.user_metadata?.referred_by_institution_id || profile.referred_by_institution_id,
            };
            
            setUser(mergedProfile);
            setLoading(false);

            // Handle pending referral from localStorage (for OAuth signups)
            const pendingRef = localStorage.getItem('pending_referral');
            if (pendingRef && mergedProfile.role === 'partner' && !mergedProfile.referred_by_institution_id) {
              console.log('[Auth] Applying pending referral for recruiter:', pendingRef);
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ referred_by_institution_id: pendingRef })
                .eq('id', sUser.id);
              
              if (!updateError) {
                localStorage.removeItem('pending_referral');
                // Refresh profile to reflect the change
                refreshProfile();
              } else {
                console.error('[Auth] Error applying pending referral:', updateError);
              }
            }
          } else {
            console.warn(`[Auth] No profile found for ${sUser.email} after retries`);
            
            if (sUser.email) {
              console.log(`[Auth] Attempting fallback profile creation for ${sUser.email}...`);
              const { error: fallbackError } = await supabase.rpc('create_profile_if_missing', {
                user_id: sUser.id,
                user_email: sUser.email,
                user_metadata: sUser.user_metadata || {}
              });
              
              if (!fallbackError) {
                console.log('[Auth] Fallback profile creation successful, retrying fetch...');
                const retryProfile = await fetchProfile(sUser.id);
                if (retryProfile && isMounted) {
                  const mergedProfile = {
                    ...retryProfile,
                    firstName: clean(retryProfile.firstName || retryProfile.first_name || sUser.user_metadata?.first_name || sUser.user_metadata?.firstName),
                    lastName: clean(retryProfile.lastName || retryProfile.last_name || sUser.user_metadata?.last_name || sUser.user_metadata?.lastName),
                    onboarding_completed: retryProfile.onboarding_completed,
                    studentsPerYear: retryProfile.students_per_year || retryProfile.studentsPerYear,
                    region: retryProfile.region,
                    referred_by_institution_id: sUser.user_metadata?.referred_by_institution_id,
                  };
                  setUser(mergedProfile);
                  setLoading(false);
                  return;
                }
              } else {
                console.error('[Auth] Fallback profile creation failed:', fallbackError);
              }
            }

            if (currentAuthView !== 'register') {
              console.log('[Auth] Redirecting to register because no profile found and not in register view');
              setAuthView('register');
            }
            setLoading(false);
          }
        } else {
          console.log('[Auth] No session user, clearing state');
          setUser(null);
          if (currentAuthView !== 'register' && !currentTempUser) {
            console.log('[Auth] Redirecting to login');
            setAuthView('login');
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Handler error:', err);
        setLoading(false);
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) handleAuthState(session, 'INITIAL_SESSION');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) handleAuthState(session, event);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to prevent re-subscribing on every view change

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSessionUser(null);
    setAuthView('login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user!} setActiveTab={setActiveTab} balance={balance} />;
      case 'users':
        return <UserManagement />;
      case 'students':
        return <StudentsList user={user!} setActiveTab={setActiveTab} setSelectedStudentId={setSelectedStudentId} setIsEditingStudent={setIsEditingStudent} />;
      case 'student-detail':
        return (
          <StudentDetail 
            studentId={selectedStudentId!} 
            user={user!} 
            onBack={() => setActiveTab(user!.role === 'institution' ? 'applications' : 'students')} 
            initialEditMode={isEditingStudent} 
          />
        );
      case 'applications':
        return <ApplicationsList user={user!} setActiveTab={setActiveTab} setSelectedStudentId={setSelectedStudentId} selectedApplicationId={selectedApplicationId} setSelectedApplicationId={setSelectedApplicationId} setSelectedChatId={setSelectedChatId} />;
      case 'catalog':
        return <Catalog user={user!} />;
      case 'institutions':
        return <InstitutionsList user={user!} />;
      case 'verification':
        return user?.role === 'admin' ? <VerificationRequests user={user!} /> : <RecruiterVerification user={user!} onRefreshProfile={refreshProfile} />;
      case 'programs':
        if (selectedProgramForCard && selectedInstitutionForCard) {
          return (
            <UniversityCard 
              school={selectedInstitutionForCard}
              user={user!}
              onClose={() => {
                setSelectedProgramForCard(null);
                setSelectedInstitutionForCard(null);
              }}
              initialSelectedProgramId={selectedProgramForCard.id}
            />
          );
        }
        return (
          <ProgramsList 
            user={user!} 
            onProgramSelect={(prog) => {
              const institution = Array.isArray(prog.institutions) ? prog.institutions[0] : prog.institutions;
              console.log('DEBUG: Program selected:', prog.id, 'Institution:', institution?.id);
              if (!institution) {
                alert('Error: This program is not linked to any institution or institution data is missing.');
                return;
              }
              setSelectedProgramForCard(prog);
              setSelectedInstitutionForCard(institution);
            }} 
          />
        );
      case 'settings':
        return <SystemSettings user={user!} />;
      case 'profile':
        return <ProfileSettings user={user!} onUpdate={handleProfileUpdate} />;
      case 'payouts':
        return user?.role === 'admin' ? <AdminPayouts /> : <Payouts balance={balance} withdrawals={withdrawals} onWithdraw={handleWithdraw} />;
      case 'inbox':
        return <Inbox user={user!} setActiveTab={setActiveTab} setSelectedStudentId={setSelectedStudentId} setSelectedApplicationId={setSelectedApplicationId} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId} />;
      case 'referrals':
        return <ReferralProgram user={user!} />;
      case 'help-center':
        return <HelpCenter user={user!} />;
      default:
        return <Dashboard user={user!} setActiveTab={setActiveTab} balance={balance} />;
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md bg-white p-12 rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-gray-100"
        >
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mx-auto mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Configuration Required</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Please add your Supabase credentials to the environment variables in the <b>Settings</b> menu to start using the application.
          </p>
          <div className="space-y-4 text-left bg-gray-50 p-6 rounded-2xl border border-gray-100 font-mono text-xs">
            <p className="text-gray-400"># Required variables:</p>
            <p className="text-indigo-600">VITE_SUPABASE_URL=...</p>
            <p className="text-indigo-600">VITE_SUPABASE_ANON_KEY=...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#4338CA]/20 border-t-[#4338CA] rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is logged in, show dashboard
  if (user) {
    const showOnboarding = user.role === 'partner' && !user.onboarding_completed;

    return (
      <TimezoneProvider timezone={user.timezone || 'UTC'}>
        <Layout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user}
          onRefreshProfile={refreshProfile}
        >
          <div className="space-y-6">
            {renderTabContent()}
          </div>
          {showOnboarding && (
            <OnboardingModal 
              user={user} 
              onComplete={(updatedUser) => {
                setUser(updatedUser);
                setSessionUser(updatedUser);
              }} 
            />
          )}
        </Layout>
      </TimezoneProvider>
    );
  }

  // Auth Views
  switch (authView) {
    case 'register':
      return <Register onRegister={(newUser) => { setTempUser(newUser); refreshProfile(); }} onNavigateToLogin={() => setAuthView('login')} />;
    default:
      return <Login 
        onLogin={() => {}} 
        onNavigateToRegister={() => setAuthView('register')} 
      />;
  }
};

export default App;


