import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Building2, 
  Shield, 
  BadgeCheck, 
  UserCheck,
  Calendar,
  MapPin,
  Briefcase,
  Users,
  Archive
} from 'lucide-react';
import { supabase } from '../../supabase';
import { UserProfile, UserRole, UserStatus } from '../../types';
import { motion } from 'motion/react';

interface UserDetailProps {
  userId: string;
  onBack: () => void;
  canEdit?: boolean;
}

const UserDetail: React.FC<UserDetailProps> = ({ userId, onBack, canEdit = true }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [stats, setStats] = useState<{ total_students: number; success_rate: number }>({
    total_students: 0,
    success_rate: 0
  });

  useEffect(() => {
    fetchUser();
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_recruiter_stats', {
        target_recruiter_id: userId
      });
      if (error) throw error;
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching recruiter stats:', err);
    }
  };

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      const mappedUser: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone || data.whatsapp,
        country: data.country,
        city: data.city,
        bio: data.bio,
        agency: data.agency,
        recruiter_commission_rate: data.recruiter_commission_rate,
        balance: data.balance ? Number(data.balance) : 0,
        experience: data.experience,
        markets: data.markets,
        studentsPerYear: data.students_per_year,
        referralCode: data.referral_code,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setUser(mappedUser);
      setFormData(mappedUser);
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        agency: formData.agency,
        role: formData.role,
        status: formData.status,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        bio: formData.bio,
        experience: formData.experience,
        students_per_year: formData.studentsPerYear,
        recruiter_commission_rate: formData.recruiter_commission_rate
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
      
      setUser({ ...user!, ...formData });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!user) return <div className="p-8 text-center text-gray-500">User not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            <p className="text-sm text-gray-500">{user.firstName} {user.lastName} • {user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            !isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand/10"
                >
                  <Save size={18} />
                  <span>Save Changes</span>
                </button>
              </>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-[32px] p-8 text-center">
            <div className="w-24 h-24 rounded-3xl bg-brand-light flex items-center justify-center text-brand font-bold text-3xl mx-auto mb-4">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-gray-500 mb-6">
              {user.role === 'admin' ? 'Admin' : user.role === 'institution' ? 'Institution' : 'Partner'}
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {user.status === 'ARCHIVED' && (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <Archive size={12} />
                  Archived
                </span>
              )}
            </div>

            <div className="space-y-4 text-left border-t border-gray-50 pt-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{user.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Building2 size={16} className="text-gray-400" />
                <span>{user.agency || 'No organization'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar size={16} className="text-gray-400" />
                <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US') : 'Unknown'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-[32px] p-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold text-gray-900">{stats.total_students}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Students</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold text-gray-900">{stats.success_rate}%</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Success</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-[32px] p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Account Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                {isEditing ? (
                  <input 
                    value={formData.firstName || ''} 
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{user.firstName || '—'}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                {isEditing ? (
                  <input 
                    value={formData.lastName || ''} 
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{user.lastName || '—'}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Organization / Agency</label>
                {isEditing ? (
                  <input 
                    value={formData.agency || ''} 
                    onChange={(e) => handleChange('agency', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{user.agency || '—'}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role</label>
                {isEditing ? (
                  <select 
                    value={formData.role} 
                    onChange={(e) => handleChange('role', e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                  >
                    <option value="partner">Partner</option>
                    <option value="institution">Institution</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' ? <Shield size={14} className="text-purple-500" /> : <UserCheck size={14} className="text-brand" />}
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {user.role === 'admin' ? 'Admin' : user.role === 'institution' ? 'Institution' : 'Partner'}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Country</label>
                {isEditing ? (
                  <input 
                    value={formData.country || ''} 
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Globe size={14} className="text-gray-400" />
                    <span>{user.country || '—'}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">City</label>
                {isEditing ? (
                  <input 
                    value={formData.city || ''} 
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{user.city || '—'}</span>
                  </div>
                )}
              </div>
              {canEdit && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balance ($)</label>
                  <p className="text-sm font-bold text-brand">${user.balance?.toLocaleString('en-US') || '0'}</p>
                </div>
              )}
              {user.role === 'partner' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Commission (%)</label>
                  {isEditing ? (
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={formData.recruiter_commission_rate || 0} 
                      onChange={(e) => handleChange('recruiter_commission_rate', Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900">{user.recruiter_commission_rate || 0}%</p>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                {isEditing ? (
                  <select 
                    value={formData.status} 
                    onChange={(e) => handleChange('status', e.target.value as UserStatus)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                ) : (
                  <p className={`text-sm font-bold ${user.status === 'ARCHIVED' ? 'text-amber-600' : 'text-gray-900'}`}>
                    {user.status}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-[32px] p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Professional Profile</h3>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Experience</label>
                {isEditing ? (
                  <textarea 
                    value={formData.experience || ''} 
                    onChange={(e) => handleChange('experience', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">{user.experience || 'Experience information not provided.'}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Students per year</label>
                  {isEditing ? (
                    <input 
                      value={formData.studentsPerYear || ''} 
                      onChange={(e) => handleChange('studentsPerYear', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand outline-none text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Users size={14} className="text-gray-400" />
                      <span>{user.studentsPerYear || '—'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Referral Code</label>
                  <div className="flex items-center gap-2 text-sm font-bold text-brand bg-brand-light px-3 py-1 rounded-lg w-fit">
                    {user.referralCode || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserDetail;
