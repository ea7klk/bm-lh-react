import { Router } from 'express';
import {
  getCallsignsByTalkgroup,
  getTalkgroupActivity,
  getHourlyActivity,
  triggerSummaryProcessing,
  getSummaryStatus
} from '../controllers/summaryController';

const router = Router();

// Get callsigns that were active on a specific talkgroup during a time range
// GET /api/summary/talkgroup/:talkgroupId/callsigns?startTime=123456&endTime=789012
router.get('/talkgroup/:talkgroupId/callsigns', getCallsignsByTalkgroup);

// Get talkgroup activity summary for a time range
// GET /api/summary/talkgroups?startTime=123456&endTime=789012&limit=50
router.get('/talkgroups', getTalkgroupActivity);

// Get hourly activity breakdown
// GET /api/summary/hourly?startTime=123456&endTime=789012&talkgroupId=123
router.get('/hourly', getHourlyActivity);

// Manually trigger summary processing (admin endpoint)
// POST /api/summary/process
router.post('/process', triggerSummaryProcessing);

// Get summary processing status and statistics
// GET /api/summary/status
router.get('/status', getSummaryStatus);

export default router;