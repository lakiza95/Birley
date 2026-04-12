import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  XCircle,
  CheckCircle2,
  Mail,
  Globe,
  MapPin,
  ArrowRight,
  Loader2,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../../types';

interface RecruiterVerificationProps {
  user: UserProfile;
  onRefreshProfile?: () => void;
}

const RecruiterVerification: React.FC<RecruiterVerificationProps> = ({ user, onRefreshProfile }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    mailing_address: user.mailing_address || '',
    tax_id: user.tax_id || '',
    website: user.website || ''
  });

  useEffect(() => {
    setFormData({
      mailing_address: user.mailing_address || '',
      tax_id: user.tax_id || '',
      website: user.website || ''
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          mailing_address: formData.mailing_address,
          organization_address: formData.mailing_address,
          tax_id: formData.tax_id,
          website: formData.website,
          status: 'UNDER_REVIEW'
        })
        .eq('id', user.id);

      if (error) throw error;
      
      if (onRefreshProfile) onRefreshProfile();
    } catch (err) {
      console.error('Error submitting verification:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified = user.status === 'ACTIVE';
  const isUnderReview = user.status === 'UNDER_REVIEW';
  const isRejected = user.status === 'REJECTED';
  const isNotVerified = !isVerified && !isUnderReview && !isRejected;

  if (isVerified) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-900">Verification</h1>
          <p className="text-gray-500">Your account is fully verified and active.</p>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-12 flex flex-col items-center text-center space-y-8">
            <div className="w-24 h-24 rounded-[32px] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100">
              <CheckCircle2 size={48} />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Verification Successful</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Congratulations! Your recruiter account has been verified. You now have full access to all platform features, including student application submissions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
              <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Status</p>
                  <p className="text-sm font-bold text-gray-900">Active</p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Building2 size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Type</p>
                  <p className="text-sm font-bold text-gray-900">Partner</p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Mail size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-gray-900">Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">Account Verification</h1>
        <p className="text-gray-500">Complete your profile to start submitting applications.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 sm:p-10">
            {isUnderReview ? (
              <div className="space-y-8 text-center py-10">
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[28px] flex items-center justify-center mx-auto shadow-lg shadow-amber-100">
                  <Clock size={40} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900">Application Under Review</h2>
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    We've received your verification request. Our compliance team is currently reviewing your information. This process typically takes 24-48 business hours.
                  </p>
                </div>
                <div className="pt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Status: Processing
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      To maintain platform integrity, all recruiters must be verified before they can submit student applications.
                    </p>
                  </div>

                  {isRejected && (
                    <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                      <XCircle className="text-red-600 shrink-0" size={20} />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-red-800">Verification Rejected</p>
                        <p className="text-xs text-red-700 leading-relaxed">
                          Your previous application was not approved. Please review your details and resubmit the request.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <MapPin size={14} /> Mailing Address
                      </label>
                      <input 
                        type="text"
                        required
                        value={formData.mailing_address}
                        onChange={(e) => setFormData({ ...formData, mailing_address: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand focus:bg-white transition-all text-sm"
                        placeholder="Full business or personal mailing address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck size={14} /> Tax ID / Company Registration Number
                      </label>
                      <input 
                        type="text"
                        required
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand focus:bg-white transition-all text-sm"
                        placeholder="Your official business registration or tax ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Globe size={14} /> Website or Social Media Profile
                      </label>
                      <input 
                        type="url"
                        required
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand focus:bg-white transition-all text-sm"
                        placeholder="https://yourcompany.com or LinkedIn profile"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-sm hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>Submit for Verification</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterVerification;
