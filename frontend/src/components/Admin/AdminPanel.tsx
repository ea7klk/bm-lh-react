import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminPanel.css';

interface DatabaseStats {
  totalRecords: number;
  uniqueTalkgroups: number;
  uniqueCallsigns: number;
  oldestRecord?: string;
}

interface User {
  id: number;
  callsign: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: number;
  last_login_at?: number;
  locale?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

interface UserEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    callsign: user.callsign,
    is_active: user.is_active,
    locale: user.locale || 'en',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
  ];

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.callsign.trim()) {
      errors.callsign = 'Callsign is required';
    } else if (!/^[A-Z0-9]{3,8}$/i.test(formData.callsign.trim())) {
      errors.callsign = 'Invalid callsign format (3-8 alphanumeric characters)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          callsign: formData.callsign.trim().toUpperCase(),
          is_active: formData.is_active,
          locale: formData.locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = { ...user, ...formData, callsign: formData.callsign.toUpperCase() };
      onSave(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) setError('');
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      callsign: user.callsign,
      is_active: user.is_active,
      locale: user.locale || 'en',
    });
    setFieldErrors({});
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={handleCancel}>
      <div className="auth-modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleCancel} aria-label="Close">
          ×
        </button>
        
        <div className="auth-modal-header">
          <h2>Edit User: {user.callsign}</h2>
          <p>Modify user information and settings</p>
        </div>

        <form className="auth-form settings-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-general-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Full name"
              className={fieldErrors.name ? 'error' : ''}
              disabled={isLoading}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <div className="error-message">{fieldErrors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Email address"
              className={fieldErrors.email ? 'error' : ''}
              disabled={isLoading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <div className="error-message">{fieldErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="edit-callsign">Callsign</label>
            <input
              id="edit-callsign"
              type="text"
              value={formData.callsign}
              onChange={(e) => handleInputChange('callsign', e.target.value.toUpperCase())}
              placeholder="Amateur radio callsign"
              className={fieldErrors.callsign ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
              style={{ fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace' }}
            />
            {fieldErrors.callsign && (
              <div className="error-message">{fieldErrors.callsign}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="edit-locale">Language Preference</label>
            <select
              id="edit-locale"
              value={formData.locale}
              onChange={(e) => handleInputChange('locale', e.target.value)}
              disabled={isLoading}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                disabled={isLoading}
              />
              User is active
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading && <span className="loading-spinner" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0 });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Check if user has admin access
  const hasAdminAccess = isAuthenticated && user?.callsign === 'EA7KLK';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('session_token');
    if (!token) return null;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const loadStats = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/admin/stats', { headers });
      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      setDbStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      showMessage('Failed to load database statistics', 'error');
    }
  };

  const loadUsers = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/admin/users', { headers });
      if (!response.ok) throw new Error('Failed to load users');

      const data = await response.json();
      setUsers(data);
      
      // Calculate user stats
      const total = data.length;
      const active = data.filter((u: User) => u.is_active).length;
      const inactive = total - active;
      setUserStats({ totalUsers: total, activeUsers: active, inactiveUsers: inactive });
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Failed to load user data', 'error');
    }
  };

  const toggleUserStatus = async (userId: number, newStatus: boolean) => {
    const action = newStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update user status');

      showMessage(`User ${action}d successfully`, 'success');
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      showMessage('Failed to update user status', 'error');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete user');

      showMessage('User deleted successfully', 'success');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('Failed to delete user', 'error');
    }
  };

  const expungeOldRecords = async () => {
    if (!window.confirm('Are you sure you want to delete all records older than 7 days? This action cannot be undone.')) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/admin/expunge-old-records', {
        method: 'POST',
        headers,
      });

      if (!response.ok) throw new Error('Failed to expunge records');

      const data = await response.json();
      showMessage(`Successfully deleted ${data.deletedCount.toLocaleString()} old records`, 'success');
      loadStats();
    } catch (error) {
      console.error('Error expunging records:', error);
      showMessage('Failed to expunge records', 'error');
    }
  };

  const updateTalkgroups = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/admin/update-talkgroups', {
        method: 'POST',
        headers,
      });

      if (!response.ok) throw new Error('Failed to update talkgroups');

      const data = await response.json();
      if (data.success) {
        showMessage('Talkgroups updated successfully', 'success');
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating talkgroups:', error);
      showMessage('Failed to update talkgroups', 'error');
    }
  };

  useEffect(() => {
    if (hasAdminAccess) {
      setLoading(true);
      Promise.all([loadStats(), loadUsers()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hasAdminAccess]);

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>🔐 Admin Panel</h1>
        </div>
        <div className="admin-auth-error">
          <p>Please log in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>🔐 Admin Panel</h1>
        </div>
        <div className="admin-auth-error">
          <p>Admin access required. This page is only accessible to EA7KLK.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>🔐 Admin Panel</h1>
        </div>
        <div className="loading-message">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔐 Admin Panel</h1>
        <p className="subtitle">Brandmeister Lastheard Next Generation - Administration Panel</p>
      </div>
      
      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Database Statistics */}
      <div className="admin-section">
        <h2>📊 Database Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Lastheard Records</div>
            <div className="stat-value">{dbStats?.totalRecords.toLocaleString() || '-'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Talkgroups</div>
            <div className="stat-value">{dbStats?.uniqueTalkgroups.toLocaleString() || '-'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Callsigns</div>
            <div className="stat-value">{dbStats?.uniqueCallsigns.toLocaleString() || '-'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Oldest Record</div>
            <div className="stat-value">{dbStats?.oldestRecord || '-'}</div>
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="admin-section">
        <div className="section-header">
          <h2>👥 Users</h2>
          <button className="refresh-btn" onClick={loadUsers}>
            🔄 Refresh
          </button>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{userStats.totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{userStats.activeUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Inactive Users</div>
            <div className="stat-value">{userStats.inactiveUsers}</div>
          </div>
        </div>
        
        <div className="users-table-container">
          {users.length === 0 ? (
            <div className="empty-state">No users found</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Callsign</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <button
                        className="callsign-link"
                        onClick={() => handleEditUser(user)}
                        title="Click to edit user"
                      >
                        <code className="callsign">{user.callsign}</code>
                      </button>
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{formatDate(user.last_login_at)}</td>
                    <td className="actions">
                      {user.is_active ? (
                        <button
                          className="action-btn deactivate"
                          onClick={() => toggleUserStatus(user.id, false)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="action-btn activate"
                          onClick={() => toggleUserStatus(user.id, true)}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        className="action-btn delete"
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="admin-section">
        <h2>🗑️ Database Maintenance</h2>
        <p className="section-description">
          Remove records older than 7 days from the database to free up space and improve performance.
        </p>
        <button className="maintenance-btn expunge" onClick={expungeOldRecords}>
          Expunge Records Older Than 7 Days
        </button>
        
        <p className="section-description" style={{ marginTop: '30px' }}>
          Update talkgroups database from Brandmeister API. This process runs automatically at 02:00 AM daily.
        </p>
        <button className="maintenance-btn update" onClick={updateTalkgroups}>
          Update BM TGs
        </button>
      </div>

      {/* User Edit Modal */}
      {isEditModalOpen && editingUser && (
        <UserEditModal
          user={editingUser}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={(updatedUser) => {
            // Update the user in the list
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            handleCloseEditModal();
            showMessage('User updated successfully', 'success');
          }}
        />
      )}
    </div>
  );
};

export default AdminPanel;