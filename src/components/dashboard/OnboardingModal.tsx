import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, Globe, Briefcase, Users, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { supabase } from '../../supabase';
import { UserProfile } from '../../types';

interface OnboardingModalProps {
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    experience: '',
    region: '',
    studentsPerYear: '',
    markets: [] as string[],
    mailing_address: '',
    organization_address: '',
    tax_id: '',
    website: '',
  });

  const countryOptions = useMemo(() => countryList().getData(), []);

  const experienceOptions = [
    { value: 'less than a year', label: 'Less than a year' },
    { value: '1-3 years', label: '1-3 years' },
    { value: '3-5 years', label: '3-5 years' },
    { value: 'more than 5 years', label: 'More than 5 years' },
  ];

  const volumeOptions = [
    { value: 'less than 50', label: 'Less than 50' },
    { value: '50-100', label: '50-100' },
    { value: '100-300', label: '100-300' },
    { value: 'more than 300', label: 'More than 300' },
  ];

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (isSkip = false) => {
    setLoading(true);
    try {
      const updateData: any = {
        experience: formData.experience,
        region: formData.region,
        students_per_year: formData.studentsPerYear,
        markets: formData.markets,
        onboarding_completed: true,
        status: isSkip ? 'PROFILE_COMPLETED' : 'UNDER_REVIEW'
      };

      if (!isSkip) {
        updateData.mailing_address = formData.mailing_address;
        updateData.organization_address = formData.organization_address;
        updateData.tax_id = formData.tax_id;
        updateData.website = formData.website;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const mergedProfile = {
        ...data,
        firstName: (data as any).firstName || (data as any).first_name || user.firstName,
        lastName: (data as any).lastName || (data as any).last_name || user.lastName,
        studentsPerYear: (data as any).students_per_year || (data as any).studentsPerYear,
      };

      onComplete(mergedProfile as UserProfile);
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  const regions = [
    'Europe',
    'Central Asia',
    'Southeast Asia',
    'Middle East',
    'North America',
    'South America',
    'Africa',
    'CIS',
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-[#4338CA]">
                <Briefcase size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Work Experience</h3>
            </div>
            <p className="text-gray-500">How many years have you been in recruiting?</p>
            <div className="grid grid-cols-1 gap-3">
              {experienceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, experience: option.value })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    formData.experience === option.value
                      ? 'border-[#4338CA] bg-indigo-50 text-[#4338CA]'
                      : 'border-gray-100 hover:border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{option.label}</span>
                    {formData.experience === option.value && <Check size={18} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-[#4338CA]">
                <MapPin size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Region</h3>
            </div>
            <p className="text-gray-500">In which primary region do you operate?</p>
            <div className="grid grid-cols-1 gap-3">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setFormData({ ...formData, region })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    formData.region === region
                      ? 'border-[#4338CA] bg-indigo-50 text-[#4338CA]'
                      : 'border-gray-100 hover:border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{region}</span>
                    {formData.region === region && <Check size={18} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-[#4338CA]">
                <Users size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Student Volume</h3>
            </div>
            <p className="text-gray-500">What is your annual student enrollment volume?</p>
            <div className="grid grid-cols-1 gap-3">
              {volumeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, studentsPerYear: option.value })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    formData.studentsPerYear === option.value
                      ? 'border-[#4338CA] bg-indigo-50 text-[#4338CA]'
                      : 'border-gray-100 hover:border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{option.label}</span>
                    {formData.studentsPerYear === option.value && <Check size={18} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-[#4338CA]">
                <Globe size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Target Countries</h3>
            </div>
            <p className="text-gray-500">Which countries are you planning to enroll students in?</p>
            <div className="space-y-4">
              <Select
                isMulti
                options={countryOptions}
                value={countryOptions.filter(opt => formData.markets.includes(opt.label))}
                onChange={(selected) => setFormData({ ...formData, markets: selected ? selected.map(s => s.label) : [] })}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select countries..."
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '1rem',
                    padding: '0.5rem',
                    borderColor: '#F3F4F6',
                    backgroundColor: '#F9FAFB',
                    '&:hover': {
                      borderColor: '#4338CA',
                    }
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#EEF2FF',
                    borderRadius: '0.5rem',
                    color: '#4338CA',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#4338CA',
                    fontWeight: 'bold',
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: '#4338CA',
                    '&:hover': {
                      backgroundColor: '#4338CA',
                      color: 'white',
                    }
                  })
                }}
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-[#4338CA]">
                <CheckCircle size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Verification</h3>
            </div>
            <p className="text-gray-500">Please provide your company details for verification.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mailing Address</label>
                <input 
                  type="text"
                  value={formData.mailing_address}
                  onChange={(e) => setFormData({ ...formData, mailing_address: e.target.value, organization_address: e.target.value })}
                  placeholder="Street, City, Zip Code"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#4338CA] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tax ID / Company Number</label>
                <input 
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="Tax registration number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#4338CA] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Website / Social Media</label>
                <input 
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#4338CA] outline-none transition-all"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.experience !== '';
      case 2: return formData.region.trim() !== '';
      case 3: return formData.studentsPerYear !== '';
      case 4: return formData.markets.length > 0;
      case 5: return formData.mailing_address.trim() !== '' && formData.tax_id.trim() !== '' && formData.website.trim() !== '';
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative"
      >
        <div className="p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-8 bg-[#4338CA]' : i < step ? 'w-4 bg-green-500' : 'w-4 bg-gray-100'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of 5</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex gap-4">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="flex-[2] py-4 bg-[#4338CA] text-white rounded-2xl font-bold hover:bg-[#3730A3] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 5 ? 'Finish' : 'Next'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {step === 5 && (
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="text-indigo-600 font-bold text-sm hover:underline mt-6 block mx-auto transition-all"
            >
              Skip verification for now
            </button>
          )}
        </div>

        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-50"></div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
