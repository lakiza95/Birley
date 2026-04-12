import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  Building2, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  X,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import ApplicationCard from './ApplicationCard';
import ApplicationKanban from './ApplicationKanban';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabase';

import { UserProfile, ApplicationStatus } from '../../types';

interface ApplicationsListProps {
  user: UserProfile;
  setActiveTab?: (tab: string) => void;
  setSelectedStudentId?: (id: string) => void;
  selectedApplicationId?: string | null;
  setSelectedApplicationId?: (id: string | null) => void;
  setSelectedChatId?: (id: string | null) => void;
}

const ApplicationsList: React.FC<ApplicationsListProps> = ({ 
  user, 
  setActiveTab, 
  setSelectedStudentId,
  selectedApplicationId,
  setSelectedApplicationId,
  setSelectedChatId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecruiter, setSelectedRecruiter] = useState<any>(null);
  const [recruiterStats, setRecruiterStats] = useState<any>(null);
  const [isRecruiterLoading, setIsRecruiterLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;
      
      setApplications(prev => prev.map(a => a.db_id === applicationId ? { ...a, status: newStatus } : a));
      // Note: The trigger in Supabase will automatically update the student status
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  useEffect(() => {
    if (selectedApplicationId && applications.length > 0) {
      const app = applications.find(a => a.db_id === selectedApplicationId);
      if (app) {
        setSelectedApp(app);
      }
    }
  }, [selectedApplicationId, applications]);

  const fetchRecruiterStats = async (recruiterId: string) => {
    setIsRecruiterLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('status')
        .eq('recruiter_id', recruiterId);

      if (error) throw error;

      const stats = {
        total: data.length,
        accepted: data.filter(a => a.status === 'Accepted').length,
        underReview: data.filter(a => a.status === 'Under Review').length,
        rejected: data.filter(a => a.status === 'Rejected').length,
        successRate: data.length > 0 ? Math.round((data.filter(a => a.status === 'Accepted').length / data.length) * 100) : 0
      };
      setRecruiterStats(stats);
    } catch (err) {
      console.error('Error fetching recruiter stats:', err);
    } finally {
      setIsRecruiterLoading(false);
    }
  };

  const handleRecruiterClick = (e: React.MouseEvent, recruiter: any) => {
    e.stopPropagation();
    setSelectedRecruiter(recruiter);
    fetchRecruiterStats(recruiter.id);
  };

  const handleCloseCard = () => {
    setSelectedApp(null);
    if (setSelectedApplicationId) {
      setSelectedApplicationId(null);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    const userEmail = user?.email?.toLowerCase() || '';
    
    try {
      let query = supabase
        .from('applications')
        .select(`
          *,
          students (name, email, country),
          programs (
            name,
            institution_id,
            institutions (name)
          ),
          recruiter:profiles!recruiter_id (id, first_name, last_name, email, agency, country, city, phone, whatsapp, bio, is_verified)
        `);

      if (user.role === 'institution') {
        if (!userEmail) {
          setApplications([]);
          setIsLoading(false);
          return;
        }

        const { data: instData } = await supabase
          .from('institutions')
          .select('id, name')
          .eq('contact_email', userEmail)
          .maybeSingle();
        
        if (instData) {
          const { data: programsData } = await supabase
            .from('programs')
            .select('id, name')
            .eq('institution_id', instData.id);
          
          const programIds = (programsData || []).map(p => p.id);

          if (programIds.length > 0) {
            query = query.in('program_id', programIds);
          } else {
            setApplications([]);
            setIsLoading(false);
            return;
          }
        } else {
          setApplications([]);
          setIsLoading(false);
          return;
        }
      } else if (user.role === 'partner') {
        query = query.eq('recruiter_id', user.id);
      } else if (user.role === 'admin') {
        // Admins can see all applications, so no additional filters are needed
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('DEBUG ApplicationsList fetch raw data:', data);
      console.log('DEBUG ApplicationsList fetch error:', error);
      console.log('DEBUG ApplicationsList user role:', user.role);

      if (error) throw error;
      
      const mappedApps = (data || []).map(app => {
        try {
          if (!app.recruiter) {
            console.warn('DEBUG: Application recruiter is NULL for app ID:', app.id);
          }
          
          // Determine student name
          let studentName = '—';
          let studentEmail = '—';
          let studentCountry = '—';
          
          if (app.students) {
            if (Array.isArray(app.students)) {
              studentName = app.students[0]?.name || `${app.students[0]?.firstname || ''} ${app.students[0]?.lastname || ''}`.trim() || '—';
              studentEmail = app.students[0]?.email || '—';
              studentCountry = app.students[0]?.country || '—';
            } else {
              studentName = app.students.name || `${app.students.firstname || ''} ${app.students.lastname || ''}`.trim() || '—';
              studentEmail = app.students.email || '—';
              studentCountry = app.students.country || '—';
            }
          }

          return {
            id: `APP-${app.id.slice(0, 4).toUpperCase()}`,
            db_id: app.id,
            student: studentName,
            student_email: studentEmail,
            student_country: studentCountry,
            student_id: app.student_id,
            institution: app.programs?.institutions?.name || '—',
            institution_id: app.programs?.institution_id,
            recruiter_id: app.recruiter_id,
            recruiter: app.recruiter ? {
              id: app.recruiter.id,
              name: `${app.recruiter.first_name || app.recruiter.firstName || ''} ${app.recruiter.last_name || app.recruiter.lastName || ''}`.trim() || '—',
              email: app.recruiter.email,
              agency: app.recruiter.agency,
              country: app.recruiter.country,
              city: app.recruiter.city,
              phone: app.recruiter.phone,
              whatsapp: app.recruiter.whatsapp,
              bio: app.recruiter.bio,
              is_verified: app.recruiter.is_verified
            } : null,
            program: app.programs?.name || '—',
            status: app.status,
            date: new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            priority: 'normal'
          };
        } catch (e) {
          console.error('Error mapping app:', app, e);
          return null;
        }
      }).filter(Boolean);
      
      setApplications(mappedApps);
    } catch (err) {
      console.error('Error in fetchApplications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => 
    app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.program.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log('Rendering ApplicationsList. Applications:', applications.length, 'Filtered:', filteredApplications.length);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!selectedApp ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Applications</h1>
                <p className="text-[10px] text-gray-500">Track and manage all student applications to institutions.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#4338CA] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <ListIcon size={14} />
                  </button>
                  <button 
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-[#4338CA] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338CA] transition-colors" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search by ID, student, or institution..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:border-[#4338CA] transition-colors outline-none text-[11px]"
                  />
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className="bg-white border-y border-gray-200 -mx-6 px-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] text-gray-500 uppercase tracking-widest border-b border-gray-200">
                        <th className="py-2.5 font-bold">Application ID</th>
                        <th className="py-2.5 font-bold">Student</th>
                        <th className="py-2.5 font-bold">Institution & Program</th>
                        {(user.role === 'admin' || user.role === 'institution') && (
                          <th className="py-2.5 font-bold">Recruiter</th>
                        )}
                        <th className="py-2.5 font-bold">Status</th>
                        <th className="py-2.5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            <FileText size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-xs font-medium">No applications found matching your search.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app) => (
                          <tr 
                            key={app.id} 
                            onClick={() => setSelectedApp(app)}
                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                          >
                          <td className="py-2.5">
                            <span className="text-[9px] font-bold text-[#4338CA] bg-indigo-50 px-1.5 py-0.5 rounded-md">
                              {app.id}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-[9px]">
                                {app.student.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-gray-900 leading-tight">{app.student}</p>
                                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{app.date}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                                <Building2 size={11} className="text-gray-400" />
                                <span>{app.institution}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                <GraduationCap size={9} className="text-gray-400" />
                                <span>{app.program}</span>
                              </div>
                            </div>
                          </td>
                          {(user.role === 'admin' || user.role === 'institution') && (
                            <td className="py-2.5">
                              {app.recruiter ? (
                                <button 
                                  onClick={(e) => handleRecruiterClick(e, app.recruiter)}
                                  className="flex items-center gap-2 hover:text-[#4338CA] transition-colors group/rec"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4338CA] font-bold text-[9px] group-hover/rec:bg-indigo-100">
                                    {app.recruiter.name.split(' ').map((n: string) => n[0]).join('')}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[11px] font-bold leading-tight">{app.recruiter.name}</p>
                                    <p className="text-[9px] text-gray-400 font-medium">{app.recruiter.agency || 'Independent'}</p>
                                  </div>
                                </button>
                              ) : (
                                <span className="text-[11px] text-gray-400">—</span>
                              )}
                            </td>
                          )}
                          <td className="py-2.5">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="py-2.5 text-right text-gray-300">
                            <ArrowRight size={14} className="ml-auto group-hover:text-[#4338CA] transition-colors" />
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ApplicationKanban 
                  applications={filteredApplications}
                  onStatusChange={handleStatusChange}
                  onApplicationClick={(id) => {
                    const app = applications.find(a => a.db_id === id);
                    if (app) setSelectedApp(app);
                  }}
                />
              )}
            </div>
          </motion.div>
        ) : (
          <ApplicationCard 
            key="details"
            application={selectedApp} 
            user={user}
            onClose={handleCloseCard} 
            onStatusUpdate={() => {
              handleCloseCard();
              fetchApplications();
            }}
            onViewStudent={() => {
              if (setActiveTab && setSelectedStudentId && selectedApp.student_id) {
                setSelectedStudentId(selectedApp.student_id);
                setActiveTab('student-detail');
              }
            }}
            setActiveTab={setActiveTab}
            setSelectedChatId={setSelectedChatId}
          />
        )}
      </AnimatePresence>

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
                    {selectedRecruiter.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedRecruiter.name}</h2>
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
                    <p className="text-xs font-medium text-gray-900">{selectedRecruiter.city}, {selectedRecruiter.country}</p>
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
                    <p className="text-xs text-gray-600 leading-relaxed">{selectedRecruiter.bio}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-4">Performance Statistics</p>
                  {isRecruiterLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  ) : recruiterStats ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-indigo-50 rounded-xl text-center">
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Total</p>
                        <p className="text-lg font-black text-[#4338CA]">{recruiterStats.total}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl text-center">
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Accepted</p>
                        <p className="text-lg font-black text-green-700">{recruiterStats.accepted}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl text-center">
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Success</p>
                        <p className="text-lg font-black text-amber-700">{recruiterStats.successRate}%</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setSelectedRecruiter(null)}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    'New application': 'bg-gray-50 text-gray-500',
    'In review': 'bg-blue-50 text-blue-600',
    'Action Required': 'bg-amber-50 text-amber-600',
    'Approved': 'bg-emerald-50 text-emerald-600',
    'Rejected': 'bg-red-50 text-red-600',
    'Waiting payment': 'bg-orange-50 text-orange-600',
    'Payment received': 'bg-teal-50 text-teal-600',
    'Ready for visa': 'bg-cyan-50 text-cyan-600',
    'Done': 'bg-green-100 text-green-700',
    'Refund': 'bg-rose-50 text-rose-600',
    // Legacy support
    'Submitted': 'bg-gray-50 text-gray-500',
    'Reviewing': 'bg-blue-50 text-blue-600',
    'Accepted': 'bg-green-50 text-green-600',
    'Under Review': 'bg-blue-50 text-blue-600',
  };

  const icons: any = {
    'New application': Clock,
    'In review': Clock,
    'Action Required': AlertCircle,
    'Approved': CheckCircle2,
    'Rejected': AlertCircle,
    'Waiting payment': Clock,
    'Payment received': CheckCircle2,
    'Ready for visa': FileText,
    'Done': CheckCircle2,
    'Refund': AlertCircle,
    // Legacy support
    'Submitted': Clock,
    'Reviewing': Clock,
    'Accepted': CheckCircle2,
    'Under Review': Clock,
  };

  const Icon = icons[status] || Clock;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-50 text-gray-500'}`}>
      <Icon size={10} />
      <span>{status}</span>
    </div>
  );
};

export default ApplicationsList;
