import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Clock } from 'lucide-react';

interface HistoryItem {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  comment: string | null;
  changed_by: { firstName: string; lastName: string } | null;
}

export const ApplicationHistory: React.FC<{ applicationId: string }> = ({ applicationId }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [applicationId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('application_status_history')
        .select(`
          *,
          changed_by:profiles(firstName, lastName)
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching application history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-sm text-gray-500">Loading history...</div>;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-black text-gray-900 mb-4">Application Status History</h3>
      <div className="space-y-4">
        {history.map((h) => (
          <div key={h.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Status changed from <span className="text-gray-500">{h.old_status || 'None'}</span> to <span className="text-indigo-600">{h.new_status}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(h.created_at).toLocaleString()} by {h.changed_by ? `${h.changed_by.firstName} ${h.changed_by.lastName}` : 'System'}
              </p>
              {h.comment && <p className="text-xs text-gray-700 mt-2 italic">"{h.comment}"</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
