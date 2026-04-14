import React, { useState, useEffect } from 'react';
import { FilterModal } from './FilterModal';
import { supabase } from '../../supabase';
import { 
  CheckCircle2, 
  XCircle, 
  X,
  User, 
  Mail, 
  Globe, 
  Calendar,
  Loader2,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Clock,
  GraduationCap,
  Phone,
  MapPin,
  Briefcase,
  Users,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { UserProfile } from '../../types';

const VerificationRequests: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commissionRate, setCommissionRate] = useState<number>(20);

  useEffect(() => {
    if (selectedRequest) {
      setCommissionRate(selectedRequest.commission_rate || 20);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (user.role === 'admin') {
      fetchRequests();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'partner')
        .in('status', ['CREATED', 'EMAIL_VERIFIED', 'PROFILE_COMPLETED', 'PENDING_DOCS', 'UNDER_REVIEW'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching verification requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    console.log('Approving recruiter:', id, 'with commissionRate:', commissionRate);
    try {
      console.log('Attempting update for:', id);
      const { error, data } = await supabase
        .from('profiles')
        .update({ 
          status: 'ACTIVE', 
          recruiter_commission_rate: Number(commissionRate),
          is_verified: true 
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Update response data:', data);
      
      // Update local state by filtering out the approved request
      setRequests(requests.filter(r => r.id !== id));
      setSelectedRequest(null);
      
      // Force re-fetch to ensure UI is in sync
      await fetchRequests();
    } catch (err) {
      console.error('Error approving recruiter:', err);
      alert('Failed to approve recruiter.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this recruiter?')) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'REJECTED' })
        .eq('id', id);

      if (error) throw error;
      
      setRequests(requests.filter(r => r.id !== id));
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error rejecting recruiter:', err);
      alert('Failed to reject recruiter.');
    } finally {
      setIsProcessing(false);
    }
  };

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const filteredRequests = requests.filter(r => {
    // Only show pending requests
    if (r.status !== 'CREATED' && r.status !== 'UNDER_REVIEW') {
      return false;
    }

    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
    const email = (r.email || '').toLowerCase();
    const company = (r.company_name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(search) || email.includes(search) || company.includes(search);
    
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'status') return r.status === value;
      if (key === 'country') return r.country?.toLowerCase().includes(value.toLowerCase());
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  if (user.role !== 'admin') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-900">Verification Status</h1>
          <p className="text-gray-500">Here you can track the status of your account.</p>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-12 space-y-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center shadow-lg ${
                user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' :
                user.status === 'REJECTED' ? 'bg-red-50 text-red-600 shadow-red-100' :
                'bg-amber-50 text-amber-600 shadow-amber-100'
              }`}>
                {user.status === 'ACTIVE' ? <CheckCircle2 size={48} /> : 
                 user.status === 'REJECTED' ? <XCircle size={48} /> : 
                 <Clock size={48} />}
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.status === 'ACTIVE' ? 'Your account is verified!' :
                   user.status === 'REJECTED' ? 'Application rejected' :
                   'Your application is under review'}
                </h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  {user.status === 'ACTIVE' ? 'Now you can use all the features of the platform, including submitting student applications.' :
                   user.status === 'REJECTED' ? 'Unfortunately, your application was rejected. Please contact support for clarification.' :
                   'Our team is checking your data. This usually takes 24 to 48 hours. We will notify you by email.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email verified</p>
                  <p className="text-sm font-bold text-gray-900">Completed</p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verification</p>
                  <p className="text-sm font-bold text-gray-900">
                    {user.status === 'ACTIVE' ? 'Passed' : user.status === 'REJECTED' ? 'Rejected' : 'In progress'}
                  </p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Onboarding</p>
                  <p className="text-sm font-bold text-gray-900">Completed</p>
                </div>
              </div>
            </div>

            {user.status !== 'ACTIVE' && (
              <div className="p-8 bg-brand/5 rounded-3xl border border-brand/10 flex items-start gap-4">
                <AlertCircle className="text-brand shrink-0" size={24} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-brand">Important Note</p>
                  <p className="text-xs text-brand/70 leading-relaxed">
                    You will not be able to submit student applications to educational institutions until your account is fully verified by an administrator.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-900">Verification</h1>
          <p className="text-gray-500">Manage verification requests from recruiters.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name, email or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center justify-center gap-2 px-6 py-3 bg-white border rounded-2xl text-sm font-bold transition-all shadow-sm ${Object.keys(activeFilters).length > 0 ? 'border-brand text-brand bg-brand/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase font-bold tracking-widest border-b border-gray-50">
                  <th className="px-8 py-5">Recruiter</th>
                  <th className="px-8 py-5">Company</th>
                  <th className="px-8 py-5">Submission Date</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-medium">
                      No verification requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr 
                      key={request.id} 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer group ${selectedRequest?.id === request.id ? 'bg-brand/5' : ''}`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
                            {request.first_name?.[0]}{request.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{request.first_name} {request.last_name}</p>
                            <p className="text-xs text-gray-500">{request.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-medium text-gray-700">{request.company_name || '—'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{request.country || '—'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar size={14} />
                          <span className="text-xs">{new Date(request.created_at).toLocaleDateString('en-US')}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                            request.status === 'CREATED' ? 'bg-gray-100 text-gray-800' :
                            request.status === 'EMAIL_VERIFIED' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'PROFILE_COMPLETED' ? 'bg-indigo-100 text-indigo-800' :
                            request.status === 'PENDING_DOCS' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'UNDER_REVIEW' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status === 'CREATED' ? 'Created' :
                             request.status === 'EMAIL_VERIFIED' ? 'Email verified' :
                             request.status === 'PROFILE_COMPLETED' ? 'Profile completed' :
                             request.status === 'PENDING_DOCS' ? 'Pending documents' :
                             request.status === 'UNDER_REVIEW' ? 'Under review' :
                             request.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-brand group-hover:text-white transition-all">
                          <ShieldCheck size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Recruiter Details */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Recruiter Details</h2>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto">
                <div className="flex flex-col items-center text-center space-y-4 mb-8">
                  <div className="w-24 h-24 rounded-3xl bg-brand/10 text-brand flex items-center justify-center text-3xl font-bold">
                    {selectedRequest.first_name?.[0]}{selectedRequest.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedRequest.first_name} {selectedRequest.last_name}</h3>
                    <p className="text-sm text-brand font-bold uppercase tracking-widest mt-1">Recruiter / Partner</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Mail size={12} /> Email
                    </p>
                    <p className="text-sm font-bold text-gray-900 break-all">{selectedRequest.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Phone size={12} /> Phone number
                    </p>
                    <p className="text-sm font-bold text-gray-900">{selectedRequest.phone || selectedRequest.whatsapp || '—'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Briefcase size={12} /> Agency / Company
                    </p>
                    <p className="text-sm font-bold text-gray-900">{selectedRequest.agency || selectedRequest.company_name || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} /> Location
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {[selectedRequest.city, selectedRequest.country].filter(Boolean).join(', ') || 'Not specified'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 sm:col-span-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} /> Mailing Address
                    </p>
                    <p className="text-sm font-bold text-gray-900">{selectedRequest.mailing_address || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 sm:col-span-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} /> Organization Address
                    </p>
                    <p className="text-sm font-bold text-gray-900">{selectedRequest.organization_address || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={12} /> Tax ID
                    </p>
                    <p className="text-sm font-bold text-gray-900">{selectedRequest.tax_id || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Globe size={12} /> Website
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedRequest.website ? (
                        <a href={selectedRequest.website.startsWith('http') ? selectedRequest.website : `https://${selectedRequest.website}`} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                          {selectedRequest.website}
                        </a>
                      ) : 'Not specified'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Globe size={12} /> Markets
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {Array.isArray(selectedRequest.markets) 
                        ? selectedRequest.markets.join(', ') 
                        : (selectedRequest.markets || 'Not specified')}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Users size={12} /> Students per year
                    </p>
                    <p className="text-sm font-bold text-gray-900">{selectedRequest.students_per_year || selectedRequest.studentsPerYear || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 sm:col-span-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} /> Work Experience
                    </p>
                    <p className="text-sm font-bold text-gray-900">{selectedRequest.experience || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-1 sm:col-span-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> Registration Date
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Not specified'}
                    </p>
                  </div>
                  {selectedRequest.bio && (
                    <div className="p-4 bg-gray-50 rounded-2xl space-y-1 sm:col-span-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12} /> About
                      </p>
                      <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">{selectedRequest.bio}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    Recruiter Commission Percentage
                  </label>
                  <p className="text-xs text-gray-500">Specify the percentage of the student's payment that the recruiter will receive.</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand transition-all font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>

                <div className="mt-6 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Please check the provided data before approval. After approval, the recruiter will receive full access to the platform.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all disabled:opacity-50"
                >
                  <XCircle size={18} />
                  <span>Reject</span>
                </button>
                <button 
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-4 bg-brand text-white rounded-2xl font-bold text-sm hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  <span>Approve</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApply={setActiveFilters}
        fields={[
          { key: 'status', label: 'Status', type: 'select', options: ['CREATED', 'UNDER_REVIEW'] },
          { key: 'country', label: 'Country', type: 'text' }
        ]}
      />
    </div>
  );
};

export default VerificationRequests;
