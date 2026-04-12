import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  User, 
  Calendar, 
  Globe, 
  BookOpen, 
  Phone, 
  ChevronDown,
  Info,
  Search,
  X,
  FileText,
  UploadCloud
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { parseISO, format, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import SpecializationSelector from './SpecializationSelector';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getNames } from 'country-list';
import { useDropzone } from 'react-dropzone';
import { SPECIALIZATIONS } from '../../constants/specializations';

const DOCUMENT_TYPES = [
  'Passport', 'Grade 8 Transcript', 'Grade 9 Transcript', 'Grade 10 Transcript', 'Grade 11 Transcript', 'Grade 12 Transcript',
  'Undergraduate Transcript', 'Postgraduate Transcript', 'Grade 8 Certificate', 'Grade 9 Certificate', 'Grade 10 Certificate',
  'Grade 11 Certificate', 'Grade 12 Certificate', 'Undergraduate Certificate', 'Postgraduate Certificate',
  'IELTS', 'TOEFL', 'PTE', 'Duolingo', 'GRE', 'GMAT', 'Resume', 'Statement of Purpose', 'Visa', 'Name Change Document', 'Other'
];

interface AddStudentFormProps {
  onCancel: () => void;
  onSave: (data: any) => void;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nationality: '',
    dob: '',
    passportNumber: '',
    passportExpiry: '',
    visaStatus: '',
    educationLevel: '',
    languageProficiency: {
      Portuguese: 2,
      English: 4,
      Spanish: 1
    },
    desiredField: '',
    preferredSpecialization: [] as string[],
    startDate: '',
    destination: '',
    budget: 15000,
    whatsapp: '',
    email: '',
    documents: [] as { file: File | null, type: string }[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specSearch, setSpecSearch] = useState('');

  useEffect(() => {
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocs = acceptedFiles.map(file => ({ file, type: DOCUMENT_TYPES[0] }));
    handleChange('documents', [...formData.documents, ...newDocs]);
  }, [formData.documents]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addDocument = () => {
    handleChange('documents', [...formData.documents, { file: null, type: DOCUMENT_TYPES[0] }]);
  };

  const updateDocument = (index: number, field: string, value: any) => {
    const newDocs = [...formData.documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    handleChange('documents', newDocs);
  };

  const removeDocument = (index: number) => {
    handleChange('documents', formData.documents.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.firstName && formData.lastName && formData.nationality && formData.dob && 
                      formData.educationLevel && formData.preferredSpecialization.length > 0 &&
                      formData.startDate && formData.destination;

  const totalRequired = 8;
  const currentCompleted = [
    formData.firstName, formData.lastName, formData.nationality, formData.dob, 
    formData.educationLevel, formData.preferredSpecialization.length > 0,
    formData.startDate, formData.destination
  ].filter(Boolean).length;

  const filteredSpecs = Object.entries(SPECIALIZATIONS).flatMap(([category, specs]) => 
    specs.length > 0 
      ? specs.filter(spec => spec.toLowerCase().includes(specSearch.toLowerCase())).map(spec => `${category} - ${spec}`)
      : category.toLowerCase().includes(specSearch.toLowerCase()) ? [category] : []
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Breadcrumbs & Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <button onClick={onCancel} className="hover:text-gray-600 transition-colors">My Students</button>
            <ChevronRight size={12} />
            <span className="text-gray-600 font-medium">Add New Student</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">New Student Profile</h1>
          <p className="text-sm text-gray-500">Fill in the student's details to find suitable schools and manage their applications.</p>
        </div>
        <button 
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            isFormValid && !isSubmitting
            ? 'bg-[#4338CA] text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            'Save and Find Schools →'
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
              <User size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">First Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Middle Name</label>
              <input 
                type="text" 
                value={formData.middleName}
                onChange={(e) => handleChange('middleName', e.target.value)}
                placeholder="Quincy"
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Last Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Doe"
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
                  <option value="">Select Country</option>
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
                  placeholderText="Select Date"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </section>

        {/* Academic Background */}
        <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
              <BookOpen size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Academic Background</h2>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Education Level <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={formData.educationLevel}
                  onChange={(e) => handleChange('educationLevel', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm appearance-none"
                >
                  <option value="">Select highest education level</option>
                  <option value="high-school">High School</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
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
                              const newProf = { ...formData.languageProficiency, [lang]: i };
                              handleChange('languageProficiency', newProf);
                            }}
                            className={`w-6 h-1.5 rounded-full transition-colors ${i <= (formData.languageProficiency as any)[lang] ? 'bg-indigo-500' : 'bg-gray-100 hover:bg-gray-200'}`}
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
        </section>

        {/* Program Preferences */}
        <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
              <Globe size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Program Preferences</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Desired Field of Study</label>
              <input 
                type="text" 
                value={formData.desiredField}
                onChange={(e) => handleChange('desiredField', e.target.value)}
                placeholder="Type and press Enter to add fields..."
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
              />
              <p className="text-[10px] text-gray-400 font-medium">Add multiple fields of interest</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Preferred Specialization <span className="text-red-500">*</span></label>
              <SpecializationSelector 
                selected={formData.preferredSpecialization}
                onChange={(selected) => handleChange('preferredSpecialization', selected)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Desired Start Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm appearance-none"
                  >
                    <option value="">Select Semester</option>
                    <option value="fall-2026">Fall 2026</option>
                    <option value="spring-2027">Spring 2027</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Destination Country <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    value={formData.destination}
                    onChange={(e) => handleChange('destination', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm appearance-none"
                  >
                    <option value="">Select Country</option>
                    <option value="canada">Canada</option>
                    <option value="uk">United Kingdom</option>
                    <option value="usa">USA</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700">Annual Budget</label>
                <span className="text-sm font-bold text-[#4338CA]">€{formData.budget.toLocaleString('en-US')}</span>
              </div>
              <div className="relative px-2">
                <input 
                  type="range" 
                  min="5000" 
                  max="50000" 
                  step="1000"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#4338CA]"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>€5,000</span>
                  <span>€50,000+</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Documents */}
        <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
              <Phone size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Contacts & Documents</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">WhatsApp Number</label>
              <PhoneInput
                country={'us'}
                value={formData.whatsapp}
                onChange={(phone) => handleChange('whatsapp', phone)}
                inputClass="!w-full !px-4 !py-3 !bg-gray-50 !border-transparent !rounded-xl !focus:bg-white !focus:border-indigo-100 !outline-none !transition-all !text-sm !h-auto !pl-12"
                containerClass="!w-full"
                buttonClass="!bg-gray-50 !border-transparent !rounded-l-xl !border-r-0 !pl-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Email (Optional)</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="student@email.com"
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <label className="text-xs font-bold text-gray-700">Documents</label>
            
            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="text-indigo-400" size={32} />
                <p className="text-sm font-medium text-gray-600">Drag and drop files here or click to select</p>
                <p className="text-xs text-gray-400">PDF, JPG, PNG supported</p>
              </div>
            </div>

            {formData.documents.length > 0 && (
              <div className="space-y-3">
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.file?.name || 'File'}</p>
                      <div className="relative mt-1">
                        <select
                          value={doc.type}
                          onChange={(e) => updateDocument(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-400 appearance-none pr-8"
                        >
                          {DOCUMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                      </div>
                    </div>
                    <button onClick={() => removeDocument(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="mt-12 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Info size={14} />
          <span>* Required fields — {currentCompleted} of {totalRequired} completed</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => isFormValid && onSave(formData)}
            className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${
              isFormValid 
              ? 'bg-[#4338CA] text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isFormValid}
          >
            Save and Find Suitable Schools →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentForm;
