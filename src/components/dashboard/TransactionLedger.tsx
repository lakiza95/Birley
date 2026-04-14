import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'commission' | 'withdrawal' | 'payment_received' | 'adjustment';
  description: string;
  created_at: string;
}

export const TransactionLedger: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-black text-gray-900 mb-4">Transaction History</h3>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions found.</p>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${t.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {t.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.description}</p>
                  <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-sm font-black ${t.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
