import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';
import { supabase } from '../../supabase';
import { TransactionLedger } from './TransactionLedger';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  XCircle,
  Building2,
  GraduationCap,
  Inbox,
  CreditCard,
  Plus,
  RefreshCw,
  X,
  Mail,
  Globe
} from 'lucide-react';
import { getRoleTheme } from '../../utils/theme';

interface DashboardProps {
  user: UserProfile;
  setActiveTab: (tab: string) => void;
  balance?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setActiveTab, balance = 0 }) => {
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<any | null>(null);

  const clean = (val: any) => (val === 'undefined' || val === 'null' || !val) ? '' : val;

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    console.log('DEBUG: fetchDashboardData started for role:', user.role);
    try {
      if (user.role === 'admin') {
        await fetchAdminStats();
      } else if (user.role === 'institution') {
        await fetchInstitutionData();
        await fetchTransactions();
      } else if (user.role === 'partner') {
        await fetchPartnerStats();
        await fetchTransactions();
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const fetchAdminStats = async () => {
    console.log('DEBUG: fetchAdminStats started');
    const [partners, pending, institutions, applications, recentPartners, pendingInsts] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'partner'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).in('status', ['pending', 'UNDER_REVIEW', 'PROFILE_COMPLETED']),
      supabase.from('institutions').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('*').eq('role', 'partner').eq('status', 'pending').order('created_at', { ascending: false }).limit(3),
      supabase.from('institutions').select('*', { count: 'exact' }).eq('status', 'Pending').order('created_at', { ascending: false }).limit(5)
    ]);

    setStats({
      totalPartners: partners.count || 0,
      pendingReviews: (pending.count || 0) + (pendingInsts.count || 0),
      activeInstitutions: institutions.count || 0,
      totalApplications: applications.count || 0
    });
    setRecentActivity(recentPartners.data || []);
    
    // Combine pending partners and institutions for the queue
    const queue = [
      ...(pendingInsts.data || []).map(i => ({ ...i, type: 'institution' })),
      ...(recentPartners.data || []).map(p => ({ ...p, type: 'partner' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setVerificationQueue(queue);
    console.log('DEBUG: fetchAdminStats finished', { totalPartners: partners.count, pendingReviews: pending.count });
  };

  const fetchInstitutionData = async () => {
    const userEmail = user.email.toLowerCase();
    console.log('DEBUG: fetchInstitutionData for email:', userEmail);
    const { data: instData } = await supabase
      .from('institutions')
      .select('id, name')
      .eq('contact_email', userEmail)
      .maybeSingle();
    
    if (instData) {
      console.log('DEBUG: Found institution:', instData.name, instData.id);
      const { data: programsData } = await supabase
        .from('programs')
        .select('id')
        .eq('institution_id', instData.id);
      
      const programIds = (programsData || []).map(p => p.id);
      console.log('DEBUG: Found programs count:', programIds.length);
      
      if (programIds.length > 0) {
        const [recentApps, newApps, totalApps, acceptedApps] = await Promise.all([
          supabase
            .from('applications')
            .select(`
              *,
              students (name),
              programs (name, institution_id),
              recruiter:profiles!recruiter_id (id, first_name, last_name, email, agency, country, city, phone, whatsapp, bio, is_verified)
            `)
            .in('program_id', programIds)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('applications').select('id', { count: 'exact', head: true }).in('program_id', programIds).eq('status', 'Pending'),
          supabase.from('applications').select('id', { count: 'exact', head: true }).in('program_id', programIds),
          supabase.from('applications').select('id', { count: 'exact', head: true }).in('program_id', programIds).eq('status', 'Accepted')
        ]);

        setRecentApplications(recentApps.data || []);
        setStats({
          newApplications: newApps.count || 0,
          activePrograms: programIds.length,
          enrollmentRate: totalApps.count ? Math.round(((acceptedApps.count || 0) / totalApps.count) * 100) : 0
        });
        console.log('DEBUG: Institution stats updated', { newApps: newApps.count, totalApps: totalApps.count });
      } else {
        setRecentApplications([]);
        setStats({
          newApplications: 0,
          activePrograms: 0,
          enrollmentRate: 0
        });
      }
    } else {
      console.warn('DEBUG: No institution found for email:', userEmail);
    }
  };

  const fetchPartnerStats = async () => {
    console.log('DEBUG: fetchPartnerStats for user:', user.id);
    const [students, applications, successful, recentStudents] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('recruiter_id', user.id),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('recruiter_id', user.id),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('recruiter_id', user.id).eq('status', 'Accepted'),
      supabase.from('students').select('*').eq('recruiter_id', user.id).order('created_at', { ascending: false }).limit(3)
    ]);

    setStats({
      myStudents: students.count || 0,
      activeApps: applications.count || 0,
      successful: successful.count || 0
    });
    setRecentActivity(recentStudents.data || []);
    console.log('DEBUG: fetchPartnerStats finished', { students: students.count, apps: applications.count });
  };

  if (user.role === 'admin') {
    return (
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Admin Control Center</h1>
            <p className="text-sm text-gray-500 font-medium">System overview and management dashboard.</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-600 shadow-apple shadow-apple-hover disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard 
            title="Total Partners" 
            value={stats.totalPartners || 0} 
            icon={Users} 
            trend="+12%" 
            color="brand" 
            onClick={() => setActiveTab('users')}
          />
          <StatCard 
            title="Pending Reviews" 
            value={stats.pendingReviews || 0} 
            icon={Clock} 
            trend="High Priority" 
            color="amber" 
            onClick={() => setActiveTab('verification')}
          />
          <StatCard 
            title="Active Institutions" 
            value={stats.activeInstitutions || 0} 
            icon={Building2} 
            trend="+3 this week" 
            color="emerald" 
            onClick={() => setActiveTab('institutions')}
          />
          <StatCard 
            title="Total Applications" 
            value={stats.totalApplications || 0} 
            icon={FileText} 
            trend="+18%" 
            color="blue" 
            onClick={() => setActiveTab('applications')}
          />
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-apple shadow-apple-hover relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center border border-purple-100/50 shadow-sm">
                <CreditCard size={24} />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter mb-1">${balance.toLocaleString('en-US')}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">System Balance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-apple">
            <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Recent Partner Applications</h3>
            <div className="space-y-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400 py-12 text-center font-medium italic">No partner applications to review.</p>
              ) : recentActivity.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between p-5 hover:bg-gray-50 rounded-[24px] transition-all group border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center font-black text-indigo-500 shadow-sm group-hover:scale-105 transition-transform">
                      {(clean(partner.first_name)?.[0] || '') + (clean(partner.last_name)?.[0] || '')}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 leading-tight">{clean(partner.first_name)} {clean(partner.last_name)}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{partner.country || 'Unknown'} • {new Date(partner.created_at).toLocaleDateString('en-US')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('verification')}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-apple">
            <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Verification Queue</h3>
            <div className="space-y-4">
              {verificationQueue.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100/50">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-sm text-gray-400 font-medium italic">All caught up!</p>
                </div>
              ) : (
                verificationQueue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-[24px] transition-all group border border-gray-50/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${item.type === 'institution' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform`}>
                        {item.type === 'institution' ? <Building2 size={24} /> : (clean(item.first_name)?.[0] || item.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-tight">
                          {item.type === 'institution' ? item.name : `${clean(item.first_name)} ${clean(item.last_name)}`}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                          {item.type === 'institution' ? 'Institution' : 'Recruiter'} • {new Date(item.created_at).toLocaleDateString('en-US')}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab(item.type === 'institution' ? 'institutions' : 'verification')}
                      className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'institution') {
    return (
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Institution Portal</h1>
            <p className="text-sm text-gray-500 font-medium">Manage your programs and incoming applications.</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-600 shadow-apple shadow-apple-hover disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="New Applications" value={stats.newApplications || 0} icon={Inbox} trend="Action Required" color="brand" />
          <StatCard title="Active Programs" value={stats.activePrograms || 0} icon={GraduationCap} color="emerald" />
          <StatCard title="Enrollment Rate" value={`${stats.enrollmentRate || 0}%`} icon={TrendingUp} trend="+5%" color="blue" />
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-apple shadow-apple-hover relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100/50 shadow-sm">
                <CreditCard size={24} />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter mb-1">${balance.toLocaleString('en-US')}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Available Balance</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Recent Applications</h3>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border-y border-gray-200 -mx-8 px-8 shadow-inner">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-4 font-bold">Student</th>
                  <th className="py-4 font-bold">Program</th>
                  <th className="py-4 font-bold">Recruiter</th>
                  <th className="py-4 font-bold">Status</th>
                  <th className="py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading applications...</td></tr>
                ) : recentApplications.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500">No recent applications found.</td></tr>
                ) : recentApplications.map((app) => {
                  let studentName = 'Unknown';
                  if (app.students) {
                    if (Array.isArray(app.students)) {
                      studentName = app.students[0]?.name || `${app.students[0]?.firstname || ''} ${app.students[0]?.lastname || ''}`.trim() || 'Unknown';
                    } else {
                      studentName = app.students.name || `${app.students.firstname || ''} ${app.students.lastname || ''}`.trim() || 'Unknown';
                    }
                  }
                  
                  return (
                  <tr key={app.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-900 font-bold text-xs uppercase">
                          {studentName.substring(0, 2) || 'NA'}
                        </div>
                        <span className="text-sm font-bold">{studentName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600 truncate max-w-[200px]">{app.programs?.name || 'Unknown'}</td>
                    <td className="py-4">
                      {app.recruiter ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedRecruiter(app.recruiter); }}
                          className="flex items-center gap-2 hover:text-[#4338CA] transition-colors group/rec text-left"
                        >
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4338CA] font-bold text-[9px] group-hover/rec:bg-indigo-100">
                            {`${app.recruiter.first_name || ''} ${app.recruiter.last_name || ''}`.trim().split(' ').map((n: string) => n[0]).join('') || 'R'}
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-bold leading-tight text-gray-900 group-hover/rec:text-[#4338CA]">{`${app.recruiter.first_name || ''} ${app.recruiter.last_name || ''}`.trim() || 'Unknown'}</p>
                            <p className="text-[9px] text-gray-400 font-medium">{app.recruiter.agency || 'Independent'}</p>
                          </div>
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'Accepted' ? 'bg-green-50 text-green-600' :
                        app.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                        app.status === 'Action Required' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => setActiveTab('applications')}
                        className="text-xs font-bold text-emerald-900 hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recruiter Details Modal */}
        <AnimatePresence>
          {selectedRecruiter && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4338CA] font-bold text-lg">
                      {`${selectedRecruiter.first_name || ''} ${selectedRecruiter.last_name || ''}`.trim().split(' ').map((n: string) => n[0]).join('') || 'R'}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{`${selectedRecruiter.first_name || ''} ${selectedRecruiter.last_name || ''}`.trim() || 'Unknown'}</h2>
                      <p className="text-xs text-gray-500">{selectedRecruiter.agency || 'Independent Recruiter'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedRecruiter(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Email</p>
                      <p className="text-xs font-medium text-gray-900 truncate">{selectedRecruiter.email}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Location</p>
                      <p className="text-xs font-medium text-gray-900">{selectedRecruiter.city || '—'}, {selectedRecruiter.country || '—'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Phone</p>
                      <p className="text-xs font-medium text-gray-900">{selectedRecruiter.phone || '—'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">WhatsApp</p>
                      <p className="text-xs font-medium text-gray-900">{selectedRecruiter.whatsapp || '—'}</p>
                    </div>
                  </div>

                  {selectedRecruiter.bio && (
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">About</p>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                        {selectedRecruiter.bio}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const displayName = clean(user.firstName) || 'User';

  // Default: Partner Dashboard
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Partner Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">Welcome back, {displayName}! Here's your recruitment overview.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-600 shadow-apple shadow-apple-hover disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Students" value={stats.myStudents || 0} icon={Users} trend="+3 this month" color="brand" />
        <StatCard title="Active Applications" value={stats.activeApps || 0} icon={FileText} trend="5 need attention" color="blue" />
        <StatCard title="Successful" value={stats.successful || 0} icon={CheckCircle2} trend="+2 this week" color="emerald" />
        
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-apple shadow-apple-hover relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100/50 shadow-sm">
              <CreditCard size={24} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tighter mb-1">${balance.toLocaleString('en-US')}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Available Balance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Recent Student Activity</h3>
            <button 
              onClick={() => setActiveTab('students')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No recent student activity.</p>
            ) : recentActivity.map((student) => (
              <ActivityItem 
                key={student.id}
                name={student.name} 
                action={`Added from ${student.country}`} 
                time={new Date(student.created_at).toLocaleDateString('en-US')} 
                status="info" 
              />
            ))}
          </div>
        </div>

        <div className="bg-brand text-white p-8 rounded-[40px] relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Recruitment Goal</h3>
            <p className="text-white/70 text-sm mb-8">You've completed {Math.min(100, Math.round((stats.myStudents / 20) * 100))}% of your quarterly target.</p>
            
            <div className="mb-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>{stats.myStudents} / 20 Students</span>
                <span>{Math.min(100, Math.round((stats.myStudents / 20) * 100))}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, (stats.myStudents / 20) * 100)}%` }}></div>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('students')}
              className="w-full bg-white text-brand py-4 rounded-2xl font-bold text-sm hover:bg-opacity-90 transition-all"
            >
              Add Student
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        {(user.role === 'partner' || user.role === 'institution') && (
          <div className="lg:col-span-3">
            <TransactionLedger transactions={transactions} />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: any) => {
  const colorMap: any = {
    brand: 'bg-blue-50 text-blue-500 border-blue-100/50',
    indigo: 'bg-indigo-50 text-indigo-500 border-indigo-100/50',
    emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100/50',
    blue: 'bg-blue-50 text-blue-500 border-blue-100/50',
    amber: 'bg-amber-50 text-amber-500 border-amber-100/50',
    purple: 'bg-purple-50 text-purple-500 border-purple-100/50',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-[32px] border border-gray-100 shadow-apple shadow-apple-hover ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 ${colorMap[color]} rounded-2xl flex items-center justify-center border shadow-sm`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-gray-900 tracking-tighter mb-1">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{title}</p>
    </div>
  );
};

const ActivityItem = ({ name, action, time, status }: any) => {
  const statusColors: any = {
    success: 'bg-emerald-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  const clean = (val: any) => (val === 'undefined' || val === 'null' || !val) ? '' : val;
  const cleanName = clean(name);

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 text-xs shadow-sm group-hover:scale-105 transition-transform">
            {cleanName.split(' ').map((n: any) => n[0]).join('') || '?'}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${statusColors[status]} border-2 border-white rounded-full shadow-sm`}></div>
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 leading-tight">{cleanName || 'Unknown'}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{action}</p>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{time}</span>
    </div>
  );
};

const AlertItem = ({ title, time, type }: any) => {
  const colors: any = {
    warning: 'text-amber-500 bg-amber-50 border-amber-100/50',
    info: 'text-blue-500 bg-blue-50 border-blue-100/50',
    success: 'text-emerald-500 bg-emerald-50 border-emerald-100/50',
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${colors[type]}`}>
        <AlertCircle size={18} />
      </div>
      <div>
        <p className="text-sm font-black text-gray-900 leading-tight group-hover:text-gray-600 transition-colors">{title}</p>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{time}</p>
      </div>
    </div>
  );
};

export default Dashboard;
