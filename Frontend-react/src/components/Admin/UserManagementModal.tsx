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
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Search,
  Lock,
  Mail,
  User as UserIcon,
  CheckSquare,
  Square
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useApp();
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
    department_codes: ['orth'] as string[],
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
      const msg = err.message || '';
      if (msg === 'Unauthenticated.' || msg.toLowerCase().includes('unauthenticated') || msg.toLowerCase().includes('session has expired')) {
        setError('Your administrator session has expired or is unauthenticated. Please sign in again.');
      } else {
        setError(msg || 'Failed to load users.');
      }
    } finally {
      setLoading(false);
    }
  };

  const parseUserDepartmentCodes = (user: UserAccount): string[] => {
    if (Array.isArray(user.department_codes) && user.department_codes.length > 0) {
      return user.department_codes;
    }
    if (user.department_code) {
      if (Array.isArray(user.department_code)) {
        return user.department_code;
      }
      try {
        const parsed = JSON.parse(user.department_code);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}

      if (user.department_code.includes(',')) {
        return user.department_code.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [user.department_code];
    }
    return [];
  };

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      department_codes: ['orth'],
    });
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    const codes = parseUserDepartmentCodes(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department_codes: codes.length > 0 ? codes : ['orth'],
    });
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  };

  const toggleDepartment = (deptCode: string) => {
    const current = [...formData.department_codes];
    const index = current.findIndex(c => c.toLowerCase() === deptCode.toLowerCase());
    if (index >= 0) {
      // Don't allow empty if at least one needed
      if (current.length === 1) {
        // allow removing or keeping
      }
      current.splice(index, 1);
    } else {
      current.push(deptCode);
    }
    setFormData({ ...formData, department_codes: current });
  };

  const handleSelectAllDepartments = () => {
    setFormData({
      ...formData,
      department_codes: DEPARTMENTS.map(d => d.code),
    });
  };

  const handleClearDepartments = () => {
    setFormData({
      ...formData,
      department_codes: [],
    });
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

    if (formData.role === 'user' && formData.department_codes.length === 0) {
      setError('Please select at least one assigned department for this staff user.');
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
          department_codes: formData.role === 'admin' ? [] : formData.department_codes,
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
          department_codes: formData.role === 'admin' ? [] : formData.department_codes,
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

  const filteredUsers = users.filter(u => {
    const query = search.toLowerCase();
    const matchesName = u.name.toLowerCase().includes(query);
    const matchesEmail = u.email.toLowerCase().includes(query);
    const codes = parseUserDepartmentCodes(u);
    const matchesDepts = codes.some(c => {
      const dept = getDeptInfo(c);
      return c.toLowerCase().includes(query) || (dept && dept.label.toLowerCase().includes(query));
    });
    return matchesName || matchesEmail || matchesDepts;
  });

  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div className="app-modal-window" style={{ maxWidth: 940, maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="app-modal-header">
          <div className="app-modal-header-left">
            <div className="app-modal-header-icon">
              <Users style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 className="app-modal-title">
                <span>System User Management</span>
                <span className="app-modal-badge">Admin Panel</span>
              </h3>
              <div className="app-modal-sub">Manage user accounts and assign department editing permissions</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="app-modal-close-btn"
            title="Close"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Status Alerts */}
        {(error || success) && (
          <div style={{ padding: '16px 24px 0' }}>
            {error && (
              <div className="modal-alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(error.toLowerCase().includes('unauthenticated') || error.toLowerCase().includes('expired')) && (
                    <button
                      onClick={() => {
                        onClose();
                        logout();
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Sign In Again
                    </button>
                  )}
                  <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            )}
            {success && (
              <div className="modal-alert-success">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{success}</span>
                </div>
                <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="app-modal-body">
          {/* Top Bar: Search & Add Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name, username, or department..."
                className="modal-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
            <button
              onClick={handleOpenCreate}
              className="btn-primary-modal"
            >
              <UserPlus style={{ width: 16, height: 16 }} />
              <span>Add New User</span>
            </button>
          </div>

          {/* User Form Inline Box */}
          {isFormOpen && (
            <div className="modal-inline-form-box">
              <div className="modal-inline-form-header">
                <div className="modal-inline-form-title">
                  {editingUserId ? <Edit3 style={{ width: 16, height: 16 }} /> : <UserPlus style={{ width: 16, height: 16 }} />}
                  <span>{editingUserId ? 'Edit User Account' : 'Create New User Account'}</span>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="modal-grid-2">
                  {/* Full Name */}
                  <div className="modal-form-group">
                    <label className="modal-form-label">Full Name *</label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Ahmed Mostafa"
                        className="modal-input"
                        style={{ paddingLeft: 36 }}
                        required
                      />
                    </div>
                  </div>

                  {/* Username / Email */}
                  <div className="modal-form-group">
                    <label className="modal-form-label">Username / Email *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. ahmed.mostafa"
                        className="modal-input"
                        style={{ paddingLeft: 36 }}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="modal-form-group">
                    <label className="modal-form-label">
                      Password {editingUserId ? '(Leave blank to keep current)' : '*'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingUserId ? '••••••••' : 'Min. 4 characters'}
                        className="modal-input"
                        style={{ paddingLeft: 36 }}
                        required={!editingUserId}
                      />
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="modal-form-group">
                    <label className="modal-form-label">Account Role *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'user' })}
                        style={{
                          padding: '9px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 10,
                          border: formData.role === 'user' ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                          background: formData.role === 'user' ? '#ccfbf1' : '#ffffff',
                          color: formData.role === 'user' ? '#0f766e' : '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <Building2 style={{ width: 14, height: 14 }} />
                        <span>Department User</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                        style={{
                          padding: '9px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 10,
                          border: formData.role === 'admin' ? '1.5px solid #7e22ce' : '1px solid #cbd5e1',
                          background: formData.role === 'admin' ? '#f3e8ff' : '#ffffff',
                          color: formData.role === 'admin' ? '#7e22ce' : '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <ShieldCheck style={{ width: 14, height: 14 }} />
                        <span>Administrator</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Assigned Departments (Multiple Selection) */}
                {formData.role === 'user' && (
                  <div className="modal-form-group" style={{ paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label className="modal-form-label" style={{ margin: 0 }}>
                        Assigned Departments (Can edit only these departments) *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0f766e' }}>
                          {formData.department_codes.length} of {DEPARTMENTS.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={handleSelectAllDepartments}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearDepartments}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: '#64748b'
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Department Checkbox / Pill Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 8,
                      maxHeight: 180,
                      overflowY: 'auto',
                      padding: 8,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10
                    }}>
                      {DEPARTMENTS.map((dept) => {
                        const isSelected = formData.department_codes.some(c => c.toLowerCase() === dept.code.toLowerCase());
                        return (
                          <div
                            key={dept.code}
                            onClick={() => toggleDepartment(dept.code)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 10px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              border: isSelected ? `1.5px solid ${dept.color}` : '1px solid #e2e8f0',
                              background: isSelected ? `${dept.color}15` : '#f8fafc',
                              color: isSelected ? dept.color : '#334155',
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: 12,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isSelected ? (
                              <CheckSquare style={{ width: 15, height: 15, color: dept.color, flexShrink: 0 }} />
                            ) : (
                              <Square style={{ width: 15, height: 15, color: '#94a3b8', flexShrink: 0 }} />
                            )}
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {dept.label}
                            </span>
                            <span style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase' }}>
                              {dept.code}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 6 }}>
                      ℹ️ This user can <strong>view all clinical programs</strong>, but edit permissions will be enabled <strong>only</strong> for the checked departments above.
                    </div>
                  </div>
                )}

                {/* Form Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="btn-secondary-modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary-modal"
                  >
                    {actionLoading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                    <span>{editingUserId ? 'Save Changes' : 'Create User'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User List Table */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
              <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#0f766e' }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>Loading system users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="modal-table-container" style={{ maxHeight: 'calc(90vh - 280px)', minHeight: 320, overflowY: 'auto' }}>
              <table className="modal-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9' }}>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department Permission</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const assignedCodes = parseUserDepartmentCodes(user);
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr key={user.id}>
                        {/* User Info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                              width: 34, 
                              height: 34, 
                              borderRadius: 10, 
                              background: '#0f766e', 
                              color: '#ffffff', 
                              fontWeight: 800, 
                              fontSize: 12, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          {user.role === 'admin' ? (
                            <span className="badge-admin">
                              <ShieldCheck style={{ width: 12, height: 12 }} />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="badge-dept">
                              <Building2 style={{ width: 12, height: 12 }} />
                              <span>Staff ({assignedCodes.length})</span>
                            </span>
                          )}
                        </td>

                        {/* Department Permissions */}
                        <td>
                          {user.role === 'admin' ? (
                            <span className="badge-all-depts">
                              ⭐ All Departments (Full Access)
                            </span>
                          ) : assignedCodes.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 380 }}>
                              {assignedCodes.map(code => {
                                const dept = getDeptInfo(code);
                                const label = dept?.label || code.toUpperCase();
                                const color = dept?.color || '#0f766e';
                                return (
                                  <span 
                                    key={code}
                                    style={{ 
                                      backgroundColor: `${color}15`, 
                                      color: color,
                                      border: `1px solid ${color}40`,
                                      fontWeight: 700,
                                      fontSize: 11,
                                      padding: '2px 7px',
                                      borderRadius: 6,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                    title={label}
                                  >
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
                                    <span>{label}</span>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No departments assigned</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="btn-icon-action edit"
                              title="Edit user"
                            >
                              <Edit3 style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={isSelf || actionLoading}
                              className="btn-icon-action delete"
                              title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
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
            <div style={{ padding: '36px 0', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <Users style={{ width: 36, height: 36, margin: '0 auto 8px', color: '#cbd5e1' }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>No users found matching your search.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="app-modal-footer">
          <div style={{ marginRight: 'auto', fontSize: 12, color: '#64748b' }}>
            Total registered users: <strong>{users.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary-modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

