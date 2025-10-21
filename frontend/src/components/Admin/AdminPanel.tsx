import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminPanel.css';

interface DatabaseStats {
  totalRecords: number;
  uniqueTalkgroups: number;
  uniqueCallsigns: number;
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

const AdminPanel: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0 });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
        <div className="admin-loading">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
              <div className="admin-header">
        <h1>🔐 Admin Panel</h1>
        <p className="subtitle">Brandmeister Lastheard Next Generation - Administration Panel</p>
      </div>
        <div className="loading-message">Loading admin data...</div>      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Database Statistics */}
      <div className="admin-section">
        <h2>📊 Database Statistics</h2>
        <div className="admin-stats">
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
        <div className="admin-stats">
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
                      <code className="callsign">{user.callsign}</code>
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
    </div>
  );
};

export default AdminPanel;