import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Mail, Phone, Building2, Users, CheckCircle2, Globe, FileText } from 'lucide-react';
import { supabase } from '../../supabase';

interface RecruiterProfileModalProps {
  recruiterId: string;
  onClose: () => void;
}

const RecruiterProfileModal: React.FC<RecruiterProfileModalProps> = ({ recruiterId, onClose }) => {
  const [recruiter, setRecruiter] = useState<any>(null);
  const [metrics, setMetrics] = useState({ totalStudents: 0, successfulApps: 0, totalApps: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecruiterData = async () => {
      setIsLoading(true);
      try {
        // Fetch recruiter profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', recruiterId)
          .single();

        if (profileError) throw profileError;
        setRecruiter(profileData);

        // Fetch metrics
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('recruiter_id', recruiterId);

        const { data: appsData } = await supabase
          .from('applications')
          .select('status')
          .eq('recruiter_id', recruiterId);

        const totalApps = appsData?.length || 0;
        const successfulApps = appsData?.filter(app => 
          ['Accepted', 'Paid', 'Documents Issued'].includes(app.status)
        ).length || 0;

        setMetrics({
          totalStudents: studentsCount || 0,
          totalApps,
          successfulApps
        });

      } catch (err) {
        console.error('Error fetching recruiter data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (recruiterId) {
      fetchRecruiterData();
    }
  }, [recruiterId]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
            <h2 className="text-xl font-bold text-gray-900">Recruiter Profile</h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-[#4338CA] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : recruiter ? (
              <div className="space-y-8">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-[#4338CA] flex items-center justify-center text-3xl font-bold border-2 border-indigo-100 shadow-sm">
                    {(recruiter.first_name?.[0] || recruiter.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {recruiter.first_name} {recruiter.last_name}
                      </h3>
                      {recruiter.is_verified && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                          <CheckCircle2 size={12} />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-500 font-medium mb-4">{recruiter.agency || 'Independent Recruiter'}</p>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Mail size={14} className="text-gray-400" />
                        <span>{recruiter.email}</span>
                      </div>
                      {recruiter.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <Phone size={14} className="text-gray-400" />
                          <span>{recruiter.phone}</span>
                        </div>
                      )}
                      {(recruiter.city || recruiter.country) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{[recruiter.city, recruiter.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Performance Metrics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Users size={20} />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalStudents}</p>
                      <p className="text-sm text-gray-500 font-medium">Total Students</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                        <FileText size={20} />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalApps}</p>
                      <p className="text-sm text-gray-500 font-medium">Total Applications</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.successfulApps}</p>
                      <p className="text-sm text-gray-500 font-medium">Successful Placements</p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {recruiter.bio && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">About</h4>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-sm text-gray-600 leading-relaxed">
                      {recruiter.bio}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Recruiter profile not found.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RecruiterProfileModal;
