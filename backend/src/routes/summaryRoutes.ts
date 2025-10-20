import { Router } from 'express';
import {
  getCallsignsByTalkgroup,
  getTalkgroupActivity,
  getHourlyActivity,
  triggerSummaryProcessing,
  getSummaryStatus
} from '../controllers/summaryController';

const router = Router();

/**
 * @route GET /api/summary/talkgroups/:talkgroupId/callsigns
 * @desc Get callsigns active on a specific talkgroup during a time range
 * @query startTime (unix timestamp), endTime (unix timestamp)
 */
router.get('/talkgroups/:talkgroupId/callsigns', getCallsignsByTalkgroup);

/**
 * @route GET /api/summary/talkgroups
 * @desc Get talkgroup activity summary for a time range
 * @query startTime (unix timestamp), endTime (unix timestamp), limit (optional, default 50)
 */
router.get('/talkgroups', getTalkgroupActivity);

/**
 * @route GET /api/summary/hourly
 * @desc Get hourly activity breakdown
 * @query startTime (unix timestamp), endTime (unix timestamp), talkgroupId (optional)
 */
router.get('/hourly', getHourlyActivity);

/**
 * @route POST /api/summary/process
 * @desc Manually trigger summary processing (admin endpoint)
 */
router.post('/process', triggerSummaryProcessing);

/**
 * @route GET /api/summary/status
 * @desc Get summary processing status and statistics
 */
router.get('/status', getSummaryStatus);

export default router;