import React, { useState } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Plus, XCircle } from 'lucide-react';
import WithdrawalModal from './WithdrawalModal';
import BalanceHistory from './BalanceHistory';

interface PayoutsProps {
  balance: number;
  withdrawals: any[];
  onWithdraw?: (amount: number, method: string) => void;
}

const Payouts: React.FC<PayoutsProps> = ({ balance, withdrawals, onWithdraw }) => {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-900">Payouts & Finance</h1>
          <p className="text-gray-500">Track your earnings and withdrawal history.</p>
        </div>
        <button 
          onClick={() => setIsWithdrawModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#4338CA] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-opacity-90 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={18} />
          Withdraw Funds
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#4338CA] text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-white/80">
              <CreditCard size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Available Balance</span>
            </div>
            <p className="text-4xl font-extrabold mb-1">${balance.toLocaleString('en-US')}</p>
            <p className="text-sm text-white/70">Ready to withdraw</p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-gray-500">
            <ArrowDownRight size={20} className="text-green-500" />
            <span className="text-sm font-bold uppercase tracking-wider">Total Earned</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 mb-1">$24,500</p>
          <p className="text-sm text-gray-500">Lifetime earnings</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-gray-500">
            <ArrowUpRight size={20} className="text-amber-500" />
            <span className="text-sm font-bold uppercase tracking-wider">Processing</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 mb-1">
            ${withdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-US')}
          </p>
          <p className="text-sm text-gray-500">Awaiting approval</p>
        </div>
      </div>

      <BalanceHistory />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900">Withdrawal History</h3>
        </div>
        
        {withdrawals.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Withdrawal history is empty.
          </div>
        ) : (
          <div className="bg-white border-y border-gray-200 -mx-8 px-8">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-4 font-bold">Transaction ID</th>
                  <th className="py-4 font-bold">Date</th>
                  <th className="py-4 font-bold">Method</th>
                  <th className="py-4 font-bold">Amount</th>
                  <th className="py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <span className="text-sm font-bold text-gray-900">{withdrawal.id}</span>
                    </td>
                    <td className="py-4 text-sm text-gray-600">{withdrawal.date}</td>
                    <td className="py-4 text-sm text-gray-600">{withdrawal.method}</td>
                    <td className="py-4 text-sm font-bold text-gray-900">${withdrawal.amount.toLocaleString('en-US')}</td>
                    <td className="py-4">
                      {withdrawal.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">
                          <CheckCircle2 size={14} />
                          Completed
                        </span>
                      ) : withdrawal.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold">
                          <XCircle size={14} />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">
                          <Clock size={14} />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <WithdrawalModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
        balance={balance} 
        onWithdraw={onWithdraw}
      />
    </div>
  );
};

export default Payouts;
