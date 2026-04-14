import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, Camera, Shield, Globe, Building2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { supabase } from '../../supabase';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { useMemo } from 'react';

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.role === 'institution' ? (user.name || '') : `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`,
    firstName: user.firstName || user.first_name || '',
    lastName: user.lastName || user.last_name || '',
    phone: user.phone || '',
    country: user.country || '',
    city: user.city || '',
    bio: user.bio || '',
    website: user.website || '',
    timezone: user.timezone || 'UTC',
    payment_model: user.payment_model || '100_upfront',
    first_payment_percent: user.first_payment_percent || 100,
    second_payment_deadline_days: user.second_payment_deadline_days || 5,
    email_notifications: user.email_notifications ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (user.role === 'institution') {
        const { data, error } = await supabase
          .from('institutions')
          .update({
            name: formData.name,
            country: formData.country,
            city: formData.city,
            website: formData.website,
            description: formData.bio,
            timezone: formData.timezone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.institution_id)
          .select()
          .single();

        if (error) throw error;

        const updatedUser: UserProfile = {
          ...user,
          name: data.name,
          country: data.country,
          city: data.city,
          website: data.website,
          bio: data.description,
          timezone: data.timezone,
        };
        onUpdate(updatedUser);
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            country: formData.country,
            city: formData.city,
            bio: formData.bio,
            email_notifications: formData.email_notifications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;

        const updatedUser: UserProfile = {
          ...user,
          firstName: data.first_name,
          lastName: data.last_name,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          country: data.country,
          city: data.city,
          bio: data.bio,
          email_notifications: data.email_notifications,
          balance: data.balance ? Number(data.balance) : 0,
        };
        onUpdate(updatedUser);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}` || user.email[0].toUpperCase();

  const countryOptions = useMemo(() => countryList().getData(), []);

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isDisabled ? '#F9FAFB' : '#F9FAFB',
      border: state.isFocused ? '1px solid #4338CA' : '1px solid #F3F4F6',
      borderRadius: '1rem',
      padding: '0.5rem 0.5rem 0.5rem 2.5rem',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #4338CA',
      },
      fontSize: '0.875rem',
      fontWeight: '500',
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: '0',
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0',
      padding: '0',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: '#9CA3AF',
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #F3F4F6',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#4338CA' : state.isFocused ? '#EEF2FF' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      fontSize: '0.875rem',
      fontWeight: '500',
      '&:active': {
        backgroundColor: '#4338CA',
        color: 'white',
      },
    }),
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-[32px] bg-indigo-100 flex items-center justify-center text-[#4338CA] text-4xl font-bold border-4 border-white shadow-lg">
                {initials}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#4338CA] text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform">
                <Camera size={18} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h2>
            <p className="text-sm text-gray-500 mb-6 uppercase tracking-widest font-bold">
              {user.role === 'partner' ? 'Recruiter' : user.role === 'admin' ? 'Admin' : 'Institution'}
            </p>
            
            <div className="w-full pt-6 border-t border-gray-50 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 pt-2">
                <Shield size={16} className="text-gray-400" />
                <span className="font-bold text-brand">Balance: ${user.balance?.toLocaleString('en-US') || '0'}</span>
              </div>
            </div>
          </div>

          {user.role !== 'admin' && (
            <div className="bg-indigo-600 p-8 rounded-[40px] text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold mb-2">Account Security</h3>
                <p className="text-white/70 text-sm mb-6">Ensure your account is secure with a strong password and 2FA.</p>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all border border-white/20">
                  Security Settings
                </button>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            </div>
          )}
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
              {!isEditing ? (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-bold text-[#4338CA] hover:underline"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-sm font-bold text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.role === 'institution' ? (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Institution Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium disabled:opacity-60" 
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium disabled:opacity-60" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium disabled:opacity-60" 
                      />
                    </div>
                  </div>
                </>
              )}
              
              {user.role !== 'institution' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                  <div className="relative phone-input-container">
                    <PhoneInput
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(value) => setFormData(prev => ({ ...prev, phone: value || '' }))}
                      disabled={!isEditing}
                      className={`w-full bg-gray-50 border border-gray-100 rounded-2xl focus-within:bg-white focus-within:border-[#4338CA] transition-all outline-none text-sm font-medium disabled:opacity-60 overflow-hidden ${!isEditing ? 'opacity-60' : ''}`}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Country</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                  <Select 
                    options={countryOptions}
                    value={countryOptions.find(opt => opt.label === formData.country) || null}
                    onChange={(val: any) => setFormData(prev => ({ ...prev, country: val ? val.label : '' }))}
                    isDisabled={!isEditing}
                    styles={customSelectStyles}
                    placeholder="Select Country"
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">City</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium disabled:opacity-60" 
                  />
                </div>
              </div>

              {user.role === 'institution' && (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium disabled:opacity-60" 
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{user.role === 'institution' ? 'Description' : 'Bio'}</label>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#4338CA] transition-all outline-none text-sm font-medium disabled:opacity-60 resize-none" 
                />
              </div>

              {user.role === 'partner' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Commission</label>
                  <div className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-500 flex items-center justify-between">
                    <span>Percentage of student payments</span>
                    <span className="font-bold text-[#4338CA] text-lg">{user.recruiter_commission_rate || 0}%</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preferences</label>
                <div className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive updates about your applications and payments via email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="email_notifications"
                      checked={formData.email_notifications}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4338CA]"></div>
                  </label>
                </div>
              </div>
            </div>

            {isEditing && (
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#4338CA] text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
