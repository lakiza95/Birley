import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  TrendingUp, 
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Mail,
  Calendar
} from 'lucide-react';
import { supabase } from '../../supabase';
import { UserProfile } from '../../types';
import UserDetail from './UserDetail';

interface ReferralProgramProps {
  user: UserProfile;
}

const ReferralProgram: React.FC<ReferralProgramProps> = ({ user }) => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, [user.institution_id]);

  const fetchReferrals = async () => {
    if (!user.institution_id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('referred_by_institution_id', user.institution_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!user.institution_id) return;
    const link = `${window.location.origin}/register?ref=${user.institution_id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredReferrals = referrals.filter(ref => 
    ref.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${ref.first_name} ${ref.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.agency?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedUserId) {
    return <UserDetail userId={selectedUserId} onBack={() => setSelectedUserId(null)} canEdit={false} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-500">Invite recruiters and enjoy 0% platform commission for their students.</p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Share2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Unique Referral Link</h2>
              <p className="text-gray-500 mt-1">
                Share this link with recruiters. When they register using your link, you won't pay the platform commission for students they enroll in your programs for 1 year!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/register?ref=${user.institution_id}`}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-gray-600 font-mono outline-none focus:border-indigo-300 transition-colors"
                />
              </div>
              <button 
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Link Copied!' : 'Copy Referral Link'}
              </button>
            </div>
          </div>
          <div className="w-full lg:w-72 bg-indigo-50/50 rounded-3xl p-6 border border-indigo-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-indigo-900/60 font-medium">Total Referrals</span>
                <Users size={18} className="text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-indigo-900">{referrals.length}</div>
              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-indigo-700 font-bold bg-indigo-100/50 w-fit px-3 py-1 rounded-full">
                  <TrendingUp size={12} />
                  <span>Active Program</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Referred Recruiters</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search referrals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:bg-white focus:border-indigo-200 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Recruiter</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Agency</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Registration Date</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-12 bg-gray-100 rounded-2xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredReferrals.length > 0 ? (
                filteredReferrals.map((ref) => (
                  <tr 
                    key={ref.id} 
                    onClick={() => setSelectedUserId(ref.id)}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
                          {ref.first_name?.[0] || ref.email?.[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{ref.first_name} {ref.last_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail size={12} />
                            {ref.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-gray-600 font-medium">{ref.agency || 'Individual'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(ref.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ref.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        <ShieldCheck size={12} />
                        {ref.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(ref.id);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mx-auto">
                        <Users size={32} />
                      </div>
                      <div className="font-bold text-gray-900">No referrals yet</div>
                      <p className="text-sm text-gray-500">
                        Share your link with recruiters to start building your network and saving on commissions.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReferralProgram;
