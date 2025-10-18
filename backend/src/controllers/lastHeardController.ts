import { Request, Response } from 'express';
import pool from '../config/database';
import { LastHeardEntry } from '../models/LastHeard';

// Mock data for testing without database
const mockData: LastHeardEntry[] = [
  {
    id: 1,
    SourceID: 2147001,
    DestinationID: 214,
    SourceCall: 'EA7KLK',
    SourceName: 'John Doe',
    DestinationCall: '214',
    DestinationName: 'Spain',
    Start: Math.floor(Date.now() / 1000) - 60,
    Stop: Math.floor(Date.now() / 1000) - 60 + 120,
    TalkerAlias: 'JD',
    duration: 120,
    created_at: Math.floor(Date.now() / 1000) - 60,
  },
  {
    id: 2,
    SourceID: 2143002,
    DestinationID: 214,
    SourceCall: 'EA3ABC',
    SourceName: 'Jane Smith',
    DestinationCall: '214',
    DestinationName: 'Spain',
    Start: Math.floor(Date.now() / 1000) - 300,
    Stop: Math.floor(Date.now() / 1000) - 300 + 85,
    TalkerAlias: 'JS',
    duration: 85,
    created_at: Math.floor(Date.now() / 1000) - 300,
  },
  {
    id: 3,
    SourceID: 2081234,
    DestinationID: 208,
    SourceCall: 'F1XYZ',
    SourceName: 'Pierre Martin',
    DestinationCall: '208',
    DestinationName: 'France',
    Start: Math.floor(Date.now() / 1000) - 600,
    Stop: Math.floor(Date.now() / 1000) - 600 + 150,
    TalkerAlias: 'PM',
    duration: 150,
    created_at: Math.floor(Date.now() / 1000) - 600,
  },
  {
    id: 4,
    SourceID: 2341567,
    DestinationID: 234,
    SourceCall: 'G7DEF',
    SourceName: 'Alice Brown',
    DestinationCall: '234',
    DestinationName: 'United Kingdom',
    Start: Math.floor(Date.now() / 1000) - 900,
    Stop: Math.floor(Date.now() / 1000) - 900 + 95,
    TalkerAlias: 'AB',
    duration: 95,
    created_at: Math.floor(Date.now() / 1000) - 900,
  },
  {
    id: 5,
    SourceID: 2621890,
    DestinationID: 262,
    SourceCall: 'DL9GHI',
    SourceName: 'Hans Mueller',
    DestinationCall: '262',
    DestinationName: 'Germany',
    Start: Math.floor(Date.now() / 1000) - 1200,
    Stop: Math.floor(Date.now() / 1000) - 1200 + 200,
    TalkerAlias: 'HM',
    duration: 200,
    created_at: Math.floor(Date.now() / 1000) - 1200,
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
      `SELECT * FROM lastheard 
       ORDER BY "Start" DESC 
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
      'SELECT * FROM lastheard WHERE id = $1',
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
      SourceID,
      DestinationID,
      SourceCall,
      SourceName,
      DestinationCall,
      DestinationName,
      Start,
      Stop,
      TalkerAlias,
      duration,
    }: LastHeardEntry = req.body;

    const result = await pool.query(
      `INSERT INTO lastheard 
       ("SourceID", "DestinationID", "SourceCall", "SourceName", "DestinationCall", "DestinationName", "Start", "Stop", "TalkerAlias", duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [SourceID, DestinationID, SourceCall, SourceName, DestinationCall, DestinationName, Start, Stop, TalkerAlias, duration]
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
