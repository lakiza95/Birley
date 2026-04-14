import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  BookOpen, 
  Users, 
  Globe, 
  Building2, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
  Award,
  Library,
  Coffee,
  Plus,
  Loader2,
  Clock,
  Save,
  User,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabase';

import { UserProfile } from '../../types';
import StudentSelectionModal from './StudentSelectionModal';

interface UniversityCardProps {
  school: any;
  user: UserProfile;
  onClose: () => void;
  initialSelectedProgramId?: string;
}

const UniversityCard: React.FC<UniversityCardProps> = ({ school, user, onClose, initialSelectedProgramId }) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingUniversity, setIsEditingUniversity] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [universityEditFormData, setUniversityEditFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingUniversity, setIsSavingUniversity] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    if (school?.id) {
      fetchPrograms();
    }
  }, [school?.id]);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('programs')
        .select('*')
        .eq('institution_id', school.id);
      
      if (user.role !== 'admin' && user.role !== 'institution') {
        query = query.eq('status', 'Active');
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      setPrograms(data || []);
      
      if (initialSelectedProgramId && data) {
        const initialProgram = data.find(p => p.id === initialSelectedProgramId);
        if (initialProgram) {
          setSelectedProgram(initialProgram);
        }
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditFormData({ ...selectedProgram });
    setIsEditing(true);
  };

  const handleEditUniversity = () => {
    setUniversityEditFormData({ ...school });
    setIsEditingUniversity(true);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadLogo = async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setUniversityEditFormData((prev: any) => ({ ...prev, logo_url: publicUrl }));
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      setDragActive(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadLogo(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadLogo(e.target.files[0]);
    }
  };

  const handleSaveUniversity = async () => {
    if (!universityEditFormData) return;
    setIsSavingUniversity(true);
    try {
      const { error } = await supabase
        .from('institutions')
        .update({
          name: universityEditFormData.name,
          country: universityEditFormData.country,
          city: universityEditFormData.city,
          type: universityEditFormData.type,
          description: universityEditFormData.description,
          logo_url: universityEditFormData.logo_url,
          contact_email: universityEditFormData.contact_email,
          contact_first_name: universityEditFormData.contact_first_name,
          contact_last_name: universityEditFormData.contact_last_name,
          website: universityEditFormData.website
        })
        .eq('id', school.id);

      if (error) throw error;
      
      setIsEditingUniversity(false);
      window.location.reload(); 
    } catch (err) {
      console.error('Error saving university:', err);
      alert('Failed to save university changes.');
    } finally {
      setIsSavingUniversity(false);
    }
  };

  const handleSave = async () => {
    if (!editFormData) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('programs')
        .update({
          name: editFormData.name,
          level: editFormData.level,
          duration: editFormData.duration,
          intake: editFormData.intake,
          tuition_fee: parseFloat(editFormData.tuition_fee) || 0,
          currency: editFormData.currency,
          vacancies: parseInt(editFormData.vacancies) || 0,
          description: editFormData.description
        })
        .eq('id', selectedProgram.id);

      if (error) throw error;
      
      setSelectedProgram({ ...editFormData });
      setIsEditing(false);
      fetchPrograms();
    } catch (err) {
      console.error('Error saving program:', err);
      alert('Failed to save program changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!school) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-4"
    >
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={selectedProgram ? () => { setSelectedProgram(null); setIsEditing(false); } : onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-[#4338CA] font-bold transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center group-hover:border-indigo-100 shadow-sm">
            {selectedProgram ? <ArrowLeft size={14} /> : <X size={14} className="rotate-0 group-hover:rotate-90 transition-transform" />}
          </div>
          <span className="text-xs">{selectedProgram ? 'Back to Programs' : 'Back to List'}</span>
        </button>
        
        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            selectedProgram ? (
              <button 
                onClick={isEditing ? handleSave : handleEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-[#4338CA] text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? <Save size={16} /> : <Plus size={16} />)}
                <span>{isEditing ? 'Save Changes' : 'Edit'}</span>
              </button>
            ) : (
              <button 
                onClick={isEditingUniversity ? handleSaveUniversity : handleEditUniversity}
                disabled={isSavingUniversity}
                className="flex items-center gap-1.5 bg-[#4338CA] text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50"
              >
                {isSavingUniversity ? <Loader2 size={16} className="animate-spin" /> : (isEditingUniversity ? <Save size={16} /> : <Plus size={16} />)}
                <span>{isEditingUniversity ? 'Save Changes' : 'Edit'}</span>
              </button>
            )
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedProgram ? (
          <motion.div
            key="program-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8"
          >
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Program Name</label>
                        <input 
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors font-bold text-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level</label>
                        <input 
                          type="text"
                          value={editFormData.level}
                          onChange={(e) => setEditFormData({ ...editFormData, level: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors text-xs font-bold"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold text-brand bg-brand/10 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                        {selectedProgram.level}
                      </span>
                      <h1 className="text-3xl font-bold text-gray-900 leading-tight">{selectedProgram.name}</h1>
                    </>
                  )}
                </div>
                <div className="text-right">
                  {isEditing ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost</label>
                      <input 
                        type="number"
                        value={editFormData.tuition_fee}
                        onChange={(e) => setEditFormData({ ...editFormData, tuition_fee: e.target.value })}
                        className="w-32 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors font-bold text-right"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedProgram.tuition_fee ? `$${selectedProgram.tuition_fee.toLocaleString('en-US')}` : 'On request'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cost per year</p>
                      {selectedProgram.commission > 0 && (
                        <div className="mt-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100 flex items-center gap-1">
                          <span>{selectedProgram.commission}% Commission</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-50">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Duration</p>
                  <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <Clock size={16} className="text-brand" />
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editFormData.duration}
                        onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                        className="w-full bg-transparent border-b border-gray-200 outline-none focus:border-brand"
                      />
                    ) : (
                      <span>{selectedProgram.duration}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Start Date</p>
                  <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <CheckCircle2 size={16} className="text-brand" />
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editFormData.intake}
                        onChange={(e) => setEditFormData({ ...editFormData, intake: e.target.value })}
                        className="w-full bg-transparent border-b border-gray-200 outline-none focus:border-brand"
                      />
                    ) : (
                      <span>{selectedProgram.intake || 'September'}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vacancies</p>
                  <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <Users size={16} className="text-brand" />
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editFormData.vacancies}
                        onChange={(e) => setEditFormData({ ...editFormData, vacancies: e.target.value })}
                        className="w-full bg-transparent border-b border-gray-200 outline-none focus:border-brand"
                      />
                    ) : (
                      <span>{selectedProgram.vacancies || '50'} seats</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Currency</p>
                  <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <Globe size={16} className="text-brand" />
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editFormData.currency}
                        onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                        className="w-full bg-transparent border-b border-gray-200 outline-none focus:border-brand"
                      />
                    ) : (
                      <span>{selectedProgram.currency || 'USD'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Program Description</h3>
                {isEditing ? (
                  <textarea 
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-brand transition-colors text-xs leading-relaxed min-h-[150px] resize-none"
                    placeholder="Enter program description..."
                  />
                ) : (
                  <p className="text-gray-600 leading-relaxed">
                    {selectedProgram.description || 'Detailed program description is being populated. Please contact the admissions office for detailed information about courses, requirements, and career prospects.'}
                  </p>
                )}
              </div>

              {user.role !== 'admin' && (
                <div className="pt-6 flex gap-4">
                  <button 
                    onClick={() => {
                      if (user.status !== 'ACTIVE') {
                        alert('Verification is required to submit an application. Please go to the "Verification" section.');
                        return;
                      }
                      setIsApplyModalOpen(true);
                    }}
                    className="w-full bg-[#4338CA] text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Start Application
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="university-detail"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8"
          >
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Structured Header */}
              <div className="flex flex-col md:flex-row md:items-center gap-6 pb-8 border-b border-gray-50">
                <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {isEditingUniversity ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative group cursor-pointer transition-all duration-200 w-full h-full flex flex-col items-center justify-center p-2 ${
                        dragActive 
                          ? 'bg-brand/5 border-brand' 
                          : 'bg-gray-50 hover:bg-gray-100/50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      {isUploadingLogo ? (
                        <div className="flex flex-col items-center gap-1 text-brand">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-[8px] font-medium uppercase tracking-widest">Uploading</span>
                        </div>
                      ) : universityEditFormData.logo_url ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={universityEditFormData.logo_url} 
                            alt="Logo preview" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload size={16} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-gray-500">
                          <Upload size={16} />
                          <span className="text-[8px] font-bold uppercase tracking-widest text-center">Drop logo</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    school.logo_url ? (
                      <img 
                        src={school.logo_url} 
                        alt={school.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Building2 size={32} className="text-gray-300" />
                    )
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  {isEditingUniversity ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</label>
                        <input 
                          type="text"
                          value={universityEditFormData.name}
                          onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, name: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Country</label>
                        <input 
                          type="text"
                          value={universityEditFormData.country}
                          onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, country: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</label>
                        <input 
                          type="text"
                          value={universityEditFormData.city}
                          onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, city: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</label>
                        <input 
                          type="text"
                          value={universityEditFormData.type}
                          onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, type: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact First Name</label>
                        <input 
                          type="text"
                          value={universityEditFormData.contact_first_name}
                          onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, contact_first_name: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Last Name</label>
                        <input 
                          type="text"
                          value={universityEditFormData.contact_last_name}
                          onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, contact_last_name: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand transition-colors font-bold text-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
                        <span className="px-3 py-1 bg-brand/5 text-brand text-[10px] font-bold uppercase tracking-widest rounded-full">
                          {school.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-500">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <MapPin size={14} className="text-brand" />
                          <span>{[school.city, school.country].filter(Boolean).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <Globe size={14} className="text-brand" />
                          <span>{school.website || 'www.university.edu'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Stats & Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Stats */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{school.studentCount || '2.5k+'}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Students</p>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{programs.length}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Programs</p>
                    </div>
                  </div>
                  
                  {/* Description in structured card */}
                  <div className="col-span-2 p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</h3>
                    {isEditingUniversity ? (
                      <textarea 
                        value={universityEditFormData.description}
                        onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand transition-colors text-xs leading-relaxed min-h-[100px] resize-none"
                      />
                    ) : (
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {school.description || `${school.name} is a leading educational institution offering world-class education. The university creates an inclusive environment for the academic and personal growth of students from all over the world.`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Info Card */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contacts</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <User size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Contact Person</p>
                        <p className="text-xs font-bold text-gray-900">
                          {[school.contact_first_name, school.contact_last_name].filter(Boolean).join(' ') || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <Mail size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email</p>
                        {isEditingUniversity ? (
                          <input 
                            type="text"
                            value={universityEditFormData.contact_email}
                            onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, contact_email: e.target.value })}
                            className="w-full bg-transparent border-b border-gray-200 outline-none focus:border-brand text-xs font-bold"
                          />
                        ) : (
                          <p className="text-xs font-bold text-gray-900">{school.email || school.contact_email || 'admissions@university.edu'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <Phone size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Phone</p>
                        {isEditingUniversity ? (
                          <input 
                            type="text"
                            value={universityEditFormData.contact_phone}
                            onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, contact_phone: e.target.value })}
                            className="w-full bg-transparent border-b border-gray-200 outline-none focus:border-brand text-xs font-bold"
                          />
                        ) : (
                          <p className="text-xs font-bold text-gray-900">{school.phone || school.contact_phone || '+1 (000) 000-0000'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <Globe size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Website</p>
                        {isEditingUniversity ? (
                          <input 
                            type="text"
                            value={universityEditFormData.website}
                            onChange={(e) => setUniversityEditFormData({ ...universityEditFormData, website: e.target.value })}
                            className="w-full bg-transparent border-b border-gray-200 outline-none focus:border-brand text-xs font-bold"
                          />
                        ) : (
                          <p className="text-xs font-bold text-gray-900">{school.website || 'www.university.edu'}</p>
                        )}
                      </div>
                    </div>
                    
                    {!isEditingUniversity && (
                      <a 
                        href={school.website ? (school.website.startsWith('http') ? school.website : `https://${school.website}`) : '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#4338CA] text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        <ExternalLink size={16} />
                        <span>Visit Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Programs List Section */}
              <div className="pt-8 border-t border-gray-50 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Study Programs</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {programs.length} available
                    </span>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-brand animate-spin" />
                  </div>
                ) : programs.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-bold">No programs added yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {programs.map((prog) => (
                      <div 
                        key={prog.id} 
                        onClick={() => setSelectedProgram(prog)}
                        className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-indigo-100 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-brand group-hover:bg-brand/5 transition-colors">
                            <GraduationCap size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">{prog.name}</h4>
                              {prog.commission > 0 && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                                  {prog.commission}% Comm.
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prog.level}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-200" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prog.duration}</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-brand group-hover:bg-brand/10 transition-all">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isApplyModalOpen && selectedProgram && (
        <StudentSelectionModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          programId={selectedProgram.id}
          user={user}
        />
      )}
    </motion.div>
  );
};

export default UniversityCard;
