import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowRight, BookOpen, MapPin, X } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../supabase';

interface ProgramMatcherProps {
  student: any;
  onSkip: () => void;
  onSelectProgram: (programId: string) => void;
}

const ProgramMatcher: React.FC<ProgramMatcherProps> = ({ student, onSkip, onSelectProgram }) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatchingPrograms();
  }, [student]);

  const fetchMatchingPrograms = async () => {
    setIsLoading(true);
    try {
      // Fetch programs that match student's preferred specialization or destination
      let query = supabase.from('programs').select(`
        *,
        institutions (name, country, logo_url)
      `);
      
      const spec = student.preferredSpecialization || student.preferredspecialization;
      if (spec) {
        query = query.ilike('specialization', `%${spec}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching matching programs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto pb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Program Search for {student.name}</h1>
          <p className="text-sm text-gray-500">We found {programs.length} programs matching preferences.</p>
        </div>
        <button 
          onClick={onSkip}
          className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
        >
          Skip
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Searching for best matches...</div>
      ) : programs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
          <p className="text-gray-500 mb-4">No exact matches found for preferences.</p>
          <button onClick={onSkip} className="text-[#4338CA] font-bold hover:underline">Skip and browse catalog later</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map(program => (
            <div key={program.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={program.institutions?.logo_url || `https://picsum.photos/seed/${program.id}/200`} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-[#4338CA] rounded-lg text-xs font-bold">
                  {program.tuition_fee} {program.currency}/year
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{program.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{program.institutions?.name}</p>
              
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={14} />
                  <span>{program.institutions?.country}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <BookOpen size={14} />
                  <span>{program.level} • {program.duration}</span>
                </div>
              </div>

              <button 
                onClick={() => onSelectProgram(program.id)}
                className="w-full py-2.5 bg-gray-50 hover:bg-[#4338CA] hover:text-white text-gray-700 rounded-xl text-sm font-bold transition-colors mt-auto"
              >
                Select Program
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ProgramMatcher;
