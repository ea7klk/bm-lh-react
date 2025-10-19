import { Router } from 'express';
import {
  getLastHeard,
  getLastHeardById,
  createLastHeard,
  getContinents,
  getCountries,
  pollNewEntries,
  getTalkgroupStats,
} from '../controllers/lastHeardController';

const router = Router();

// Note: More specific routes must come before parameterized routes
router.get('/continents', getContinents);
router.get('/countries', getCountries);
router.get('/stats/talkgroups', getTalkgroupStats);
router.get('/poll', pollNewEntries);
router.get('/', getLastHeard);
router.get('/:id', getLastHeardById);
router.post('/', createLastHeard);

export default router;
