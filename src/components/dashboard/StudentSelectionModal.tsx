import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { UserProfile } from '../../types';
import ApplicationSubmissionForm from './ApplicationSubmissionForm';

interface StudentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  user: UserProfile;
}

const StudentSelectionModal: React.FC<StudentSelectionModalProps> = ({ isOpen, onClose, programId, user }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [validatingStudentId, setValidatingStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setSelectedStudent(null);
      setError(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = async (student: any) => {
    setValidatingStudentId(student.id);
    setError(null);
    try {
      // 1. Check active applications limit
      const { data: activeApps, error: countError } = await supabase
        .from('applications')
        .select('id, program_id')
        .eq('student_id', student.id)
        .not('status', 'in', '("Rejected","Refund","Done")');

      if (countError) throw countError;

      if (activeApps && activeApps.length >= 5) {
        setError('This student has reached the maximum limit of 5 active applications. Please wait for current applications to be processed or close them before applying to new programs.');
        setValidatingStudentId(null);
        return;
      }

      // 2. Check duplicate application for this program
      const alreadyApplied = activeApps?.some(app => app.program_id === programId);
      if (alreadyApplied) {
        setError('This student has already applied to this program. Please check the Applications tab.');
        setValidatingStudentId(null);
        return;
      }

      // Validated!
      setSelectedStudent(student);
    } catch (err) {
      console.error('Error validating student:', err);
      setError('Error validating student. Please try again.');
    } finally {
      setValidatingStudentId(null);
    }
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstname || ''} ${s.lastname || ''} ${s.name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedStudent ? 'Submit Application' : 'Select Student'}
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar">
            {selectedStudent ? (
              <ApplicationSubmissionForm
                student={selectedStudent}
                programId={programId}
                user={user}
                onCancel={() => setSelectedStudent(null)}
                onSubmitSuccess={() => {
                  alert('Application submitted successfully!');
                  onClose();
                }}
              />
            ) : (
              <div className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search students by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4338CA] focus:border-transparent transition-all outline-none"
                  />
                </div>

                {isLoading ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-500 mb-6">You need to add a student before you can apply to programs.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredStudents.map(student => (
                      <div 
                        key={student.id}
                        onClick={() => !validatingStudentId && handleStudentSelect(student)}
                        className={`p-4 border rounded-2xl transition-all cursor-pointer flex items-center gap-4 ${
                          validatingStudentId === student.id 
                            ? 'border-indigo-200 bg-indigo-50 opacity-70' 
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                          <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{student.name || `${student.firstname || ''} ${student.lastname || ''}`.trim()}</h4>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                        {validatingStudentId === student.id && (
                          <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shrink-0"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudentSelectionModal;
