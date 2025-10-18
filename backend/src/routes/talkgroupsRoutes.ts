import express from 'express';
import {
  updateTalkgroups,
  getAllTalkgroups,
  getTalkgroupById,
  getTalkgroupsByContinent,
  getTalkgroupsByCountry
} from '../services/talkgroupsService';

const router = express.Router();

// Update talkgroups from Brandmeister API
router.post('/update', async (req, res) => {
  try {
    const result = await updateTalkgroups();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all talkgroups
router.get('/', async (req, res) => {
  try {
    const talkgroups = await getAllTalkgroups();
    res.json(talkgroups);
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get talkgroup by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid talkgroup ID' });
    }

    const talkgroup = await getTalkgroupById(id);
    if (talkgroup) {
      res.json(talkgroup);
    } else {
      res.status(404).json({ error: 'Talkgroup not found' });
    }
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get talkgroups by continent
router.get('/continent/:continent', async (req, res) => {
  try {
    const continent = req.params.continent;
    const talkgroups = await getTalkgroupsByContinent(continent);
    res.json(talkgroups);
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get talkgroups by country
router.get('/country/:country', async (req, res) => {
  try {
    const country = req.params.country;
    const talkgroups = await getTalkgroupsByCountry(country);
    res.json(talkgroups);
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;