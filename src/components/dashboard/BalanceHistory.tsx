import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useTimezone } from '../../context/TimezoneContext';
import { formatDateTime } from '../../utils/dateUtils';

interface BalanceHistoryItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

const BalanceHistory: React.FC = () => {
  const [history, setHistory] = useState<BalanceHistoryItem[]>([]);
  const { timezone } = useTimezone();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('balance_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error('Error fetching balance history:', error);
      else setHistory(data || []);
    };
    fetchHistory();
  }, []);

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-8">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Balance History</h3>
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <th className="py-4 font-bold">Date</th>
            <th className="py-4 font-bold">Type</th>
            <th className="py-4 font-bold">Description</th>
            <th className="py-4 font-bold">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {history.map((item) => (
            <tr key={item.id}>
              <td className="py-4 text-sm text-gray-600">{formatDateTime(item.created_at, timezone)}</td>
              <td className="py-4 text-sm text-gray-900 font-bold capitalize">{item.type}</td>
              <td className="py-4 text-sm text-gray-600">{item.description}</td>
              <td className={`py-4 text-sm font-bold ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.amount >= 0 ? '+' : ''}{item.amount.toLocaleString('en-US')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BalanceHistory;
