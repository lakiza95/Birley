import React, { useState } from 'react';
import { Settings, Users, Bell, Mail, MessageSquare, CreditCard, Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import UserManagement from './UserManagement';
import moment from 'moment-timezone';

interface SystemSettingsProps {
  user?: any;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || 'UTC');
  const [notificationSettings, setNotificationSettings] = useState(user?.notification_settings || {
    email_new_application: true,
    email_new_message: true,
    email_payment_received: true
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Password Change State
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const timezones = moment.tz.names();

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    setSelectedTimezone(newTimezone);
    setIsSaving(true);
    try {
      if (user.role === 'institution') {
        await supabase
          .from('institutions')
          .update({ timezone: newTimezone })
          .eq('id', user.institution_id);
      } else {
        await supabase
          .from('profiles')
          .update({ timezone: newTimezone })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating timezone:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNotification = async (key: string) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    setNotificationSettings(newSettings);
    setIsSaving(true);
    try {
      if (user.role === 'institution') {
        await supabase
          .from('institutions')
          .update({ notification_settings: newSettings })
          .eq('id', user.institution_id);
      } else {
        await supabase
          .from('profiles')
          .update({ notification_settings: newSettings })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (passwords.new.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus({ type: null, message: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      setPasswordStatus({ type: 'success', message: 'Password updated successfully' });
      setPasswords({ new: '', confirm: '' });
      
      // Clear success message after 5 seconds
      setTimeout(() => setPasswordStatus({ type: null, message: '' }), 5000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordStatus({ type: 'error', message: error.message || 'Failed to update password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your account and platform configuration.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-8">
          <nav className="flex gap-8">
            {user?.role === 'admin' && (
              <button 
                onClick={() => setActiveTab('users')}
                className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'users' ? 'text-[#4338CA] border-[#4338CA]' : 'text-gray-500 border-transparent'}`}
              >
                <Users size={18} />
                User Management
              </button>
            )}
            <button 
              onClick={() => setActiveTab('general')}
              className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'general' ? 'text-[#4338CA] border-[#4338CA]' : 'text-gray-500 border-transparent'}`}
            >
              <Settings size={18} />
              General
            </button>
          </nav>
        </div>
        <div className="p-8">
          {activeTab === 'users' && user?.role === 'admin' && <UserManagement />}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Settings size={20} className="text-gray-400" />
                  General Settings
                </h3>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Timezone</label>
                  <select 
                    value={selectedTimezone}
                    onChange={handleTimezoneChange}
                    disabled={isSaving}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>
                        {tz} (GMT{moment.tz(tz).format('Z')})
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="space-y-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Bell size={20} className="text-gray-400" />
                    Notification Preferences
                  </h3>
                  {isSaving && <span className="text-[10px] font-bold text-indigo-600 animate-pulse uppercase tracking-widest">Saving...</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NotificationToggle 
                    icon={Mail}
                    title="New Application"
                    description="Receive an email when a new student application is submitted."
                    isActive={notificationSettings.email_new_application}
                    onToggle={() => toggleNotification('email_new_application')}
                  />
                  <NotificationToggle 
                    icon={MessageSquare}
                    title="New Message"
                    description="Get notified via email when you receive a new message in the inbox."
                    isActive={notificationSettings.email_new_message}
                    onToggle={() => toggleNotification('email_new_message')}
                  />
                  <NotificationToggle 
                    icon={CreditCard}
                    title="Payment Received"
                    description="Email notification when a payment is successfully processed."
                    isActive={notificationSettings.email_payment_received}
                    onToggle={() => toggleNotification('email_payment_received')}
                  />
                </div>
              </section>

              <section className="space-y-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield size={20} className="text-gray-400" />
                  Security
                </h3>

                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium"
                      />
                    </div>
                  </div>

                  {passwordStatus.type && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
                      passwordStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {passwordStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      {passwordStatus.message}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isChangingPassword || !passwords.new || !passwords.confirm}
                    className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-sm hover:bg-brand/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : 'Update Password'}
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationToggle = ({ icon: Icon, title, description, isActive, onToggle }: any) => (
  <button 
    onClick={onToggle}
    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group ${
      isActive ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-100 hover:border-gray-200'
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
      isActive ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
    }`}>
      <Icon size={20} />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <div className={`w-8 h-4 rounded-full relative transition-colors ${isActive ? 'bg-indigo-600' : 'bg-gray-200'}`}>
          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'left-4.5' : 'left-0.5'}`} />
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  </button>
);

export default SystemSettings;
