import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';
import { supabase } from '../../supabase';
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
      } else if (user.role === 'partner') {
        await fetchPartnerStats();
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    console.log('DEBUG: fetchAdminStats started');
    const [partners, pending, institutions, applications, recentPartners] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'partner'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('institutions').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('*').eq('role', 'partner').eq('status', 'pending').order('created_at', { ascending: false }).limit(3)
    ]);

    setStats({
      totalPartners: partners.count || 0,
      pendingReviews: pending.count || 0,
      activeInstitutions: institutions.count || 0,
      totalApplications: applications.count || 0
    });
    setRecentActivity(recentPartners.data || []);
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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
            <p className="text-gray-500">System overview and management dashboard.</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
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
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <CreditCard size={24} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mb-1">${balance.toLocaleString('en-US')}</p>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">System Balance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Recent Partner Applications</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No partner applications to review.</p>
              ) : recentActivity.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                      {(clean(partner.first_name)?.[0] || '') + (clean(partner.last_name)?.[0] || '')}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{clean(partner.first_name)} {clean(partner.last_name)}</p>
                      <p className="text-xs text-gray-500">{partner.country || 'Unknown'} • {new Date(partner.created_at).toLocaleDateString('en-US')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('verification')}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">System Alerts</h3>
            <div className="space-y-4">
              <AlertItem title="High Server Load" time="10m ago" type="warning" />
              <AlertItem title="New Institution Request" time="45m ago" type="info" />
              <AlertItem title="Database Backup Complete" time="2h ago" type="success" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'institution') {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-gray-900">Institution Portal</h1>
            <p className="text-gray-500">Manage your programs and incoming applications.</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="New Applications" value={stats.newApplications || 0} icon={Inbox} trend="Action Required" color="brand" />
          <StatCard title="Active Programs" value={stats.activePrograms || 0} icon={GraduationCap} color="emerald" />
          <StatCard title="Enrollment Rate" value={`${stats.enrollmentRate || 0}%`} icon={TrendingUp} trend="+5%" color="blue" />
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <CreditCard size={24} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mb-1">${balance.toLocaleString('en-US')}</p>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Available Balance</p>
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
          <p className="text-gray-500">Welcome back, {displayName}! Here's your recruitment overview.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Students" value={stats.myStudents || 0} icon={Users} trend="+3 this month" color="brand" />
        <StatCard title="Active Applications" value={stats.activeApps || 0} icon={FileText} trend="5 need attention" color="blue" />
        <StatCard title="Successful" value={stats.successful || 0} icon={CheckCircle2} trend="+2 this week" color="emerald" />
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <CreditCard size={24} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mb-1">${balance.toLocaleString('en-US')}</p>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Available Balance</p>
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
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: any) => {
  const colorMap: any = {
    brand: 'bg-brand-light text-brand border border-brand/10',
    indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colorMap[color]} rounded-2xl flex items-center justify-center`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-gray-900 mb-1">{value}</p>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
    </div>
  );
};

const ActivityItem = ({ name, action, time, status }: any) => {
  const statusColors: any = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  const clean = (val: any) => (val === 'undefined' || val === 'null' || !val) ? '' : val;
  const cleanName = clean(name);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-400 text-xs">
            {cleanName.split(' ').map((n: any) => n[0]).join('') || '?'}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${statusColors[status]} border-2 border-white rounded-full`}></div>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{cleanName || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{action}</p>
        </div>
      </div>
      <span className="text-xs text-gray-400 font-medium">{time}</span>
    </div>
  );
};

const AlertItem = ({ title, time, type }: any) => {
  const colors: any = {
    warning: 'text-amber-600 bg-amber-50',
    info: 'text-blue-600 bg-blue-50',
    success: 'text-green-600 bg-green-50',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[type]}`}>
        <AlertCircle size={16} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-[10px] text-gray-400 font-medium">{time}</p>
      </div>
    </div>
  );
};

export default Dashboard;
