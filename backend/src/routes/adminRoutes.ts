import express, { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { emailService } from '../services/emailService';
import { updateTalkgroups } from '../services/talkgroupsService';

const router = express.Router();
const db = new DatabaseService();

// Middleware to check admin authentication (only EA7KLK)
async function authenticateAdmin(req: Request, res: Response, next: any) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ success: false, message: 'No session token provided' });
    }

    // Get user from session
    const sessionQuery = `
      SELECT u.* FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = $1 AND s.expires_at > $2 AND u.is_active = true
    `;
    const sessionResult = await db.query(sessionQuery, [sessionToken, Math.floor(Date.now() / 1000)]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    const user = sessionResult.rows[0];
    
    // Check if user is EA7KLK
    if (user.callsign !== 'EA7KLK') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Add user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Admin home page - HTML interface (no authentication required here)
 * Authentication is handled on the client side
 */
router.get('/', async (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .auth-message {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            margin: 50px auto;
            max-width: 500px;
        }
    </style>
</head>
<body>
    <div id="authCheck" class="auth-message">
        <h2>🔐 Admin Panel Access</h2>
        <p id="authMessage">Checking authentication...</p>
        <button onclick="window.location.href='/'">Return to Main Page</button>
    </div>

    <script>
        // Check authentication and authorization on page load
        async function checkAuthAndAccess() {
            const token = localStorage.getItem('session_token');
            if (!token) {
                document.getElementById('authMessage').textContent = 'No session token found. Please log in first.';
                return;
            }

            try {
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });

                if (!response.ok) {
                    document.getElementById('authMessage').textContent = 'Session expired. Please log in again.';
                    return;
                }

                const data = await response.json();
                if (!data.success || !data.user) {
                    document.getElementById('authMessage').textContent = 'Invalid session. Please log in again.';
                    return;
                }

                // Check if user is EA7KLK
                if (data.user.callsign !== 'EA7KLK') {
                    document.getElementById('authMessage').textContent = 'Admin access required. This page is only accessible to EA7KLK.';
                    return;
                }

                // User is authenticated and authorized - redirect to full admin interface
                window.location.href = '/admin/dashboard';
            } catch (error) {
                console.error('Auth check failed:', error);
                document.getElementById('authMessage').textContent = 'Authentication check failed. Please try again.';
            }
        }

        // Run auth check when page loads
        document.addEventListener('DOMContentLoaded', checkAuthAndAccess);
    </script>
</body>
</html>
  `);
});

/**
 * Admin dashboard - Full admin interface (client-side authentication check)
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Brandmeister Lastheard Next Generation</title>
    <!-- Quill.js Rich Text Editor -->
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        .section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin-bottom: 20px;
        }
        h2 {
            color: #333;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .refresh-btn {
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        .refresh-btn:hover {
            background: #5568d3;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        th {
            background: #f8f9fa;
            color: #333;
            font-weight: 600;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .delete-btn {
            padding: 6px 12px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        .delete-btn:hover {
            background: #c82333;
        }
        .status-active {
            color: #28a745;
            font-weight: 600;
        }
        .status-inactive {
            color: #dc3545;
            font-weight: 600;
        }
        .message {
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .empty {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        code {
            font-family: 'Courier New', monospace;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }
        .back-link:hover {
            text-decoration: underline;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            flex: 1;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .stat-value {
            color: #333;
            font-size: 28px;
            font-weight: 600;
        }
        .clickable-callsign {
            color: #667eea;
            cursor: pointer;
            text-decoration: none;
        }
        .clickable-callsign:hover {
            text-decoration: underline;
        }
        .expunge-btn {
            padding: 12px 24px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
        }
        .expunge-btn:hover {
            background: #c82333;
        }
        .expunge-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Admin Dashboard</h1>
            <p class="subtitle">Brandmeister Lastheard Next Generation - Administration Panel</p>
        </div>

        <div id="message" class="message"></div>

        <div class="section">
            <h2>📊 Database Statistics</h2>
            <div class="stats" id="dbStats">
                <div class="stat-card">
                    <div class="stat-label">Total Lastheard Records</div>
                    <div class="stat-value" id="totalRecords">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Unique Talkgroups</div>
                    <div class="stat-value" id="uniqueTalkgroups">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Unique Callsigns</div>
                    <div class="stat-value" id="uniqueCallsigns">-</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>
                👥 Users
                <button class="refresh-btn" onclick="loadUsers()">🔄 Refresh</button>
            </h2>
            <div class="stats" id="userStats">
                <div class="stat-card">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value" id="totalUsers">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Users</div>
                    <div class="stat-value" id="activeUsers">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Inactive Users</div>
                    <div class="stat-value" id="inactiveUsers">-</div>
                </div>
            </div>
            <div id="usersContent" class="loading">Loading...</div>
        </div>

        <div class="section">
            <h2>🗑️ Database Maintenance</h2>
            <p style="color: #666; margin-bottom: 20px;">
                Remove records older than 7 days from the database to free up space and improve performance.
            </p>
            <button class="expunge-btn" onclick="expungeOldRecords()" id="expungeBtn">
                Expunge Records Older Than 7 Days
            </button>
            <p style="color: #666; margin: 30px 0 20px 0;">
                Update talkgroups database from Brandmeister API. This process runs automatically at 02:00 AM daily.
            </p>
            <button class="expunge-btn" style="background: #28a745;" onclick="updateTalkgroups()" id="updateTgBtn">
                Update BM TGs
            </button>
        </div>

        <a href="/" class="back-link">← Back to Home</a>
    </div>

    <script>
        const API_BASE = '/api';
        
        function getAuthHeaders() {
            const token = localStorage.getItem('session_token');
            if (!token) {
                return null;
            }
            return {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            };
        }

        function showMessage(message, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = message;
            messageDiv.className = 'message ' + type;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }

        function formatDate(timestamp) {
            if (!timestamp) return '-';
            const date = new Date(timestamp * 1000);
            return date.toLocaleString();
        }

        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        async function loadStats() {
            try {
                const headers = getAuthHeaders();
                if (!headers) return;

                const response = await fetch(API_BASE + '/admin/stats', {
                    headers: headers
                });
                if (!response.ok) {
                    throw new Error('Failed to load stats');
                }
                
                const data = await response.json();
                document.getElementById('totalRecords').textContent = data.totalRecords.toLocaleString();
                document.getElementById('uniqueTalkgroups').textContent = data.uniqueTalkgroups.toLocaleString();
                document.getElementById('uniqueCallsigns').textContent = data.uniqueCallsigns.toLocaleString();
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        async function loadUsers() {
            try {
                const headers = getAuthHeaders();
                if (!headers) return;

                const response = await fetch(API_BASE + '/admin/users', {
                    headers: headers
                });
                if (!response.ok) {
                    throw new Error('Failed to load users');
                }
                
                const data = await response.json();
                
                // Update stats
                document.getElementById('totalUsers').textContent = data.length;
                document.getElementById('activeUsers').textContent = data.filter(u => u.is_active).length;
                document.getElementById('inactiveUsers').textContent = data.filter(u => !u.is_active).length;
                
                const content = document.getElementById('usersContent');
                
                if (data.length === 0) {
                    content.innerHTML = '<div class="empty">No users found</div>';
                    return;
                }
                
                let html = '<table>';
                html += '<thead><tr>';
                html += '<th>Callsign</th>';
                html += '<th>Name</th>';
                html += '<th>Email</th>';
                html += '<th>Status</th>';
                html += '<th>Created</th>';
                html += '<th>Last Login</th>';
                html += '<th>Actions</th>';
                html += '</tr></thead><tbody>';
                
                data.forEach(user => {
                    html += '<tr>';
                    html += '<td><code>' + escapeHtml(user.callsign) + '</code></td>';
                    html += '<td>' + escapeHtml(user.name) + '</td>';
                    html += '<td>' + escapeHtml(user.email) + '</td>';
                    html += '<td><span class="status-' + (user.is_active ? 'active' : 'inactive') + '">' + (user.is_active ? 'Active' : 'Inactive') + '</span></td>';
                    html += '<td>' + formatDate(user.created_at) + '</td>';
                    html += '<td>' + formatDate(user.last_login_at) + '</td>';
                    html += '<td>';
                    if (user.is_active) {
                        html += '<button class="delete-btn" style="background: #ffc107; margin-right: 5px;" onclick="toggleUserStatus(' + user.id + ', false)">Deactivate</button>';
                    } else {
                        html += '<button class="delete-btn" style="background: #28a745; margin-right: 5px;" onclick="toggleUserStatus(' + user.id + ', true)">Activate</button>';
                    }
                    html += '<button class="delete-btn" onclick="deleteUser(' + user.id + ')">Delete</button>';
                    html += '</td>';
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                content.innerHTML = html;
            } catch (error) {
                console.error('Error loading users:', error);
                document.getElementById('usersContent').innerHTML = '<div class="error">Error loading users</div>';
            }
        }

        async function expungeOldRecords() {
            if (!confirm('Are you sure you want to delete all records older than 7 days? This action cannot be undone.')) {
                return;
            }
            
            const headers = getAuthHeaders();
            if (!headers) return;

            const btn = document.getElementById('expungeBtn');
            btn.disabled = true;
            btn.textContent = 'Processing...';
            
            try {
                const response = await fetch(API_BASE + '/admin/expunge', {
                    method: 'POST',
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error('Failed to expunge records');
                }
                
                const data = await response.json();
                showMessage('Successfully deleted ' + data.deletedCount.toLocaleString() + ' old records', 'success');
                loadStats(); // Reload stats
            } catch (error) {
                console.error('Error expunging records:', error);
                showMessage('Failed to expunge records', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Expunge Records Older Than 7 Days';
            }
        }

        async function updateTalkgroups() {
            const headers = getAuthHeaders();
            if (!headers) return;

            const btn = document.getElementById('updateTgBtn');
            btn.disabled = true;
            btn.textContent = 'Updating...';
            
            try {
                const response = await fetch(API_BASE + '/admin/update-talkgroups', {
                    method: 'POST',
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update talkgroups');
                }
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('Talkgroups updated successfully', 'success');
                } else {
                    throw new Error(data.error || 'Update failed');
                }
            } catch (error) {
                console.error('Error updating talkgroups:', error);
                showMessage('Failed to update talkgroups', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Update BM TGs';
            }
        }

        async function toggleUserStatus(id, newStatus) {
            const action = newStatus ? 'activate' : 'deactivate';
            if (!confirm('Are you sure you want to ' + action + ' this user?')) return;
            
            const headers = getAuthHeaders();
            if (!headers) return;

            try {
                const response = await fetch(API_BASE + '/admin/users/' + id + '/status', {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ is_active: newStatus })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update user status');
                }
                
                showMessage('User ' + action + 'd successfully', 'success');
                loadUsers();
            } catch (error) {
                console.error('Error updating user status:', error);
                showMessage('Failed to update user status', 'error');
            }
        }

        async function deleteUser(id) {
            if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
            
            const headers = getAuthHeaders();
            if (!headers) return;

            try {
                const response = await fetch(API_BASE + '/admin/users/' + id, {
                    method: 'DELETE',
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete user');
                }
                
                showMessage('User deleted successfully', 'success');
                loadUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                showMessage('Failed to delete user', 'error');
            }
        }

        // Check authentication and authorization on page load
        async function checkAuthAndAccess() {
            const token = localStorage.getItem('session_token');
            if (!token) {
                alert('No session token found. Please log in first.');
                window.location.href = '/';
                return false;
            }

            try {
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });

                if (!response.ok) {
                    alert('Session expired. Please log in again.');
                    window.location.href = '/';
                    return false;
                }

                const data = await response.json();
                if (!data.success || !data.user) {
                    alert('Invalid session. Please log in again.');
                    window.location.href = '/';
                    return false;
                }

                // Check if user is EA7KLK
                if (data.user.callsign !== 'EA7KLK') {
                    alert('Admin access required. This page is only accessible to EA7KLK.');
                    window.location.href = '/';
                    return false;
                }

                // User is authenticated and authorized
                return true;
            } catch (error) {
                console.error('Auth check failed:', error);
                alert('Authentication check failed. Please log in again.');
                window.location.href = '/';
                return false;
            }
        }

        // Initialize the page
        document.addEventListener('DOMContentLoaded', async function() {
            // Check authentication first
            const isAuthorized = await checkAuthAndAccess();
            if (!isAuthorized) {
                return; // User will be redirected
            }

            // User is authorized, load admin data
            loadStats();
            loadUsers();
        });
    </script>
</body>
</html>
  `);
});

/**
 * API Routes - All require admin authentication
 */

/**
 * Get database statistics (Admin only)
 */
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const totalRecords = await db.query('SELECT COUNT(*) as count FROM lastheard WHERE "DestinationID" != 9');
    const uniqueTalkgroups = await db.query('SELECT COUNT(DISTINCT "DestinationID") as count FROM lastheard WHERE "DestinationID" != 9');
    const uniqueCallsigns = await db.query('SELECT COUNT(DISTINCT "SourceCall") as count FROM lastheard WHERE "DestinationID" != 9');
    
    res.json({
      totalRecords: parseInt(totalRecords.rows[0].count),
      uniqueTalkgroups: parseInt(uniqueTalkgroups.rows[0].count),
      uniqueCallsigns: parseInt(uniqueCallsigns.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * Expunge old records (Admin only)
 */
router.post('/expunge', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const result = await db.query('DELETE FROM lastheard WHERE "Start" < $1', [sevenDaysAgo]);
    
    res.json({
      message: 'Records expunged successfully',
      deletedCount: result.rowCount
    });
  } catch (error) {
    console.error('Error expunging records:', error);
    res.status(500).json({ error: 'Failed to expunge records' });
  }
});

/**
 * Update talkgroups from Brandmeister (Admin only)
 */
router.post('/update-talkgroups', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    console.log('Manual talkgroups update triggered by admin');
    const result = await updateTalkgroups();
    
    if (result.success) {
      res.json({
        success: true,
        readFromSource: result.readFromSource,
        added: result.added,
        updated: result.updated,
        totalBefore: result.totalBefore,
        totalAfter: result.totalAfter
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to update talkgroups' 
      });
    }
  } catch (error: any) {
    console.error('Error updating talkgroups:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update talkgroups' 
    });
  }
});

/**
 * Get all users (Admin only)
 */
router.get('/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT id, callsign, name, email, is_active, created_at, last_login_at, locale FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Update user status (Admin only)
 */
router.put('/users/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active field is required' });
    }
    
    const result = await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * Delete a user (Admin only)
 */
router.delete('/users/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete user sessions first (cascading delete)
    await db.query(`DELETE FROM user_sessions WHERE user_id = $1`, [id]);
    
    // Delete user
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
