import { Request, Response } from 'express';
import pool from '../config/database';
import { LastHeardEntry } from '../models/LastHeard';

// Mock data for testing without database
const mockData: LastHeardEntry[] = [
  {
    id: 1,
    callsign: 'EA7KLK',
    name: 'John Doe',
    dmr_id: 2147001,
    target_id: 214,
    target_name: 'Spain',
    source: 'BM Master',
    duration: 120,
    timestamp: new Date(Date.now() - 60000),
    slot: 2,
    reflector: 4400,
  },
  {
    id: 2,
    callsign: 'EA3ABC',
    name: 'Jane Smith',
    dmr_id: 2143002,
    target_id: 214,
    target_name: 'Spain',
    source: 'BM Master',
    duration: 85,
    timestamp: new Date(Date.now() - 300000),
    slot: 1,
    reflector: 4400,
  },
  {
    id: 3,
    callsign: 'F1XYZ',
    name: 'Pierre Martin',
    dmr_id: 2081234,
    target_id: 208,
    target_name: 'France',
    source: 'BM Master',
    duration: 150,
    timestamp: new Date(Date.now() - 600000),
    slot: 2,
    reflector: 4400,
  },
  {
    id: 4,
    callsign: 'G7DEF',
    name: 'Alice Brown',
    dmr_id: 2341567,
    target_id: 234,
    target_name: 'United Kingdom',
    source: 'BM Master',
    duration: 95,
    timestamp: new Date(Date.now() - 900000),
    slot: 1,
    reflector: 4400,
  },
  {
    id: 5,
    callsign: 'DL9GHI',
    name: 'Hans Mueller',
    dmr_id: 2621890,
    target_id: 262,
    target_name: 'Germany',
    source: 'BM Master',
    duration: 200,
    timestamp: new Date(Date.now() - 1200000),
    slot: 2,
    reflector: 4400,
  },
];

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

export const getLastHeard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (USE_MOCK_DATA) {
      const data = mockData.slice(offset, offset + limit);
      return res.json({
        success: true,
        data,
        total: data.length,
      });
    }

    const result = await pool.query(
      `SELECT * FROM last_heard 
       ORDER BY timestamp DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Error fetching last heard:', error);
    
    // Fallback to mock data if database fails
    const data = mockData.slice(0, 50);
    res.json({
      success: true,
      data,
      total: data.length,
      warning: 'Using mock data - database not available',
    });
  }
};

export const getLastHeardById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM last_heard WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entry',
    });
  }
};

export const createLastHeard = async (req: Request, res: Response) => {
  try {
    const {
      callsign,
      name,
      dmr_id,
      target_id,
      target_name,
      source,
      duration,
      slot,
      reflector,
    }: LastHeardEntry = req.body;

    const result = await pool.query(
      `INSERT INTO last_heard 
       (callsign, name, dmr_id, target_id, target_name, source, duration, slot, reflector, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [callsign, name, dmr_id, target_id, target_name, source, duration, slot, reflector]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create entry',
    });
  }
};
