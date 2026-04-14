import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Mail, 
  Shield,
  BadgeCheck,
  ChevronDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { FilterModal } from './FilterModal';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'motion/react';
import UserDetail from './UserDetail';

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<Partial<UserProfile>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const clean = (val: any) => (val === 'undefined' || val === 'null' || !val) ? '' : val;
      
      const mappedUsers = (data || []).map(u => ({
        id: u.id,
        firstName: clean(u.first_name),
        lastName: clean(u.last_name),
        email: clean(u.email),
        role: u.role,
        status: u.status,
        agency: clean(u.agency)
      }));
      
      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Note: In a real app, you'd likely disable the user in Auth too
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.agency?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'status') return user.status === value;
      if (key === 'role') return user.role === value;
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  if (selectedUserId) {
    return <UserDetail userId={selectedUserId} onBack={() => setSelectedUserId(null)} canEdit={true} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage all platform users, roles, and account statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 mr-2">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-brand-light text-brand' : 'text-gray-400 hover:text-gray-600'}`}
              title="Table"
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand-light text-brand' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-bold transition-all ${Object.keys(activeFilters).length > 0 ? 'border-brand text-brand bg-brand/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand/10">
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email or agency..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:border-brand transition-all outline-none text-sm"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div 
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border-y border-gray-200 -mx-8 px-8"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-4 font-bold">User</th>
                    <th className="py-4 font-bold">Role</th>
                    <th className="py-4 font-bold">Organization</th>
                    <th className="py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <p className="font-medium">No users found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedUserId(user.id!)}
                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand font-bold text-sm">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {user.role === 'admin' ? (
                              <Shield size={14} className="text-purple-500" />
                            ) : user.role === 'institution' ? (
                              <BadgeCheck size={14} className="text-blue-500" />
                            ) : (
                              <UserCheck size={14} className="text-indigo-500" />
                            )}
                            <span className="text-xs font-bold text-gray-700">
                              {user.role === 'admin' ? 'Admin' : user.role === 'institution' ? 'Institution' : 'Partner'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600">
                          {user.agency || '—'}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(user.id!);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                            >
                              <UserX size={18} />
                            </button>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredUsers.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400">
                  <p className="font-medium">No users found.</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    onClick={() => setSelectedUserId(user.id!)}
                    className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:shadow-gray-200/50 transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand font-bold text-lg shrink-0">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</h3>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                          {user.role === 'admin' ? (
                            <Shield size={12} className="text-purple-500" />
                          ) : user.role === 'institution' ? (
                            <BadgeCheck size={12} className="text-blue-500" />
                          ) : (
                            <UserCheck size={12} className="text-indigo-500" />
                          )}
                          <span className="text-[10px] font-bold text-gray-700">
                            {user.role === 'admin' ? 'Admin' : user.role === 'institution' ? 'Institution' : 'Partner'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Organization</span>
                        <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">{user.agency || '—'}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-2">
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all"
                      >
                        <Mail size={14} />
                        <span>Message</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(user.id!);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApply={setActiveFilters}
        fields={[
          { key: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'PENDING', 'SUSPENDED'] },
          { key: 'role', label: 'Role', type: 'select', options: ['admin', 'partner', 'institution'] }
        ]}
      />
    </div>
  );
};

export default UserManagement;
