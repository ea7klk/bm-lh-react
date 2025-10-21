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

// Admin routes now handled by React Router - no HTML endpoints needed



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
router.post('/expunge-old-records', authenticateAdmin, async (req: Request, res: Response) => {
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
