import { Request, Response } from 'express';
import { SummaryService } from '../services/summaryService';

interface QueryTimeRange {
  startTime: number;
  endTime: number;
}

/**
 * Parse and validate time range from query parameters
 */
function parseTimeRange(req: Request): QueryTimeRange {
  const { startTime, endTime } = req.query;
  
  if (!startTime || !endTime) {
    throw new Error('startTime and endTime query parameters are required');
  }
  
  const start = parseInt(startTime as string);
  const end = parseInt(endTime as string);
  
  if (isNaN(start) || isNaN(end)) {
    throw new Error('startTime and endTime must be valid unix timestamps');
  }
  
  if (start >= end) {
    throw new Error('startTime must be less than endTime');
  }
  
  // Limit to reasonable time ranges (max 1 year)
  const maxRange = 365 * 24 * 60 * 60; // 1 year in seconds
  if (end - start > maxRange) {
    throw new Error('Time range cannot exceed 1 year');
  }
  
  return { startTime: start, endTime: end };
}

/**
 * Get callsigns that were active on a specific talkgroup during a time range
 */
export async function getCallsignsByTalkgroup(req: Request, res: Response) {
  try {
    const { talkgroupId } = req.params;
    const { startTime, endTime } = parseTimeRange(req);
    
    if (!talkgroupId || isNaN(parseInt(talkgroupId))) {
      return res.status(400).json({ 
        error: 'Valid talkgroupId parameter is required' 
      });
    }
    
    const destinationId = parseInt(talkgroupId);
    const callsigns = await SummaryService.getCallsignsByTalkgroup(
      destinationId, 
      startTime, 
      endTime
    );
    
    res.json({
      talkgroupId: destinationId,
      startTime,
      endTime,
      totalCallsigns: callsigns.length,
      callsigns
    });
    
  } catch (error: any) {
    console.error('Error getting callsigns by talkgroup:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Get talkgroup activity summary for a time range
 */
export async function getTalkgroupActivity(req: Request, res: Response) {
  try {
    const { startTime, endTime } = parseTimeRange(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    if (limit > 500) {
      return res.status(400).json({ 
        error: 'Limit cannot exceed 500' 
      });
    }
    
    const activity = await SummaryService.getTalkgroupActivity(
      startTime, 
      endTime, 
      limit
    );
    
    res.json({
      startTime,
      endTime,
      limit,
      totalTalkgroups: activity.length,
      talkgroups: activity
    });
    
  } catch (error: any) {
    console.error('Error getting talkgroup activity:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Get hourly activity breakdown
 */
export async function getHourlyActivity(req: Request, res: Response) {
  try {
    const { startTime, endTime } = parseTimeRange(req);
    const talkgroupId = req.query.talkgroupId ? 
      parseInt(req.query.talkgroupId as string) : undefined;
    
    if (req.query.talkgroupId && isNaN(talkgroupId!)) {
      return res.status(400).json({ 
        error: 'talkgroupId must be a valid number' 
      });
    }
    
    const activity = await SummaryService.getHourlyActivity(
      startTime, 
      endTime, 
      talkgroupId
    );
    
    res.json({
      startTime,
      endTime,
      talkgroupId,
      totalHours: activity.length,
      hourlyActivity: activity
    });
    
  } catch (error: any) {
    console.error('Error getting hourly activity:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Manually trigger summary processing (admin endpoint)
 */
export async function triggerSummaryProcessing(req: Request, res: Response) {
  try {
    // This would typically require admin authentication
    console.log('Manual summary processing triggered');
    
    // Run in background to avoid timeout
    SummaryService.runIncrementalSummary()
      .then(() => {
        console.log('Manual summary processing completed');
      })
      .catch((error) => {
        console.error('Manual summary processing failed:', error);
      });
    
    res.json({ 
      message: 'Summary processing started in background',
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error: any) {
    console.error('Error triggering summary processing:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get summary processing status and statistics
 */
export async function getSummaryStatus(req: Request, res: Response) {
  try {
    // Get latest processing log entries
    const recentLogs = await SummaryService.getRecentProcessingLogs(10);
    
    // Get summary statistics
    const stats = await SummaryService.getSummaryStatistics();
    
    res.json({
      processingLogs: recentLogs,
      statistics: stats,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error: any) {
    console.error('Error getting summary status:', error);
    res.status(500).json({ error: error.message });
  }
}