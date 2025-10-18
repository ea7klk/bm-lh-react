import { Router } from 'express';
import {
  getLastHeard,
  getLastHeardById,
  createLastHeard,
} from '../controllers/lastHeardController';

const router = Router();

router.get('/', getLastHeard);
router.get('/:id', getLastHeardById);
router.post('/', createLastHeard);

export default router;
