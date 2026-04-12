import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter,
  User,
  Building2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'motion/react';

const AdminPayouts: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      console.log('DEBUG: Fetching withdrawals for admin...');
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('DEBUG: Error fetching withdrawals:', error);
        throw error;
      }
      
      // Log the raw count and data for debugging
      console.log('DEBUG: Withdrawals data received:', data);
      setWithdrawals(data || []);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, userId: string, amount: number, newStatus: 'completed' | 'rejected') => {
    setIsProcessing(id);
    try {
      // 1. Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. If rejected, refund the balance
      if (newStatus === 'rejected') {
        // Get current balance first to be safe
        const { data: profileData } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
        
        const currentBalance = profileData?.balance || 0;
        
        const { error: refundError } = await supabase
          .from('profiles')
          .update({ balance: currentBalance + amount })
          .eq('id', userId);

        if (refundError) throw refundError;
      }

      // 3. Refresh list
      await fetchWithdrawals();
      
      // 4. Update selected payout if open
      if (selectedPayout && selectedPayout.id === id) {
        setSelectedPayout({ ...selectedPayout, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating withdrawal status:', err);
      alert('Error updating payout status');
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const firstName = w.profiles?.first_name || '';
    const lastName = w.profiles?.last_name || '';
    const email = w.profiles?.email || '';
    const id = w.id || '';

    const matchesSearch = 
      firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: withdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0),
    completed: withdrawals.filter(w => w.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0),
    total: withdrawals.reduce((acc, curr) => acc + curr.amount, 0)
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-gray-500">Processing and approving withdrawal requests.</p>
        </div>
        <button 
          onClick={fetchWithdrawals}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-amber-600">
            <Clock size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Pending Payouts</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 mb-1">${stats.pending.toLocaleString('en-US')}</p>
          <p className="text-sm text-gray-500">Active requests</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Total Paid</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 mb-1">${stats.completed.toLocaleString('en-US')}</p>
          <p className="text-sm text-gray-500">Successful transactions</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <CreditCard size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Total Volume</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 mb-1">${stats.total.toLocaleString('en-US')}</p>
          <p className="text-sm text-gray-500">All requests</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name, email or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {(['all', 'pending', 'completed', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === status 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All' : 
                 status === 'pending' ? 'Pending' : 
                 status === 'completed' ? 'Completed' : 'Rejected'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-4 font-bold">User</th>
                <th className="py-4 font-bold">Method</th>
                <th className="py-4 font-bold">Amount</th>
                <th className="py-4 font-bold">Date</th>
                <th className="py-4 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={24} className="text-indigo-600 animate-spin" />
                      <p className="text-sm text-gray-500">Loading payouts...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No payouts found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => (
                  <tr 
                    key={w.id} 
                    onClick={() => setSelectedPayout(w)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs">
                          {w.profiles?.first_name?.[0]}{w.profiles?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {w.profiles?.first_name} {w.profiles?.last_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                              {w.profiles?.email}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                              w.profiles?.role === 'partner' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {w.profiles?.role === 'partner' ? 'Recruiter' : 'Institution'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CreditCard size={14} className="text-gray-400" />
                        {w.method}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-sm font-extrabold text-gray-900">
                        ${w.amount.toLocaleString('en-US')}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-500">
                      {new Date(w.created_at).toLocaleDateString('en-US')}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        w.status === 'completed' ? 'bg-green-50 text-green-600' :
                        w.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {w.status === 'completed' ? <CheckCircle2 size={12} /> : 
                         w.status === 'rejected' ? <XCircle size={12} /> : 
                         <Clock size={12} />}
                        {w.status === 'completed' ? 'Completed' : 
                         w.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Payout Details</h2>
                    <p className="text-xs text-gray-500">ID: {selectedPayout.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPayout(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                    {selectedPayout.profiles?.first_name?.[0]}{selectedPayout.profiles?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {selectedPayout.profiles?.first_name} {selectedPayout.profiles?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{selectedPayout.profiles?.email}</p>
                    <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                      selectedPayout.profiles?.role === 'partner' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {selectedPayout.profiles?.role === 'partner' ? 'Recruiter' : 'Institution'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Amount</p>
                    <p className="text-xl font-extrabold text-gray-900">${selectedPayout.amount.toLocaleString('en-US')}</p>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Method</p>
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                      <CreditCard size={14} className="text-gray-400" />
                      {selectedPayout.method}
                    </div>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Request Date</p>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(selectedPayout.created_at).toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedPayout.status === 'completed' ? 'bg-green-50 text-green-600' :
                      selectedPayout.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {selectedPayout.status === 'completed' ? <CheckCircle2 size={12} /> : 
                       selectedPayout.status === 'rejected' ? <XCircle size={12} /> : 
                       <Clock size={12} />}
                      {selectedPayout.status === 'completed' ? 'Completed' : 
                       selectedPayout.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                </div>

                {selectedPayout.details && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-50 rounded-2xl">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2">Payment Details</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPayout.details}</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 flex items-center gap-3">
                {selectedPayout.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedPayout.id, selectedPayout.user_id, selectedPayout.amount, 'completed')}
                      disabled={isProcessing === selectedPayout.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100"
                    >
                      {isProcessing === selectedPayout.id ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      Approve Payout
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedPayout.id, selectedPayout.user_id, selectedPayout.amount, 'rejected')}
                      disabled={isProcessing === selectedPayout.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      {isProcessing === selectedPayout.id ? <RefreshCw size={18} className="animate-spin" /> : <XCircle size={18} />}
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedPayout(null)}
                    className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayouts;
