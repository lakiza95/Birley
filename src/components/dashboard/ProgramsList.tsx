import React, { useState, useEffect, useRef } from 'react';
import { School, Search, Plus, Filter, MoreVertical, CheckCircle2, Clock, Users, GraduationCap, X, Save, AlertCircle, ChevronDown, Edit2, BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';
import { FilterModal } from './FilterModal';
import { supabase } from '../../supabase';
import { getNames } from 'country-list';
import { SPECIALIZATIONS } from '../../constants/specializations';
import { UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { getRoleTheme } from '../../utils/theme';

interface ProgramsListProps {
  user: UserProfile;
  onProgramSelect?: (program: any) => void;
}

import { COUNTRIES } from '../../constants/countries';
import { DOCUMENT_TYPES } from '../../constants/documents';
import SpecializationSelector from './SpecializationSelector';
import MultiSelect from './MultiSelect';
import ProgramModal from './ProgramModal';

const ProgramsList: React.FC<ProgramsListProps> = ({ user, onProgramSelect }) => {
  const theme = getRoleTheme(user.role);
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'pending'>('all');
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [programToApprove, setProgramToApprove] = useState<string | null>(null);
  const [commission, setCommission] = useState<string>('0');

  const clean = (val: any) => {
    if (val === null || val === undefined || val === 'undefined' || val === 'null' || val === '') return '';
    return String(val).trim();
  };

  const isReferralActive = (progInstitutionId: string) => {
    if (user.role !== 'partner') return false;
    if (!user.referred_by_institution_id || user.referred_by_institution_id !== progInstitutionId) return false;
    if (!user.createdAt) return false;
    
    const registrationDate = new Date(user.createdAt);
    const oneYearLater = new Date(registrationDate);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    return new Date() <= oneYearLater;
  };

  useEffect(() => {
    if (user.role === 'institution') {
      fetchInstitutionId();
    }
    fetchPrograms();
  }, [user, activeFilterTab]);

  useEffect(() => {
  }, []);

  const fetchInstitutionId = async () => {
    if (!user?.email) {
      console.warn('No user email available to fetch institution ID');
      return;
    }
    
    try {
      console.log('Fetching institution ID for email:', user.email.toLowerCase());
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('contact_email', user.email.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error fetching institution record:', error);
        throw error;
      }
      
      if (data) {
        console.log('Found institution ID:', data.id);
        setInstitutionId(data.id);
      } else if (user.role === 'institution') {
        console.warn('No institution found for email:', user.email.toLowerCase());
        // Auto-create basic institution record if it's missing for an institution user
        const { data: newInst, error: createError } = await supabase
          .from('institutions')
          .insert({
            name: user.agency || `${user.firstName || 'My'} Institution`,
            contact_email: user.email.toLowerCase(),
            country: user.country || 'Unknown',
            city: user.city || 'Unknown',
            status: 'Active',
            type: 'Private'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error auto-creating institution:', createError);
        } else if (newInst) {
          console.log('Auto-created institution record:', newInst.id);
          setInstitutionId(newInst.id);
        }
      }
    } catch (err) {
      console.error('Error fetching institution id:', err);
    }
  };

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('programs').select(`
        *,
        institutions (*)
      `);
      
      if (user.role === 'institution') {
        const { data: instData } = await supabase
          .from('institutions')
          .select('id')
          .eq('contact_email', user.email.toLowerCase())
          .maybeSingle();
        
        if (instData) {
          query = query.eq('institution_id', instData.id);
        } else {
          setPrograms([]);
          setIsLoading(false);
          return;
        }
      } else if (user.role === 'partner') {
        query = query.eq('status', 'Active');
      }

      if (activeFilterTab === 'pending') {
        query = query.eq('status', 'Pending');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClick = (id: string) => {
    setProgramToApprove(id);
    setCommission('0');
    setIsApprovalModalOpen(true);
  };

  const submitApproval = async () => {
    if (!programToApprove) return;
    
    try {
      const { error } = await supabase
        .from('programs')
        .update({ 
          status: 'Active',
          commission: parseFloat(commission) || 0
        })
        .eq('id', programToApprove);

      if (error) throw error;
      fetchPrograms();
      setIsApprovalModalOpen(false);
      setProgramToApprove(null);
    } catch (err) {
      console.error('Error approving program:', err);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this program?')) return;
    try {
      const { error } = await supabase
        .from('programs')
        .update({ status: 'Rejected' })
        .eq('id', id);

      if (error) throw error;
      fetchPrograms();
    } catch (err) {
      console.error('Error rejecting program:', err);
    }
  };

  const handleEdit = (program: any) => {
    setEditingProgram(program);
    setIsModalOpen(true);
  };

  const translateLevel = (level: string) => {
    if (level === 'Vacation') return 'Vocational';
    return level;
  };

  const translateDuration = (duration: string) => {
    if (duration.includes('to')) {
      return duration.replace('to', '—');
    }
    return duration;
  };

  const translateIntake = (intake: string) => {
    const months: { [key: string]: string } = {
      'январь': 'January',
      'февраль': 'February',
      'март': 'March',
      'апрель': 'April',
      'май': 'May',
      'июнь': 'June',
      'июль': 'July',
      'август': 'August',
      'сентябрь': 'September',
      'октябрь': 'October',
      'ноябрь': 'November',
      'декабрь': 'December'
    };
    const lowerIntake = intake.toLowerCase();
    return months[lowerIntake] || intake;
  };

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const filteredPrograms = programs.filter(prog => {
    const matchesSearch = 
      clean(prog.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clean(prog.level)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clean(prog.specialization)?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'status') return prog.status === value;
      if (key === 'level') return prog.level === value;
      if (key === 'language') return prog.language === value;
      if (key === 'country') return prog.country?.toLowerCase().includes(value.toLowerCase());
      if (key === 'specialization') return prog.specialization?.toLowerCase().includes(value.toLowerCase());
      if (key === 'tuition_min') return prog.tuitionFee >= Number(value);
      if (key === 'tuition_max') return prog.tuitionFee <= Number(value);
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  const isUnverifiedRecruiter = user.role === 'partner' && user.status !== 'ACTIVE';
  const displayPrograms = isUnverifiedRecruiter ? filteredPrograms.slice(0, 3) : filteredPrograms;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {user.role === 'partner' ? 'Program Catalog' : 'Our Programs'}
            </h1>
            <p className="text-gray-500 text-sm mt-1 max-w-md">
              {user.role === 'partner' 
                ? 'Explore and search for the best educational programs for your students.'
                : "Manage and update your institution's educational offerings, track vacancies, and monitor program status."}
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-6">
            {user.role === 'institution' && (
              <button 
                onClick={() => {
                  if (!institutionId) {
                    setError('Your institution profile is not fully set up. Please wait or contact support.');
                    fetchInstitutionId();
                    return;
                  }
                  setIsModalOpen(true);
                }}
                style={{ backgroundColor: theme.primary }}
                className="text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                <Plus size={18} />
                <span>Add New Program</span>
              </button>
            )}
            {user.role !== 'partner' && (
              <>
                <div className="h-10 w-px bg-gray-100 mx-2 hidden md:block" />
                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{programs.filter(p => p.status === 'Active').length} Active</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{programs.filter(p => p.status !== 'Active').length} Pending</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-indigo-100 transition-colors">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
            >
              <Users size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                {programs.reduce((acc, p) => acc + (parseInt(p.vacancies) || 0), 0)}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {user.role === 'partner' ? 'Available Vacancies' : 'Total Vacancies'}
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-indigo-100 transition-colors">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
            >
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{programs.length}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {user.role === 'partner' ? 'Available Programs' : 'Total Programs'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {isUnverifiedRecruiter && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Verification Required</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                As an unverified recruiter, you can only see up to 3 programs. 
                Please complete your profile verification to unlock the full list.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {(user.role === 'admin' || user.role === 'institution') && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
              <button
                onClick={() => setActiveFilterTab('pending')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                  activeFilterTab === 'pending'
                    ? 'bg-amber-50 text-amber-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Pending Verification
              </button>
              <button
                onClick={() => setActiveFilterTab('all')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                  activeFilterTab === 'all'
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                All Programs
              </button>
            </div>
          )}
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, level or specialization..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all border font-bold text-xs shadow-sm ${Object.keys(activeFilters).length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 bg-white border-gray-200'}`}
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {user.role === 'partner' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-sm text-gray-400 font-medium">
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Loading programs...
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-gray-400 font-medium">
                <Search size={32} className="mx-auto mb-3 text-gray-300" />
                No programs found matching your search.
              </div>
            ) : (
              displayPrograms.map((prog) => (
                <div 
                  key={prog.id} 
                  onClick={() => onProgramSelect && onProgramSelect(prog)}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex flex-col cursor-pointer"
                >
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
                        >
                          <GraduationCap size={20} />
                        </div>
                        {isReferralActive(prog.institution_id) && (
                          <div className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border border-blue-100">
                            0% Platform Fee
                          </div>
                        )}
                      </div>
                      {prog.commission > 0 && (
                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider text-right">
                          <div className="text-emerald-600">
                            Earn {Math.round((parseFloat(prog.tuition_fee || '0') * parseFloat(prog.commission || '0')) / 100).toLocaleString()} {prog.currency}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {clean(prog.name) || '—'}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-4 line-clamp-1">
                      {prog.institutions?.name || 'Unknown Institution'}
                    </p>

                    <div className="space-y-2 mb-4 flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <BookOpen size={14} className="text-gray-400" />
                        <span className="truncate">{clean(prog.specialization) || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock size={14} className="text-gray-400" />
                        <span>{translateDuration(clean(prog.duration)) || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users size={14} className="text-gray-400" />
                        <span>{prog.vacancies} Spots Available</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{prog.tuition_fee} {prog.currency}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Tuition Fee</span>
                      </div>
                      <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 group-hover:gap-1.5 transition-all bg-blue-50 px-3 py-1.5 rounded-lg">
                        Details <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-xl shadow-indigo-900/5">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[1100px]">
                <thead>
                  <tr className="text-[11px] text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 bg-gray-50/30">
                    <th className="px-6 py-5 font-black">Program Details</th>
                    <th className="px-6 py-5 font-black">Specialization</th>
                    <th className="px-6 py-5 font-black">Level</th>
                    <th className="px-6 py-5 font-black">Duration</th>
                    <th className="px-6 py-5 font-black">Intake</th>
                    <th className="px-6 py-5 font-black">Status</th>
                    <th className="px-6 py-5 font-black text-right">Tuition</th>
                    <th className="px-6 py-5 font-black text-right">Spots</th>
                    {user.role === 'admin' && <th className="px-6 py-5 font-black text-right">Commission</th>}
                    <th className="px-6 py-5 font-black text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={user.role === 'admin' ? 8 : 7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                          <span className="text-gray-400 text-xs font-medium tracking-wide">Loading programs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={user.role === 'admin' ? 8 : 7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Search size={48} className="text-gray-300" />
                          <span className="text-gray-500 text-sm font-bold">No programs found matching your search</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayPrograms.map((prog) => (
                      <tr 
                        key={prog.id} 
                        onClick={() => onProgramSelect && onProgramSelect(prog)}
                        className="hover:bg-indigo-50/30 transition-all group cursor-pointer"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110"
                              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
                            >
                              <GraduationCap size={22} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-gray-900 text-sm truncate leading-none mb-1" title={clean(prog.name) || '—'}>
                                {clean(prog.name) || '—'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  {(Array.isArray(prog.institutions) ? prog.institutions[0]?.name : prog.institutions?.name) || 'Unknown Institution'}
                                </span>
                                {isReferralActive(prog.institution_id) && (
                                  <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-100">
                                    0% Platform Fee
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="max-w-[180px]">
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg truncate block" title={clean(prog.specialization) || '—'}>
                              {clean(prog.specialization) || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-black text-gray-700">{translateLevel(clean(prog.level)) || '—'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-600">{translateDuration(clean(prog.duration)) || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-indigo-400" />
                            <span className="text-xs font-black text-indigo-600">{translateIntake(clean(prog.intake)) || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest font-black whitespace-nowrap ${
                            prog.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                            prog.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {prog.status === 'Active' ? <CheckCircle2 size={12} /> : 
                             prog.status === 'Rejected' ? <AlertCircle size={12} /> :
                             <Clock size={12} />}
                            {prog.status === 'Active' ? 'Active' : 
                             prog.status === 'Rejected' ? 'Rejected' :
                             'Pending'}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-gray-900">{prog.tuition_fee} {prog.currency}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Per Program</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-sm font-black text-gray-900">{prog.vacancies}</span>
                        </td>
                        {user.role === 'admin' && (
                          <td className="px-6 py-5 text-right">
                            {prog.commission > 0 ? (
                              <span className="text-sm font-black text-emerald-600">{prog.commission}%</span>
                            ) : (
                              <span className="text-sm font-bold text-gray-400">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {user.role === 'admin' && prog.status === 'Pending' && (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveClick(prog.id);
                                  }}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(prog.id);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Reject"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            )}
                            {(user.role === 'admin' || user.role === 'institution') && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(prog);
                                }}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Edit Program"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onProgramSelect && onProgramSelect(prog);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="View Details"
                            >
                              <BookOpen size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ProgramModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProgram(null);
        }}
        user={user}
        program={editingProgram}
        institutionId={institutionId}
        onSuccess={fetchPrograms}
      />

      {/* Approval Modal */}
      <AnimatePresence>
        {isApprovalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApprovalModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Approve Program</h2>
                <button 
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Recruiter Commission (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4338CA] focus:border-transparent transition-all outline-none"
                      placeholder="e.g. 10"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Set the commission percentage that recruiters will receive for successful enrollments in this program.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitApproval}
                    className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Approve Program
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApply={setActiveFilters}
        fields={[
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Rejected'] },
          { key: 'level', label: 'Level', type: 'select', options: ['Education', 'Bachelor', 'Master', 'PhD', 'Language Course'] },
          { key: 'language', label: 'Language', type: 'select', options: ['English', 'Spanish', 'French', 'German', 'Italian'] },
          { key: 'country', label: 'Country', type: 'select', options: getNames() },
          { key: 'specialization', label: 'Program', type: 'select', options: Object.keys(SPECIALIZATIONS) },
          { key: 'tuition', label: 'Tuition Cost', type: 'range' }
        ]}
      />
    </div>
  );
};

export default ProgramsList;
