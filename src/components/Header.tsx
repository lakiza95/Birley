import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, Plus, Calendar, LogOut, User, Shield, HelpCircle, ChevronDown, AlertCircle, ShieldCheck, Clock, XCircle, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { getRoleTheme } from '../utils/theme';

interface HeaderProps {
  user: UserProfile;
  setActiveTab: (tab: string) => void;
  onRefreshProfile?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, setActiveTab, onRefreshProfile }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVerificationPopoverOpen, setIsVerificationPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    mailing_address: user.mailing_address || '',
    tax_id: user.tax_id || '',
    website: user.website || ''
  });

  useEffect(() => {
    setVerificationForm({
      mailing_address: user.mailing_address || '',
      tax_id: user.tax_id || '',
      website: user.website || ''
    });
  }, [user.mailing_address, user.tax_id, user.website]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const verificationRef = useRef<HTMLDivElement>(null);
  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}` || user.email[0].toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (verificationRef.current && !verificationRef.current.contains(event.target as Node)) {
        setIsVerificationPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsDropdownOpen(false);
    setIsVerificationPopoverOpen(false);
  };

  const isRecruiter = user.role === 'partner';
  const isVerified = user.status === 'ACTIVE';
  const isUnderReview = user.status === 'UNDER_REVIEW';
  const isRejected = user.status === 'REJECTED';

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex-1 max-w-md">
      </div>

      <div className="flex items-center gap-6">
        {isRecruiter && (
          <div className="relative" ref={verificationRef}>
            <button
              onClick={() => setIsVerificationPopoverOpen(!isVerificationPopoverOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isVerified 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default' 
                  : isRejected
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer'
              }`}
            >
              {isVerified ? (
                <>
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Verified</span>
                </>
              ) : isRejected ? (
                <>
                  <XCircle size={14} className="text-red-600" />
                  <span>Rejected</span>
                </>
              ) : isUnderReview ? (
                <>
                  <Clock size={14} className="text-amber-600" />
                  <span>Under Review</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-amber-600" />
                  <span>Not verified</span>
                </>
              )}
            </button>

            <AnimatePresence>
              {isVerificationPopoverOpen && !isVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-3xl shadow-xl p-6 z-50"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRejected ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        {isRejected ? <XCircle size={20} /> : isUnderReview ? <Clock size={20} /> : <AlertCircle size={20} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {isRejected ? 'Verification Rejected' : isUnderReview ? 'Under Review' : 'Not Verified'}
                        </h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Account Status</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {isRejected 
                        ? 'Your application was not approved. Please update your details and resubmit.' 
                        : isUnderReview 
                          ? 'Our team is currently reviewing your profile. This usually takes 24-48 hours.'
                          : 'Complete your profile verification to start submitting student applications.'}
                    </p>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => handleTabClick('verification')}
                        className="w-full py-3 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand/90 transition-all flex items-center justify-center gap-2"
                      >
                        <span>{isUnderReview ? 'View Status' : 'Complete Verification'}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer group outline-none"
          >
            <div className="text-right block">
              <p className={`text-sm font-bold text-gray-900 group-hover:text-brand transition-colors ${isDropdownOpen ? 'text-brand' : ''}`}>
                {firstName || 'User'} {lastName}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                {user.role === 'partner' ? 'Partner' : user.role === 'admin' ? 'Admin' : 'Institution'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand font-bold border border-brand/20 group-hover:scale-105 transition-transform relative overflow-hidden shrink-0">
              {initials}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-sm font-bold text-gray-900">{firstName || 'User'} {lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>

                <div className="px-2 space-y-0.5">
                  <DropdownItem 
                    icon={<User size={16} />} 
                    label="My Profile" 
                    onClick={() => handleTabClick('profile')}
                  />
                  <DropdownItem 
                    icon={<Settings size={16} />} 
                    label="Settings" 
                    onClick={() => handleTabClick('settings')}
                  />
                </div>

                <div className="mt-2 pt-2 border-t border-gray-50 px-2">
                  <DropdownItem 
                    icon={<LogOut size={16} />} 
                    label="Sign Out" 
                    variant="danger" 
                    onClick={handleSignOut}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

const DropdownItem = ({ icon, label, variant = 'default', onClick }: { icon: React.ReactNode, label: string, variant?: 'default' | 'danger', onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
    variant === 'danger' 
      ? 'text-red-600 hover:bg-red-50' 
      : 'text-gray-700 hover:bg-gray-50'
  }`}>
    <span className={variant === 'danger' ? 'text-red-500' : 'text-gray-400'}>{icon}</span>
    {label}
  </button>
);

export default Header;
