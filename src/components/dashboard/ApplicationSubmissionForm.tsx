import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

import { UserProfile } from '../../types';

interface ApplicationSubmissionFormProps {
  student: any;
  programId: string;
  user: UserProfile;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}

const ApplicationSubmissionForm: React.FC<ApplicationSubmissionFormProps> = ({ student, programId, user, onCancel, onSubmitSuccess }) => {
  const [program, setProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchProgramDetails();
  }, [programId]);

  const fetchProgramDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          institutions (name, country, logo_url)
        `)
        .eq('id', programId)
        .single();

      if (error) throw error;
      setProgram(data);
    } catch (err) {
      console.error('Error fetching program details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user.status !== 'ACTIVE') {
      alert('Verification required. To submit applications, your account must be verified. Please ensure you have completed your profile and provided all company details in Settings.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('applications')
        .insert([{
          student_id: student.id,
          program_id: programId,
          recruiter_id: user.id,
          status: 'Under Review',
          notes: notes
        }]);

      if (error) throw error;
      
      onSubmitSuccess();
    } catch (err) {
      console.error('Error submitting application:', err);
      alert('Error submitting application: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading program details...</div>;
  if (!program) return <div className="text-center py-12 text-red-500">Program not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto pb-20"
    >
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Application</h1>
          <p className="text-sm text-gray-500">Review details and submit application for {student.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
        <div className="flex items-start gap-6 mb-8 pb-8 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
            <img src={program.institutions?.logo_url || `https://picsum.photos/seed/${program.id}/200`} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{program.name}</h2>
            <p className="text-gray-500">{program.institutions?.name} • {program.institutions?.country}</p>
            <div className="flex gap-4 mt-4">
              <span className="px-3 py-1 bg-indigo-50 text-[#4338CA] rounded-lg text-xs font-bold">
                {program.tuition_fee} {program.currency}/year
              </span>
              <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold">
                {program.duration}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4">Required Documents List</h3>
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-gray-700">Passport Copy (available in profile)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-gray-700">Academic Transcripts (available in profile)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <XCircle size={16} className="text-red-500" />
                <span className="text-gray-700">Language Certificate (missing)</span>
                <span className="text-xs text-amber-600 font-bold ml-auto">Can be provided later</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Additional Notes (optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for the admissions committee..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-300 outline-none text-sm min-h-[120px] resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-[#4338CA] text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : (
                <>
                  <Send size={18} />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ApplicationSubmissionForm;
