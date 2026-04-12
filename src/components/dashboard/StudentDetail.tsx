import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  User, 
  CheckCircle, 
  XCircle, 
  Cake, 
  CreditCard, 
  Mail, 
  MessageCircle, 
  BookOpen,
  ChevronDown,
  Search,
  Globe,
  Phone,
  Calendar,
  Info,
  X,
  UploadCloud,
  FileText
} from 'lucide-react';
import { supabase } from '../../supabase';
import { UserProfile } from '../../types';
import ApplicationCard from './ApplicationCard';
import ProgramMatcher from './ProgramMatcher';
import ApplicationSubmissionForm from './ApplicationSubmissionForm';
import DatePicker from 'react-datepicker';
import { parseISO, format, isValid } from 'date-fns';
import { PatternFormat } from 'react-number-format';
import { motion, AnimatePresence } from 'motion/react';
import SpecializationSelector from './SpecializationSelector';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getNames } from 'country-list';

interface StudentDetailProps {
  studentId: string;
  user: UserProfile;
  onBack: () => void;
  initialEditMode?: boolean;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ studentId, user, onBack, initialEditMode = false }) => {
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [formData, setFormData] = useState<any>({});
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isMatchingPrograms, setIsMatchingPrograms] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchStudent();
    fetchApplications();
  }, [studentId]);

  useEffect(() => {
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          students (name, email, country),
          programs (
            name,
            institution_id,
            institutions (name)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedApps = (data || []).map(app => {
        let studentName = student?.name || 'Unknown';
        let studentEmail = student?.email || 'N/A';
        let studentCountry = student?.country || 'N/A';
        
        if (app.students) {
          if (Array.isArray(app.students)) {
            studentName = app.students[0]?.name || `${app.students[0]?.firstname || ''} ${app.students[0]?.lastname || ''}`.trim() || studentName;
            studentEmail = app.students[0]?.email || studentEmail;
            studentCountry = app.students[0]?.country || studentCountry;
          } else {
            studentName = app.students.name || `${app.students.firstname || ''} ${app.students.lastname || ''}`.trim() || studentName;
            studentEmail = app.students.email || studentEmail;
            studentCountry = app.students.country || studentCountry;
          }
        }

        return {
          id: `APP-${app.id.slice(0, 4).toUpperCase()}`,
          db_id: app.id,
          student: studentName,
          student_email: studentEmail,
          student_country: studentCountry,
          institution: app.programs?.institutions?.name || 'Unknown',
          institution_id: app.programs?.institution_id,
          recruiter_id: app.recruiter_id,
          program: app.programs?.name || 'Unknown',
          status: app.status,
          payment_link: app.payment_link,
          date: new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          updated_at: new Date(app.updated_at || app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      });
      
      setApplications(mappedApps);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchStudent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      
      const nameParts = data.name?.split(' ') || [];
      const mappedData = {
        ...data,
        name: data.name || '',
        firstName: data.firstname || data.firstName || nameParts[0] || '',
        middleName: data.middlename || data.middleName || (nameParts.length > 2 ? nameParts[1] : ''),
        lastName: data.lastname || data.lastName || (nameParts.length > 2 ? nameParts.slice(2).join(' ') : (nameParts[1] || '')),
        nationality: data.country || '',
        passportNumber: data.passportnumber || data.passportNumber || '',
        passportExpiry: data.passportexpiry || data.passportExpiry || '',
        visaStatus: data.visastatus || data.visaStatus || '',
        desiredField: data.desiredfield || data.desiredField || '',
        startDate: data.startdate || data.startDate || '',
        educationLevel: data.educationlevel || data.educationLevel || '',
        preferredSpecialization: Array.isArray(data.preferredspecialization) ? data.preferredspecialization : (data.preferredspecialization ? [data.preferredspecialization] : []),
        languageLevels: data.languagelevels || data.languageLevels ? 
          (typeof (data.languagelevels || data.languageLevels) === 'string' ? 
            JSON.parse(data.languagelevels || data.languageLevels) : 
            (data.languagelevels || data.languageLevels)) : 
          { Portuguese: 1, English: 1, Spanish: 1 },
      };
      
      setStudent(mappedData);
      setFormData(mappedData);
    } catch (err) {
      console.error('Error fetching student:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.replace(/\s+/g, ' ').trim();
      const dbData = {
        name: fullName,
        firstname: formData.firstName,
        middlename: formData.middleName,
        lastname: formData.lastName,
        email: formData.email,
        country: formData.nationality,
        dob: formData.dob,
        passportnumber: formData.passportNumber,
        passportexpiry: formData.passportExpiry,
        visastatus: formData.visaStatus,
        desiredfield: formData.desiredField,
        startdate: formData.startDate,
        destination: formData.destination,
        educationlevel: formData.educationLevel,
        whatsapp: formData.whatsapp,
        budget: formData.budget,
        preferredspecialization: formData.preferredSpecialization,
        languagelevels: JSON.stringify(formData.languageLevels),
      };

      const { error } = await supabase
        .from('students')
        .update(dbData)
        .eq('id', studentId);

      if (error) throw error;
      
      setStudent({ ...formData, name: fullName });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving student:', err);
      // Using a simple notification instead of alert if possible, or keeping it Russian
      alert('Error saving student data: ' + (err as Error).message);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
  if (!student) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Student not found</h2>
      <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">Back to list</button>
    </div>
  );

  if (isMatchingPrograms) {
    return (
      <ProgramMatcher 
        student={student}
        onSkip={() => setIsMatchingPrograms(false)}
        onSelectProgram={(programId) => {
          setSelectedProgramId(programId);
          setIsMatchingPrograms(false);
        }}
      />
    );
  }

  if (selectedProgramId) {
    return (
      <ApplicationSubmissionForm
        student={student}
        programId={selectedProgramId}
        user={user}
        onCancel={() => setSelectedProgramId(null)}
        onSubmitSuccess={() => {
          setSelectedProgramId(null);
          fetchApplications();
        }}
      />
    );
  }

  if (selectedApplication) {
    return (
      <ApplicationCard 
        application={selectedApplication} 
        user={user}
        onClose={() => setSelectedApplication(null)} 
        backLabel="Back to student profile"
        onViewStudent={() => setSelectedApplication(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <div className="text-xs text-gray-400 mb-1">My Students / {student.name}</div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Student Profile — {student.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                student.status === 'Preparation' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                student.status === 'Applied' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                student.status === 'Payment' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                student.status === 'Visa' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                student.status === 'Enrolled' ? 'bg-green-50 text-green-600 border-green-100' :
                student.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                {student.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user.role !== 'institution' && (
            <span className="text-sm font-bold text-gray-300 hidden sm:block">
              {applications.length} active {applications.length === 1 ? 'application' : 'applications'}
            </span>
          )}
          {!isEditing ? (
            <>
              {user.role !== 'institution' && (
                <button 
                  onClick={() => {
                    if (user.status !== 'ACTIVE') {
                      alert('Verification is required to match programs and submit applications. Please go to the "Verification" section.');
                      return;
                    }
                    setIsMatchingPrograms(true);
                  }} 
                  className="px-6 py-2.5 bg-[#4338CA] text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  Match Programs
                </button>
              )}
              {user.role !== 'institution' && (
                <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">Edit Profile</button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-[#4338CA] text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"><Save size={16}/> Save Changes</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
                <User size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
            </div>
            
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4338CA] shrink-0">
                    <User size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                    {student.country && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe size={14} className="text-gray-400" />
                        <span>{student.country}</span>
                      </div>
                    )}
                    {student.dob && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{format(parseISO(student.dob), 'dd.MM.yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {student.passportNumber && (
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Passport</div>
                      <div className="text-sm font-bold text-gray-900">{student.passportNumber}</div>
                    </div>
                  )}
                  {student.visaStatus && (
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Visa Status</div>
                      <div className="text-sm font-bold text-gray-900">{student.visaStatus}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">First Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="First Name"
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Middle Name</label>
                  <input 
                    type="text" 
                    value={formData.middleName}
                    onChange={(e) => handleChange('middleName', e.target.value)}
                    placeholder="Middle Name"
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Last Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Last Name"
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-700">Nationality <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.nationality}
                      onChange={(e) => handleChange('nationality', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm appearance-none"
                    >
                      <option value="">Select country</option>
                      {getNames().map(country => <option key={country} value={country}>{country}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <DatePicker
                      selected={formData.dob ? parseISO(formData.dob) : null}
                      onChange={(date) => handleChange('dob', date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
                      dateFormat="dd.MM.yyyy"
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                      placeholderText="Select date"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Passport Number</label>
                  <input 
                    type="text" 
                    value={formData.passportNumber}
                    onChange={(e) => handleChange('passportNumber', e.target.value)}
                    placeholder="Passport Number"
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Passport Expiry</label>
                  <div className="relative">
                    <DatePicker
                      selected={formData.passportExpiry ? parseISO(formData.passportExpiry) : null}
                      onChange={(date) => handleChange('passportExpiry', date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
                      dateFormat="dd.MM.yyyy"
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                      placeholderText="Select date"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Visa Status</label>
                  <input 
                    type="text" 
                    value={formData.visaStatus}
                    onChange={(e) => handleChange('visaStatus', e.target.value)}
                    placeholder="Visa Status"
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Academic Background */}
          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
                <BookOpen size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Academic Background</h2>
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                {student.educationLevel && (
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <span className="text-sm font-medium text-gray-600">Education Level</span>
                    <span className="text-sm font-bold text-gray-900">{student.educationLevel}</span>
                  </div>
                )}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Language Proficiency</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(formData.languageLevels || {}).map(([lang, level]: [string, any]) => (
                      <div key={lang} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <div className="text-xs font-bold text-gray-500 mb-1">{lang}</div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= level ? 'bg-indigo-500' : 'bg-gray-100'}`}></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Education Level <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.educationLevel}
                      onChange={(e) => handleChange('educationLevel', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm appearance-none"
                    >
                      <option value="">Select education level</option>
                      <option value="high-school">High School</option>
                      <option value="bachelor">Bachelor's</option>
                      <option value="master">Master's</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-700">Language Proficiency</label>
                  <div className="space-y-4">
                    {['Portuguese', 'English', 'Spanish'].map((lang) => (
                      <div key={lang} className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-700">{lang}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] uppercase font-bold text-gray-400">None</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                              <button 
                                key={i} 
                                type="button"
                                onClick={() => {
                                  const newProf = { ...formData.languageLevels, [lang]: i };
                                  handleChange('languageLevels', newProf);
                                }}
                                className={`w-6 h-1.5 rounded-full transition-colors ${i <= (formData.languageLevels as any)?.[lang] ? 'bg-indigo-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                              ></button>
                            ))}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Native</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Program Preferences & Contact */}
        <div className="space-y-6">
          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
                <Globe size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Program Preferences</h2>
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                {student.desiredField && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Desired Field</div>
                    <div className="text-sm font-bold text-gray-900">{student.desiredField}</div>
                  </div>
                )}
                {student.preferredSpecialization && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Specialization</div>
                    <div className="text-sm font-bold text-gray-900">{student.preferredSpecialization}</div>
                  </div>
                )}
                {student.budget > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Budget (Annual)</div>
                    <div className="text-sm font-bold text-[#4338CA]">${student.budget?.toLocaleString('en-US')}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {student.startDate && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Start Date</div>
                      <div className="text-sm font-bold text-gray-900">{student.startDate}</div>
                    </div>
                  )}
                  {student.destination && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Destination Country</div>
                      <div className="text-sm font-bold text-gray-900">{student.destination}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Desired Field</label>
                  <input 
                    type="text" 
                    value={formData.desiredField}
                    onChange={(e) => handleChange('desiredField', e.target.value)}
                    placeholder="Enter fields..."
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Preferred Specialization <span className="text-red-500">*</span></label>
                  <SpecializationSelector 
                    selected={formData.preferredSpecialization}
                    onChange={(selected) => handleChange('preferredSpecialization', selected)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Start Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm appearance-none"
                    >
                      <option value="">Select semester</option>
                      <option value="fall-2026">Fall 2026</option>
                      <option value="spring-2027">Spring 2027</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Study Destination <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.destination}
                      onChange={(e) => handleChange('destination', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm appearance-none"
                    >
                      <option value="">Select country</option>
                      <option value="canada">Canada</option>
                      <option value="uk">UK</option>
                      <option value="usa">USA</option>
                      <option value="china">China</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700">Annual Budget</label>
                    <span className="text-sm font-bold text-[#4338CA]">${formData.budget?.toLocaleString('en-US') || '0'}</span>
                  </div>
                  <div className="relative px-2">
                    <input 
                      type="range" 
                      min="5000" 
                      max="50000" 
                      step="1000"
                      value={formData.budget || 5000}
                      onChange={(e) => handleChange('budget', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#4338CA]"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
                <Phone size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                {student.whatsapp && (
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl">
                    <MessageCircle className="text-green-500" size={20} />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-green-600/60 mb-0.5">WhatsApp</div>
                      <div className="text-sm font-bold text-gray-900">{student.whatsapp}</div>
                    </div>
                  </div>
                )}
                {student.email && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                    <Mail className="text-blue-500" size={20} />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-blue-600/60 mb-0.5">Email</div>
                      <div className="text-sm font-bold text-gray-900">{student.email}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">WhatsApp Number</label>
                  <PhoneInput
                    country={student.country?.toLowerCase() === 'russia' ? 'ru' : 'us'}
                    value={formData.whatsapp}
                    onChange={(phone) => handleChange('whatsapp', phone)}
                    inputClass="!w-full !px-4 !py-3 !bg-gray-50 !border-transparent !rounded-xl !focus:bg-white !focus:border-indigo-100 !outline-none !transition-all !text-sm !h-auto !pl-12"
                    containerClass="!w-full"
                    buttonClass="!bg-gray-50 !border-transparent !rounded-l-xl !border-r-0 !pl-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="student@email.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Documents Section */}
      <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
              <FileText size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Documents</h2>
          </div>
          {isEditing && (
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-[#4338CA] rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
              <UploadCloud size={14} />
              Upload Document
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-100 rounded-2xl flex items-center gap-4 group hover:border-indigo-100 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Passport.pdf</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">Passport • 1.2 MB</div>
            </div>
          </div>
          <div className="p-4 border border-gray-100 rounded-2xl flex items-center gap-4 group hover:border-indigo-100 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Transcript_HS.pdf</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">Transcript • 2.4 MB</div>
            </div>
          </div>
        </div>
      </section>

      {/* Applications History */}
      {user.role !== 'institution' && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-gray-900">Application History</h2>
            <button className="text-sm text-[#4338CA] font-bold hover:underline">View All →</button>
          </div>
          <div className="bg-white border-y border-gray-200 -mx-8 px-8">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-4 font-bold">Institution</th>
                  <th className="py-4 font-bold">Program</th>
                  <th className="py-4 font-bold">Status</th>
                  <th className="py-4 font-bold">Submitted</th>
                  <th className="py-4 font-bold">Updated</th>
                  <th className="py-4 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No applications found for this student.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-[#4338CA] shrink-0">
                            <BookOpen size={14} />
                          </div>
                          <span className="font-bold text-gray-900">{app.institution}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-600">{app.program}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          app.status === 'Approved' || app.status === 'Accepted' ? 'bg-green-50 text-green-600' : 
                          app.status === 'Reviewing' || app.status === 'Under Review' ? 'bg-blue-50 text-blue-600' : 
                          app.status === 'Action Required' ? 'bg-amber-50 text-amber-600' : 
                          app.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-600">{app.date}</td>
                      <td className="py-4 text-gray-600">{app.updated_at}</td>
                      <td className="py-4 text-[#4338CA] font-bold cursor-pointer hover:underline" onClick={() => setSelectedApplication(app)}>Details</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentDetail;
