import React, { useState } from 'react';
import { X, User, Mail, Shield, CheckCircle2, Loader2, Key } from 'lucide-react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../../types';

interface AddUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserForm: React.FC<AddUserFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin' as UserRole,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // The profile should be created automatically by the database trigger
        // but we can ensure it's updated with the correct role if needed.
        // However, the trigger usually handles this.
        
        onSuccess();
        onClose();
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'partner',
        });
      }
    } catch (err: any) {
      console.error('Error adding user:', err);
      setError(err.message || 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center text-brand">
                  <User size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2">
                  <div className="w-1 h-1 bg-red-600 rounded-full" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">First Name</label>
                  <input
                    required
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand focus:bg-white transition-all outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Last Name</label>
                  <input
                    required
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand focus:bg-white transition-all outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail size={10} />
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand focus:bg-white transition-all outline-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Key size={10} />
                  Initial Password
                </label>
                <input
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand focus:bg-white transition-all outline-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Shield size={10} />
                  User Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand focus:bg-white transition-all outline-none text-sm appearance-none"
                >
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand/10"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {isSubmitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddUserForm;
