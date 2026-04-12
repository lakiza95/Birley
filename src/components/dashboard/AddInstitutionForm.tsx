import React, { useState, useMemo, useCallback } from 'react';
import { X, Building2, Globe, FileText, Image as ImageIcon, CheckCircle2, Mail, User, Link as LinkIcon, MapPin, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'motion/react';
import Select from 'react-select';
import countryList from 'react-select-country-list';

interface AddInstitutionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddInstitutionForm: React.FC<AddInstitutionFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    website: '',
    contact_email: '',
    contact_first_name: '',
    contact_last_name: '',
    type: 'Public',
    description: '',
    logo_url: '',
    school_commission_rate: 0,
    recruiter_commission_rate: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(() => countryList().getData(), []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, this might fail. 
        // In a real app, we'd ensure the bucket exists.
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      setError('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
      setDragActive(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (value: any) => {
    setFormData(prev => ({ ...prev, country: value.label }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('institutions')
        .insert([formData]);

      if (submitError) throw submitError;

      onSuccess();
      onClose();
      setFormData({
        name: '',
        country: '',
        city: '',
        website: '',
        contact_email: '',
        contact_first_name: '',
        contact_last_name: '',
        type: 'Language School',
        description: '',
        logo_url: '',
        school_commission_rate: 0,
        recruiter_commission_rate: 0
      });
    } catch (err: any) {
      console.error('Error adding institution:', err);
      setError(err.message || 'Failed to add institution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#F9FAFB',
      borderColor: '#E5E7EB',
      borderRadius: '0.5rem',
      padding: '1px',
      fontSize: '0.875rem',
      '&:hover': {
        borderColor: '#4338CA'
      }
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#4338CA' : state.isFocused ? '#EEF2FF' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      fontSize: '0.875rem'
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-[#4338CA]">
                  <Building2 size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Add New Institution</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2">
                  <div className="w-1 h-1 bg-red-600 rounded-full" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 size={10} />
                    Institution Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Oxford University"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Globe size={10} />
                      Country
                    </label>
                    <Select
                      options={options}
                      onChange={handleCountryChange}
                      placeholder="Select country..."
                      styles={customSelectStyles}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={10} />
                      City
                    </label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. London"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <LinkIcon size={10} />
                      Website
                    </label>
                    <input
                      required
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.ox.ac.uk"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Mail size={10} />
                      Contact Email
                    </label>
                    <input
                      required
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder="admissions@ox.ac.uk"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <User size={10} />
                      Contact First Name
                    </label>
                    <input
                      required
                      type="text"
                      name="contact_first_name"
                      value={formData.contact_first_name}
                      onChange={handleChange}
                      placeholder="John"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <User size={10} />
                      Contact Last Name
                    </label>
                    <input
                      required
                      type="text"
                      name="contact_last_name"
                      value={formData.contact_last_name}
                      onChange={handleChange}
                      placeholder="Doe"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Institution Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm appearance-none"
                    >
                      <option value="Language School">Language School</option>
                      <option value="Training Center">Training Center</option>
                      <option value="Vocational College">Vocational College</option>
                      <option value="College">College</option>
                      <option value="Institute">Institute</option>
                      <option value="University">University</option>
                      <option value="Academy">Academy</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      School Commission Rate (%)
                    </label>
                    <input
                      required
                      type="number"
                      name="school_commission_rate"
                      value={formData.school_commission_rate}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Recruiter Commission Rate (%)
                    </label>
                    <input
                      required
                      type="number"
                      name="recruiter_commission_rate"
                      value={formData.recruiter_commission_rate}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon size={10} />
                    Institution Logo
                  </label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative group cursor-pointer transition-all duration-200 ${
                        dragActive 
                          ? 'border-[#4338CA] bg-indigo-50/50' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'
                      } border-2 border-dashed rounded-xl overflow-hidden h-[38px] flex items-center justify-center`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      {isUploading ? (
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-xs font-medium">Uploading...</span>
                        </div>
                      ) : formData.logo_url ? (
                        <div className="flex items-center gap-2 w-full px-3">
                          <img 
                            src={formData.logo_url} 
                            alt="Logo preview" 
                            className="w-6 h-6 rounded object-contain bg-white border border-gray-100"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-xs text-gray-600 truncate flex-1">Logo uploaded</span>
                          <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500">
                          <Upload size={14} />
                          <span className="text-xs">Drag & drop or click to upload</span>
                        </div>
                      )}
                    </div>
                  </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={10} />
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief description of the institution..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#4338CA] focus:bg-white transition-all outline-none text-sm resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#4338CA] text-white rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {isSubmitting ? 'Adding...' : 'Add Institution'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddInstitutionForm;
