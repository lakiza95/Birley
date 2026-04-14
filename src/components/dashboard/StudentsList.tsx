import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  GraduationCap, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Edit2,
  Trash2,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, UserProfile, StudentStatus } from '../../types';
import AddStudentForm from './AddStudentForm';
import ProgramMatcher from './ProgramMatcher';
import StudentKanban from './StudentKanban';
import { FilterModal } from './FilterModal';
import { supabase } from '../../supabase';
import { getNames } from 'country-list';
import { SPECIALIZATIONS } from '../../constants/specializations';

interface StudentsListProps {
  setActiveTab: (tab: string) => void;
  setSelectedStudentId: (id: string) => void;
  setIsEditingStudent?: (isEditing: boolean) => void;
  user: UserProfile;
}

const StudentsList: React.FC<StudentsListProps> = ({ setActiveTab, setSelectedStudentId, setIsEditingStudent, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [studentForMatching, setStudentForMatching] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleStatusChange = async (studentId: string, newStatus: StudentStatus) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', studentId);

      if (error) throw error;
      
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
    } catch (err) {
      console.error('Error updating student status:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map Supabase data to Student type
      const mappedStudents: Student[] = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        country: s.country,
        program: s.preferredspecialization || s.preferredSpecialization || s.desiredfield || s.desiredField || 'General Interest',
        status: s.status as any,
        documents: [], // Handle documents separately
        preferences: { 
          budget: s.budget || 0, 
          languageLevels: s.languagelevels || s.languageLevels ? JSON.parse(s.languagelevels || s.languageLevels || '[]') : [] 
        }
      }));
      
      setStudents(mappedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== id));
      setStudentToDelete(null);
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  const handleSaveStudent = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fullName = `${data.firstName} ${data.middleName} ${data.lastName}`.replace(/\s+/g, ' ').trim();
      const { data: newStudentData, error } = await supabase
        .from('students')
        .insert([{
          name: fullName,
          firstname: data.firstName,
          middlename: data.middleName,
          lastname: data.lastName,
          email: data.email || 'no-email@provided.com',
          country: data.nationality,
          status: 'New Student',
          recruiter_id: user.id,
          dob: data.dob,
          passportnumber: data.passportNumber,
          passportexpiry: data.passportExpiry,
          visastatus: data.visaStatus,
          desiredfield: data.desiredField,
          startdate: data.startDate,
          destination: data.destination,
          educationlevel: data.educationLevel,
          whatsapp: data.whatsapp,
          budget: data.budget,
          preferredspecialization: data.preferredSpecialization,
          languagelevels: JSON.stringify(data.languageProficiency)
        }])
        .select()
        .single();

      if (error) throw error;

      const newStudent: Student = {
        id: newStudentData.id,
        name: newStudentData.name,
        email: newStudentData.email,
        country: newStudentData.country,
        program: data.desiredField || 'Preparation',
        status: 'New Student',
        documents: [],
        preferences: { budget: data.budget, languageLevels: [] }
      };

      setStudents(prev => [newStudent, ...prev]);
      setIsAddingStudent(false);
      setStudentForMatching(newStudentData);
    } catch (err) {
      console.error('Error saving student:', err);
      alert('Error saving student: ' + (err as Error).message);
    }
  };

  if (studentForMatching) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <ProgramMatcher 
          student={studentForMatching}
          onSkip={() => {
            setStudentForMatching(null);
            setSelectedStudentId(studentForMatching.id);
            setActiveTab('student-detail');
          }}
          onSelectProgram={(programId) => {
            // Later we can implement applying to the program directly
            // For now, just go to student detail
            setStudentForMatching(null);
            setSelectedStudentId(studentForMatching.id);
            setActiveTab('student-detail');
          }}
        />
      </motion.div>
    );
  }

  if (isAddingStudent) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <AddStudentForm 
          onCancel={() => setIsAddingStudent(false)} 
          onSave={handleSaveStudent} 
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-sm text-gray-500">Track and manage your student recruitment pipeline.</p>
        </div>
        {user.role !== 'institution' && (
          <button 
            onClick={() => setIsAddingStudent(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand/10 active:scale-95"
          >
            <Plus size={18} />
            <span>Add New Student</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email or program..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:border-brand transition-all outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 relative">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 mr-2">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <ListIcon size={18} />
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`p-2.5 rounded-xl transition-all border ${Object.keys(activeFilters).length > 0 ? 'bg-brand/5 border-brand/20 text-brand' : 'text-gray-500 hover:bg-gray-50 bg-white border-gray-200'}`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-white border-y border-gray-200 -mx-8 px-8">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-4 font-bold">Student</th>
                  <th className="py-4 font-bold">Program & Destination</th>
                  <th className="py-4 font-bold">Status</th>
                  <th className="py-4 font-bold">Documents</th>
                  <th className="py-4 font-bold text-right">{user.role !== 'institution' && 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.filter(s => {
                  const matchesSearch = 
                    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.program?.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
                    if (!value) return true;
                    if (key === 'status') return s.status === value;
                    if (key === 'program') return s.program?.toLowerCase().includes(value.toLowerCase());
                    if (key === 'country') return s.country?.toLowerCase().includes(value.toLowerCase());
                    return true;
                  });

                  return matchesSearch && matchesFilters;
                }).map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      if (setIsEditingStudent) setIsEditingStudent(false);
                      setSelectedStudentId(student.id);
                      setActiveTab('student-detail');
                    }}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand font-bold text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{student.name || '—'}</p>
                          <p className="text-xs text-gray-500">{student.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                          <GraduationCap size={14} className="text-gray-400" />
                          <span>{student.program || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin size={12} className="text-gray-400" />
                          <span>{student.country || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <FileText size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-700">
                          {student.documents.filter(d => d.status === 'uploaded').length}/{student.documents.length}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right relative">
                      {user.role !== 'institution' && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === student.id ? null : student.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openDropdownId === student.id && (
                            <div className="absolute right-8 top-10 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (setIsEditingStudent) setIsEditingStudent(true);
                                  setSelectedStudentId(student.id);
                                  setActiveTab('student-detail');
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit2 size={16} />
                                Edit
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStudentToDelete(student);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <StudentKanban 
            students={students.filter(s => {
              const matchesSearch = 
                s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.program?.toLowerCase().includes(searchTerm.toLowerCase());
              
              const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
                if (!value) return true;
                if (key === 'status') return s.status === value;
                if (key === 'program') return s.program?.toLowerCase().includes(value.toLowerCase());
                if (key === 'country') return s.country?.toLowerCase().includes(value.toLowerCase());
                return true;
              });

              return matchesSearch && matchesFilters;
            })}
            onStatusChange={handleStatusChange}
            onStudentClick={(id) => {
              if (setIsEditingStudent) setIsEditingStudent(false);
              setSelectedStudentId(id);
              setActiveTab('student-detail');
            }}
          />
        )}
      </div>

      {studentToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete student?</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete student <b>{studentToDelete.name}</b>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setStudentToDelete(null); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(studentToDelete.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApply={setActiveFilters}
        fields={[
          { key: 'status', label: 'Status', type: 'select', options: ['New Student', 'Follow up', 'Ready to apply', 'Application started', 'Action Required', 'Application accepted', 'Waiting payment', 'Payment received', 'Ready for visa', 'Waiting visa', 'Done', 'Refund'] },
          { key: 'program', label: 'Program', type: 'select', options: Object.keys(SPECIALIZATIONS) },
          { key: 'country', label: 'Country', type: 'select', options: getNames() }
        ]}
      />
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    'New Student': 'bg-gray-50 text-gray-500',
    'Follow up': 'bg-blue-50 text-blue-600',
    'Ready to apply': 'bg-indigo-50 text-indigo-600',
    'Application started': 'bg-purple-50 text-purple-600',
    'Action Required': 'bg-amber-50 text-amber-600',
    'Application accepted': 'bg-emerald-50 text-emerald-600',
    'Waiting payment': 'bg-orange-50 text-orange-600',
    'Payment received': 'bg-teal-50 text-teal-600',
    'Ready for visa': 'bg-cyan-50 text-cyan-600',
    'Waiting visa': 'bg-blue-50 text-blue-600',
    'Done': 'bg-green-100 text-green-700',
    'Refund': 'bg-red-50 text-red-600',
    'Rejected': 'bg-red-50 text-red-600',
    // Legacy support
    'Preparation': 'bg-gray-50 text-gray-500',
    'Applied': 'bg-blue-50 text-blue-600',
    'Payment': 'bg-amber-50 text-amber-600',
    'Visa': 'bg-purple-50 text-purple-600',
    'Enrolled': 'bg-green-50 text-green-600',
    'Success': 'bg-green-50 text-green-600',
    'In Progress': 'bg-blue-50 text-blue-600',
    'Pending': 'bg-gray-50 text-gray-500',
  };

  const icons: any = {
    'New Student': Clock,
    'Follow up': Clock,
    'Ready to apply': FileText,
    'Application started': Clock,
    'Action Required': AlertCircle,
    'Application accepted': CheckCircle2,
    'Waiting payment': Clock,
    'Payment received': CheckCircle2,
    'Ready for visa': FileText,
    'Waiting visa': Clock,
    'Done': CheckCircle2,
    'Refund': AlertCircle,
    'Rejected': AlertCircle,
    // Legacy support
    'Preparation': Clock,
    'Applied': FileText,
    'Payment': Clock,
    'Visa': Clock,
    'Enrolled': CheckCircle2,
    'Success': CheckCircle2,
    'In Progress': Clock,
    'Pending': Clock,
  };

  const Icon = icons[status] || Clock;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-50 text-gray-500'}`}>
      <Icon size={12} />
      <span>{status}</span>
    </div>
  );
};

export default StudentsList;
