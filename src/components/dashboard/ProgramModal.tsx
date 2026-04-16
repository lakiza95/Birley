import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, Plus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabase';
import { UserProfile } from '../../types';
import { getRoleTheme } from '../../utils/theme';
import { DOCUMENT_TYPES } from '../../constants/documents';
import SpecializationSelector from './SpecializationSelector';
import MultiSelect from './MultiSelect';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  program?: any;
  institutionId?: string | null;
  onSuccess: () => void;
}

const ProgramModal: React.FC<ProgramModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  program, 
  institutionId,
  onSuccess 
}) => {
  const theme = getRoleTheme(user.role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    level: 'Education',
    duration: '',
    intake: '',
    tuition_fee: '',
    currency: 'EUR',
    vacancies: '50',
    status: 'Pending',
    description: '',
    specialization: [] as string[],
    language: 'English',
    start_date: '',
    end_date: '',
    visa_suitability: 'just visa',
    min_age: '',
    max_age: '',
    language_certificate_required: false,
    min_language_score: '',
    experience_required: false,
    enrollment_deadline: '',
    commission: '0',
    countries_not_accepted: [] as string[],
    countries_preferred: [] as string[],
    required_documents: [] as string[],
    payment_model: 'full_upfront',
    first_payment_percent: 100,
    second_payment_deadline_days: 5
  });

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name || '',
        level: program.level || 'Education',
        duration: program.duration || '',
        intake: program.intake || '',
        tuition_fee: program.tuition_fee?.toString() || '',
        currency: program.currency || 'EUR',
        vacancies: program.vacancies?.toString() || '50',
        status: program.status || 'Pending',
        description: program.description || '',
        specialization: Array.isArray(program.specialization) ? program.specialization : (program.specialization ? [program.specialization] : []),
        language: program.language || 'English',
        start_date: program.start_date || '',
        end_date: program.end_date || '',
        visa_suitability: program.visa_suitability || 'just visa',
        min_age: program.min_age?.toString() || '',
        max_age: program.max_age?.toString() || '',
        language_certificate_required: program.language_certificate_required || false,
        min_language_score: program.min_language_score?.toString() || '',
        experience_required: program.experience_required || false,
        enrollment_deadline: program.enrollment_deadline || '',
        commission: program.commission?.toString() || '0',
        countries_not_accepted: program.countries_not_accepted || [],
        countries_preferred: program.countries_preferred || [],
        required_documents: program.required_documents || [],
        payment_model: program.payment_model || 'full_upfront',
        first_payment_percent: program.first_payment_percent || 100,
        second_payment_deadline_days: program.second_payment_deadline_days || 5
      });
    } else {
      setFormData({
        name: '',
        level: 'Education',
        duration: '',
        intake: '',
        tuition_fee: '',
        currency: 'EUR',
        vacancies: '50',
        status: 'Pending',
        description: '',
        specialization: [],
        language: 'English',
        start_date: '',
        end_date: '',
        visa_suitability: 'just visa',
        min_age: '',
        max_age: '',
        language_certificate_required: false,
        min_language_score: '',
        experience_required: false,
        enrollment_deadline: '',
        commission: '0',
        countries_not_accepted: [],
        countries_preferred: [],
        required_documents: [],
        payment_model: 'full_upfront',
        first_payment_percent: 100,
        second_payment_deadline_days: 5
      });
    }
  }, [program, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!institutionId && !program && user.role === 'institution') {
      setError('Institution ID not found.');
      return;
    }
    
    if (!formData.name || !formData.level || !formData.specialization || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields (Name, Level, Specialization, Start & End Dates)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const programData: any = {
        name: formData.name,
        level: formData.level,
        duration: formData.duration || `${formData.start_date} to ${formData.end_date}`,
        intake: formData.intake || new Date(formData.start_date).toLocaleString('en-US', { month: 'long' }),
        tuition_fee: parseFloat(formData.tuition_fee) || 0,
        currency: formData.currency,
        vacancies: parseInt(formData.vacancies) || 0,
        description: formData.description,
        specialization: formData.specialization,
        language: formData.language,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        visa_suitability: formData.visa_suitability,
        min_age: parseInt(formData.min_age) || null,
        max_age: parseInt(formData.max_age) || null,
        language_certificate_required: formData.language_certificate_required,
        min_language_score: parseFloat(formData.min_language_score) || null,
        experience_required: formData.experience_required,
        enrollment_deadline: formData.enrollment_deadline || null,
        commission: parseFloat(formData.commission) || 0,
        countries_not_accepted: formData.countries_not_accepted,
        countries_preferred: formData.countries_preferred,
        required_documents: formData.required_documents,
        payment_model: formData.payment_model,
        first_payment_percent: Number(formData.first_payment_percent) || 100,
        second_payment_deadline_days: Number(formData.second_payment_deadline_days) || 5
      };

      if (!program) {
        programData.institution_id = institutionId;
        programData.status = 'Pending';
      }

      let result;
      if (program) {
        result = await supabase
          .from('programs')
          .update(programData)
          .eq('id', program.id)
          .select();
      } else {
        result = await supabase
          .from('programs')
          .insert(programData)
          .select();
      }

      const { error: dbError } = result;
      if (dbError) throw dbError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting program:', err);
      setError(err.message || 'Failed to submit program.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
                >
                  {program ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{program ? 'Edit Program' : 'Add New Program'}</h2>
                  <p className="text-xs text-gray-500">{program ? 'Update program details and requirements.' : 'Create a new educational offering for students.'}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Program Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Computer Science BSc"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Specialization</label>
                  <SpecializationSelector 
                    selected={formData.specialization}
                    onChange={(selected) => setFormData({ ...formData, specialization: selected })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Level</label>
                  <select 
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                  >
                    <option value="Education">Education</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Training">Training</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Program Language</label>
                  <input 
                    type="text" 
                    placeholder="e.g. English, French"
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date" 
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Visa Suitability</label>
                  <select 
                    value={formData.visa_suitability}
                    onChange={(e) => setFormData({...formData, visa_suitability: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                  >
                    <option value="just visa">Just Visa</option>
                    <option value="conversion to residents card">Conversion to Residents Card</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Vacancies</label>
                  <input 
                    type="number" 
                    placeholder="50"
                    value={formData.vacancies}
                    onChange={(e) => setFormData({...formData, vacancies: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tuition Fee (EUR)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={formData.tuition_fee}
                    onChange={(e) => setFormData({...formData, tuition_fee: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Enrollment Deadline</label>
                  <input 
                    type="date" 
                    value={formData.enrollment_deadline}
                    onChange={(e) => setFormData({...formData, enrollment_deadline: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm"
                    style={{ '--tw-ring-color': theme.primary } as any}
                  />
                </div>

                {user.role === 'admin' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Commission (%)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      step="0.1"
                      value={formData.commission}
                      onChange={(e) => setFormData({...formData, commission: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm font-bold text-emerald-600"
                      style={{ '--tw-ring-color': theme.primary } as any}
                    />
                  </div>
                )}

                <div className="space-y-4 md:col-span-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <h3 className="text-sm font-bold text-indigo-900">Financial Model</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Payment Model
                      </label>
                      <select
                        name="payment_model"
                        value={formData.payment_model}
                        onChange={(e) => setFormData({...formData, payment_model: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-[#4338CA] transition-all outline-none text-sm appearance-none"
                      >
                        <option value="full_upfront">100% Upfront</option>
                        <option value="split_payment">Split Payment (2 parts)</option>
                      </select>
                    </div>

                    {formData.payment_model === 'split_payment' && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            1st Payment Proportion (%)
                          </label>
                          <input
                            required
                            type="number"
                            name="first_payment_percent"
                            value={formData.first_payment_percent}
                            onChange={(e) => setFormData({...formData, first_payment_percent: Number(e.target.value)})}
                            min="1"
                            max="99"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-[#4338CA] transition-all outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            2nd Payment Deadline (Days after Visa)
                          </label>
                          <input
                            required
                            type="number"
                            name="second_payment_deadline_days"
                            value={formData.second_payment_deadline_days}
                            onChange={(e) => setFormData({...formData, second_payment_deadline_days: Number(e.target.value)})}
                            min="1"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-[#4338CA] transition-all outline-none text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4 md:col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Requirements</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Min Age</label>
                      <input 
                        type="number" 
                        value={formData.min_age}
                        onChange={(e) => setFormData({...formData, min_age: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Max Age</label>
                      <input 
                        type="number" 
                        value={formData.max_age}
                        onChange={(e) => setFormData({...formData, max_age: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="langCert"
                        checked={formData.language_certificate_required}
                        onChange={(e) => setFormData({...formData, language_certificate_required: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="langCert" className="text-xs font-medium text-gray-700">Language Certificate Required</label>
                    </div>

                    {formData.language_certificate_required && (
                      <div className="space-y-1.5 pl-7">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Min Score</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={formData.min_language_score}
                          onChange={(e) => setFormData({...formData, min_language_score: e.target.value})}
                          className="w-full max-w-[150px] px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                        />
                      </div>
                    )}

                    <MultiSelect 
                      label="Countries Preferred"
                      selected={formData.countries_preferred}
                      onChange={(selected) => setFormData({...formData, countries_preferred: selected})}
                    />

                    <MultiSelect 
                      label="Countries Not Accepted"
                      selected={formData.countries_not_accepted}
                      onChange={(selected) => setFormData({...formData, countries_not_accepted: selected})}
                    />

                    <MultiSelect 
                      label="Required Documents"
                      selected={formData.required_documents}
                      onChange={(selected) => setFormData({...formData, required_documents: selected})}
                      options={DOCUMENT_TYPES}
                      showFlags={false}
                    />

                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="expReq"
                        checked={formData.experience_required}
                        onChange={(e) => setFormData({...formData, experience_required: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="expReq" className="text-xs font-medium text-gray-700">Experience in specialty or relevant education required</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Description</label>
                  <textarea 
                    placeholder="Describe program details, requirements and benefits..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm min-h-[100px] resize-none"
                    style={{ '--tw-ring-color': theme.primary } as any}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: theme.primary }}
                  className="text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save size={18} />
                  )}
                  <span>Save Program</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProgramModal;
