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
  const theme = getRoleTheme(user.role);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVerificationPopoverOpen, setIsVerificationPopoverOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
  const notificationsRef = useRef<HTMLDivElement>(null);
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
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

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
    setIsNotificationsOpen(false);
  };

  const isRecruiter = user.role === 'partner';
  const isVerified = user.status === 'ACTIVE';
  const isUnderReview = user.status === 'UNDER_REVIEW';
  const isRejected = user.status === 'REJECTED';

  return (
    <header className="h-20 glass flex items-center justify-between px-8 sticky top-0 z-40 border-b border-gray-100/50">
      <div className="flex-1 max-w-md">
      </div>

      <div className="flex items-center gap-6">
        {isRecruiter && (
          <div className="relative" ref={verificationRef}>
            <button
              onClick={() => setIsVerificationPopoverOpen(!isVerificationPopoverOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold border transition-all duration-300 shadow-sm ${
                isVerified 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 cursor-default' 
                  : isRejected
                    ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100 cursor-pointer'
                    : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 cursor-pointer'
              }`}
            >
              {isVerified ? (
                <>
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Verified</span>
                </>
              ) : isRejected ? (
                <>
                  <XCircle size={14} className="text-red-500" />
                  <span>Rejected</span>
                </>
              ) : isUnderReview ? (
                <>
                  <Clock size={14} className="text-amber-500" />
                  <span>Under Review</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-amber-500" />
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
                  className="absolute right-0 top-full mt-3 w-80 bg-white border border-gray-100 rounded-[32px] shadow-2xl p-8 z-50"
                >
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isRejected ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                        {isRejected ? <XCircle size={24} /> : isUnderReview ? <Clock size={24} /> : <AlertCircle size={24} />}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-gray-900 leading-tight">
                          {isRejected ? 'Verification Rejected' : isUnderReview ? 'Under Review' : 'Not Verified'}
                        </h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-black">Account Status</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      {isRejected 
                        ? 'Your application was not approved. Please update your details and resubmit.' 
                        : isUnderReview 
                          ? 'Our team is currently reviewing your profile. This usually takes 24-48 hours.'
                          : 'Complete your profile verification to start submitting student applications.'}
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => handleTabClick('verification')}
                        className="w-full py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: theme.primary, color: '#fff' }}
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

        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all relative group"
          >
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-96 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-xs font-black hover:opacity-70 transition-opacity"
                      style={{ color: theme.primary }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer group ${!notif.read ? 'bg-gray-50/50' : ''}`}
                          onClick={() => {
                            if (!notif.read) markAsRead(notif.id);
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className={`text-sm tracking-tight ${!notif.read ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-wider">
                                {new Date(notif.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 shadow-sm" style={{ backgroundColor: theme.primary }}></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-4">
                        <Bell size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500 font-bold">No notifications yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 cursor-pointer group outline-none p-1 pr-3 rounded-2xl hover:bg-gray-50 transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-900 group-hover:text-gray-600 transition-colors">
                {firstName || 'User'} {lastName}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-black">
                {user.role === 'partner' ? 'Partner' : user.role === 'admin' ? 'Admin' : 'Institution'}
              </p>
            </div>
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-black/5 group-hover:scale-105 transition-transform relative overflow-hidden shrink-0"
              style={{ backgroundColor: theme.primary }}
            >
              <span className="text-sm tracking-tighter">{initials}</span>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            </div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-72 bg-white border border-gray-100 rounded-[32px] shadow-2xl py-3 z-50 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-50 mb-2">
                  <p className="text-base font-black text-gray-900 leading-tight">{firstName || 'User'} {lastName}</p>
                  <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{user.email}</p>
                </div>

                <div className="px-3 space-y-1">
                  <DropdownItem 
                    icon={<User size={18} />} 
                    label="My Profile" 
                    onClick={() => handleTabClick('profile')}
                  />
                  <DropdownItem 
                    icon={<Settings size={18} />} 
                    label="Settings" 
                    onClick={() => handleTabClick('settings')}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 px-3">
                  <DropdownItem 
                    icon={<LogOut size={18} />} 
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
