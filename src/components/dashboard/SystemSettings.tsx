import React, { useState } from 'react';
import { Settings, Users, Shield } from 'lucide-react';
import { supabase } from '../../supabase';
import UserManagement from './UserManagement';
import moment from 'moment-timezone';

interface SystemSettingsProps {
  user?: any;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || 'UTC');
  const [isSaving, setIsSaving] = useState(false);
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
      alert('Timezone updated successfully');
    } catch (error) {
      console.error('Error updating timezone:', error);
      alert('Failed to update timezone');
    } finally {
      setIsSaving(false);
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
            <button 
              onClick={() => setActiveTab('security')}
              className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'security' ? 'text-[#4338CA] border-[#4338CA]' : 'text-gray-500 border-transparent'}`}
            >
              <Shield size={18} />
              Security
            </button>
          </nav>
        </div>
        <div className="p-8">
          {activeTab === 'users' && user?.role === 'admin' && <UserManagement />}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">General Settings</h3>
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
            </div>
          )}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Security</h3>
              <div className="flex flex-col gap-4">
                <button className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all">
                  Change Password
                </button>
                <button className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all">
                  Enable 2FA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
