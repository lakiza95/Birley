import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, MoreVertical, CheckCircle2, Clock, AlertCircle, Plus, Trash2, Edit2, ArrowRight, AlertTriangle } from 'lucide-react';
import { FilterModal } from './FilterModal';
import { supabase } from '../../supabase';
import { getNames } from 'country-list';
import AddInstitutionForm from './AddInstitutionForm';
import UniversityCard from './UniversityCard';
import ProgramsList from './ProgramsList';
import { AnimatePresence, motion } from 'motion/react';

import { UserProfile } from '../../types';

interface InstitutionsListProps {
  user: UserProfile;
}

const InstitutionsList: React.FC<InstitutionsListProps> = ({ user }) => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'institutions' | 'programs' | 'sla'>('institutions');

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setIsLoading(true);
    try {
      const { data: instData, error: instError } = await supabase
        .from('institutions')
        .select('*')
        .order('name', { ascending: true });

      if (instError) throw instError;

      // Calculate 5 days ago for SLA
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      // Fetch counts for students, applications, and SLA violations
      const institutionsWithCounts = await Promise.all((instData || []).map(async (inst) => {
        // Count students
        const { count: studentCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', inst.id)
          .eq('role', 'student');

        // Count applications
        const { count: appCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', inst.id);

        // Count SLA Violations (Applications in 'Submitted' status for > 5 days)
        const { count: overdueCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', inst.id)
          .eq('status', 'Submitted')
          .lt('created_at', fiveDaysAgo.toISOString());

        return {
          ...inst,
          studentCount: studentCount || 0,
          applicationCount: appCount || 0,
          overdueCount: overdueCount || 0
        };
      }));

      setInstitutions(institutionsWithCounts);
    } catch (err) {
      console.error('Error fetching institutions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this institution? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInstitutions(prev => prev.filter(inst => inst.id !== id));
    } catch (err) {
      console.error('Error deleting institution:', err);
      alert('Failed to delete institution');
    }
  };

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = 
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.country || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.city || '')?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'status') return inst.status === value;
      if (key === 'country') return inst.country?.toLowerCase().includes(value.toLowerCase());
      if (key === 'city') return inst.city?.toLowerCase().includes(value.toLowerCase());
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  const slaViolators = institutions.filter(inst => inst.overdueCount > 0).sort((a, b) => b.overdueCount - a.overdueCount);

  return (
    <div className="space-y-4">
      {user.role === 'admin' && !selectedInstitution && (
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit mb-6">
          <button
            onClick={() => setActiveTab('institutions')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'institutions'
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Institutions
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'programs'
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Programs
          </button>
          <button
            onClick={() => setActiveTab('sla')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'sla'
                ? 'bg-red-50 text-red-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <AlertTriangle size={14} />
            SLA Monitor
            {slaViolators.length > 0 && (
              <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[9px]">
                {slaViolators.length}
              </span>
            )}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedInstitution ? (
          <UniversityCard
            key="details"
            school={selectedInstitution}
            user={user}
            onClose={() => setSelectedInstitution(null)}
          />
        ) : activeTab === 'programs' ? (
          <motion.div
            key="programs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ProgramsList user={user} />
          </motion.div>
        ) : activeTab === 'sla' ? (
          <motion.div
            key="sla"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">SLA Monitor</h1>
                <p className="text-gray-500 text-xs">Track institutions with overdue applications (processing time &gt; 5 days).</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200 bg-gray-50">
                    <th className="py-3 px-6 font-bold">Institution</th>
                    <th className="py-3 px-6 font-bold">Location</th>
                    <th className="py-3 px-6 font-bold text-right">Total Applications</th>
                    <th className="py-3 px-6 font-bold text-right">Overdue Applications</th>
                    <th className="py-3 px-6 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">Loading data...</td>
                    </tr>
                  ) : slaViolators.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="text-gray-900 font-bold text-sm">All clear!</p>
                        <p className="text-gray-500 text-xs mt-1">No institutions have overdue applications.</p>
                      </td>
                    </tr>
                  ) : (
                    slaViolators.map((inst) => (
                      <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {inst.logo_url ? (
                              <img 
                                src={inst.logo_url} 
                                alt={inst.name} 
                                className="w-8 h-8 rounded-lg object-cover border border-gray-100"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
                                <Building2 size={16} />
                              </div>
                            )}
                            <span className="font-bold text-gray-900 text-sm">{inst.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-500">
                          {[inst.city, inst.country].filter(Boolean).join(', ')}
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-900 font-bold text-right">{inst.applicationCount}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black ${
                            inst.overdueCount > 10 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {inst.overdueCount}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {inst.overdueCount > 10 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-md">
                              <AlertCircle size={12} />
                              Critical
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                              <Clock size={12} />
                              Warning
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Educational Institutions</h1>
                <p className="text-gray-500 text-xs">Manage all educational institutions on the platform.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#4338CA] text-white px-4 py-2 rounded-lg font-medium text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-200"
              >
                <Plus size={16} />
                <span>Add Institution</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search institutions..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg focus:border-[#4338CA] transition-colors outline-none text-xs shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 relative">
                  <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`p-1.5 rounded-xl transition-colors border shadow-sm ${Object.keys(activeFilters).length > 0 ? 'bg-[#4338CA]/5 border-[#4338CA]/20 text-[#4338CA]' : 'text-gray-500 hover:bg-gray-50 bg-white border-gray-200'}`}
                  >
                    <Filter size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-white border-y border-gray-200 -mx-4 md:-mx-8 px-4 md:px-8 overflow-x-auto shadow-sm">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200">
                      <th className="py-3 font-bold">Institution</th>
                      <th className="py-3 font-bold">Location</th>
                      <th className="py-3 font-bold">Type</th>
                      <th className="py-3 font-bold text-right">Students</th>
                      <th className="py-3 font-bold text-right">Applications</th>
                      <th className="py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">Loading institutions...</td>
                      </tr>
                    ) : filteredInstitutions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">No institutions found.</td>
                      </tr>
                    ) : (
                      filteredInstitutions.map((inst) => (
                        <tr 
                          key={inst.id} 
                          onClick={() => setSelectedInstitution(inst)}
                          className="hover:bg-gray-50 transition-colors group cursor-pointer"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              {inst.logo_url ? (
                                <img 
                                  src={inst.logo_url} 
                                  alt={inst.name} 
                                  className="w-7 h-7 rounded-lg object-cover border border-gray-100"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-[#4338CA]">
                                  <Building2 size={14} />
                                </div>
                              )}
                              <span className="font-bold text-gray-900 text-xs group-hover:text-brand transition-colors">{inst.name}</span>
                              {inst.overdueCount > 10 && (
                                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-red-100 text-red-600 rounded-full" title={`${inst.overdueCount} overdue applications`}>
                                  <AlertCircle size={10} />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-xs text-gray-500">
                            {[inst.city, inst.country].filter(Boolean).join(', ')}
                          </td>
                          <td className="py-3 text-xs text-gray-500">{inst.type}</td>
                          <td className="py-3 text-xs text-gray-900 font-bold text-right">{inst.studentCount || 0}</td>
                          <td className="py-3 text-xs text-gray-900 font-bold text-right">{inst.applicationCount || 0}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                className="p-1.5 text-gray-400 hover:text-[#4338CA] hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit logic
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(inst.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                              <ArrowRight size={14} className="text-gray-300 group-hover:text-brand group-hover:translate-x-1 transition-all ml-1" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddInstitutionForm 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchInstitutions}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApply={setActiveFilters}
        fields={[
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Suspended'] },
          { key: 'country', label: 'Country', type: 'select', options: getNames() },
          { key: 'city', label: 'City', type: 'text' }
        ]}
      />
    </div>
  );
};

export default InstitutionsList;
