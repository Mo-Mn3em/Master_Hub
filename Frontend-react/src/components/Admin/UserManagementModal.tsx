import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { UserAccount } from '../../types';
import { fetchUsersApi, createUserApi, updateUserApi, deleteUserApi } from '../../utils/api';
import DEPARTMENTS from '../../utils/departmentsData';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  KeyRound, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Search,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    department_code: 'orth' as string | null,
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsersApi();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      department_code: 'orth',
    });
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department_code: user.department_code || 'orth',
    });
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (currentUser?.id === user.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    setActionLoading(true);
    setError(null);
    try {
      await deleteUserApi(user.id);
      setSuccess(`User "${user.name}" deleted successfully.`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please provide user name and username/email.');
      return;
    }

    if (!editingUserId && (!formData.password || formData.password.length < 4)) {
      setError('Password is required and must be at least 4 characters long.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingUserId) {
        // Update
        const payload: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          department_code: formData.role === 'admin' ? null : formData.department_code,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await updateUserApi(editingUserId, payload);
        setSuccess('User updated successfully.');
      } else {
        // Create
        await createUserApi({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.role,
          department_code: formData.role === 'admin' ? null : formData.department_code,
        });
        setSuccess('New user created successfully.');
      }

      setIsFormOpen(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to save user.');
    } finally {
      setActionLoading(false);
    }
  };

  const getDeptInfo = (code?: string | null) => {
    if (!code) return null;
    return DEPARTMENTS.find(d => d.code.toLowerCase() === code.toLowerCase());
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department_code && u.department_code.toLowerCase().includes(search.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                <span>System User Management</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-teal-500/20 text-teal-300 rounded-md border border-teal-500/30">
                  Admin Only
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">Manage user accounts and assign department editing permissions</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {(error || success) && (
          <div className="px-6 pt-4 shrink-0">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-sm text-emerald-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{success}</span>
                </div>
                <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top Bar: Search & Add Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name, username, or department..."
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>

          {/* User Form Inline Box */}
          {isFormOpen && (
            <div className="p-5 bg-slate-50 border border-teal-200/80 rounded-2xl animate-fadeIn space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  {editingUserId ? <Edit3 className="w-4 h-4 text-teal-600" /> : <UserPlus className="w-4 h-4 text-teal-600" />}
                  <span>{editingUserId ? 'Edit User Account' : 'Create New User Account'}</span>
                </h4>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Ahmed Mostafa"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Username / Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Username / Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. ahmed.mostafa"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password {editingUserId ? '(Leave blank to keep current)' : '*'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingUserId ? '••••••••' : 'Min. 4 characters'}
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                        required={!editingUserId}
                      />
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Account Role *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'user' })}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          formData.role === 'user'
                            ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Department User</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          formData.role === 'admin'
                            ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-xs font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>Administrator</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Assigned Department (Only visible if role is 'user') */}
                {formData.role === 'user' && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Assigned Department (Can edit only this department) *
                    </label>
                    <select
                      value={formData.department_code || ''}
                      onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                      required
                    >
                      <option value="" disabled>Select assigned department...</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.code} value={dept.code}>
                          {dept.label} ({dept.code.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11.5px] text-slate-500 mt-1">
                      ℹ️ This user will be able to view all departments, but will only have edit permissions on <strong>{getDeptInfo(formData.department_code)?.label || 'the selected department'}</strong>.
                    </p>
                  </div>
                )}

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center gap-2"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingUserId ? 'Save Changes' : 'Create User'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User List Table */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-sm font-medium">Loading system users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">User</th>
                    <th className="px-4 py-3.5 font-semibold">Role</th>
                    <th className="px-4 py-3.5 font-semibold">Department Permission</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const dept = getDeptInfo(user.department_code);
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* User Info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 text-slate-600 rounded font-normal">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Staff</span>
                            </span>
                          )}
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3.5">
                          {user.role === 'admin' ? (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              ⭐ All Departments (Full Access)
                            </span>
                          ) : dept ? (
                            <span 
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ 
                                backgroundColor: `${dept.color}15`, 
                                color: dept.color,
                                border: `1px solid ${dept.color}40`
                              }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                              <span>{dept.label}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No department assigned</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={isSelf || actionLoading}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors"
                              title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No users found matching your search.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>Total registered users: <strong>{users.length}</strong></div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
