import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  BookOpen, 
  Filter, 
  ArrowRight,
  Building2,
  Plus,
  AlertTriangle
} from 'lucide-react';
import UniversityCard from './UniversityCard';
import ProgramsList from './ProgramsList';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabase';
import AddInstitutionForm from './AddInstitutionForm';

import { UserProfile } from '../../types';

import { FilterModal } from './FilterModal';
import { getNames } from 'country-list';

interface CatalogProps {
  user: UserProfile;
}

const Catalog: React.FC<CatalogProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'institutions' | 'programs'>('institutions');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select(`
          *,
          programs (count)
        `)
        .eq('status', 'Active');

      if (error) throw error;
      
      const mappedSchools = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        location: s.country,
        rating: 4.5, // Placeholder
        programs: s.programs?.[0]?.count || 0,
        image: s.logo_url || `https://picsum.photos/seed/${s.id}/800/400`,
        tags: ['Verified']
      }));
      
      setSchools(mappedSchools);
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgramSelect = (program: any) => {
    let school = schools.find(s => s.id === program.institution_id);
    if (!school && program.institutions) {
      const inst = Array.isArray(program.institutions) ? program.institutions[0] : program.institutions;
      if (inst) {
        school = {
          id: inst.id,
          name: inst.name,
          location: inst.country,
          rating: 4.5,
          programs: 0,
          image: inst.logo_url || `https://picsum.photos/seed/${inst.id}/800/400`,
          tags: []
        };
      }
    }
    
    if (school) {
      setSelectedSchool(school);
      setSelectedProgramId(program.id);
    } else {
      alert('Error: This program is not linked to any institution or institution data is missing.');
    }
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = 
      school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'country') return school.location?.toLowerCase().includes(value.toLowerCase());
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  const isUnverifiedRecruiter = user.role === 'partner' && user.status !== 'ACTIVE';
  const displaySchools = isUnverifiedRecruiter ? filteredSchools.slice(0, 3) : filteredSchools;

  return (
    <div className="space-y-4">
      {!selectedSchool && (
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit mb-6">
          <button
            onClick={() => setActiveTab('institutions')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'institutions'
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Institutions
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'programs'
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Programs
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedSchool ? (
          <UniversityCard 
            key="details"
            school={selectedSchool} 
            user={user}
            onClose={() => {
              setSelectedSchool(null);
              setSelectedProgramId(null);
            }} 
            initialSelectedProgramId={selectedProgramId || undefined}
          />
        ) : activeTab === 'programs' ? (
          <motion.div
            key="programs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ProgramsList user={user} onProgramSelect={handleProgramSelect} />
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
                <h1 className="text-xl font-bold text-gray-900">Institution Catalog</h1>
                <p className="text-xs text-gray-500">Explore and compare the best educational institutions around the world.</p>
              </div>
            </div>

            {isUnverifiedRecruiter && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Verification Required</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    As an unverified recruiter, you can only see up to 3 institutions. 
                    Please complete your profile verification to unlock the full catalog.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name, city, or program..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg focus:border-[#blue-600] transition-colors outline-none text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`p-1.5 rounded-lg transition-colors border ${Object.keys(activeFilters).length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-gray-500 hover:bg-gray-50 bg-white border-gray-200'}`}
                >
                  <Filter size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                <div className="col-span-full py-24 text-center text-sm text-gray-400 font-bold">
                  <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  Loading catalog...
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="col-span-full py-24 text-center text-sm text-gray-400 font-bold">
                  <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-gray-300" />
                  </div>
                  No institutions found matching your search.
                </div>
              ) : (
                displaySchools.map((school) => (
                  <div 
                    key={school.id} 
                    onClick={() => setSelectedSchool(school)}
                    className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-apple shadow-apple-hover cursor-pointer group flex flex-col"
                  >
                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                      <img 
                        src={school.image} 
                        alt={school.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-[10px] font-black border border-white/10">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span>{school.rating}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-[10px] font-black border border-white/10">
                          <BookOpen size={12} />
                          <span>{school.programs} Programs</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-black text-gray-900 text-base mb-1 group-hover:text-blue-600 transition-colors line-clamp-1 leading-tight">
                        {school.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-4 font-black uppercase tracking-widest">
                        <MapPin size={12} className="text-gray-300 shrink-0" />
                        <span className="truncate">{school.location}</span>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {school.tags?.slice(0, 2).map((tag: string, i: number) => (
                            <span key={i} className="text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 px-2 py-1 rounded-lg">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddInstitutionForm 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchSchools}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApply={setActiveFilters}
        fields={[
          { key: 'country', label: 'Country', type: 'select', options: getNames() }
        ]}
      />
    </div>
  );
};

export default Catalog;
