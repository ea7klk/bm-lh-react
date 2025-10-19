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
    const timeFilter = req.query.time as string; // in minutes
    const continent = req.query.continent as string;
    const country = req.query.country as string;

    if (USE_MOCK_DATA) {
      let filteredData = [...mockData];
      
      // Apply time filter on mock data
      if (timeFilter) {
        const minutesAgo = parseInt(timeFilter);
        const cutoffTime = Math.floor(Date.now() / 1000) - (minutesAgo * 60);
        filteredData = filteredData.filter(entry => (entry.Start || entry.created_at || 0) >= cutoffTime);
      }
      
      const data = filteredData.slice(offset, offset + limit);
      return res.json({
        success: true,
        data,
        total: data.length,
      });
    }

    // Build dynamic query with filters
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    // Time filter
    if (timeFilter) {
      const minutesAgo = parseInt(timeFilter);
      if (!isNaN(minutesAgo)) {
        paramCount++;
        whereConditions.push(`lh."Start" >= EXTRACT(EPOCH FROM NOW()) - ($${paramCount} * 60)`);
        queryParams.push(minutesAgo);
      }
    }

    // Continent filter
    if (continent && continent !== 'all') {
      paramCount++;
      whereConditions.push(`tg.continent = $${paramCount}`);
      queryParams.push(continent);
    }

    // Country filter
    if (country && country !== 'all') {
      paramCount++;
      whereConditions.push(`tg.country = $${paramCount}`);
      queryParams.push(country);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Add limit and offset to params
    queryParams.push(limit, offset);
    const limitParam = paramCount + 1;
    const offsetParam = paramCount + 2;

    const query = `
      SELECT lh.*, 
             tg.continent, 
             tg.country, 
             tg.full_country_name,
             tg.name as talkgroup_name
      FROM lastheard lh
      LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
      ${whereClause}
      ORDER BY lh."Start" DESC 
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM lastheard lh
      LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount));
    const total = parseInt(countResult.rows[0]?.total || '0');

    res.json({
      success: true,
      data: result.rows,
      total: total,
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

export const getContinents = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT continent 
      FROM talkgroups 
      WHERE continent IS NOT NULL 
      ORDER BY continent
    `);
    
    res.json({
      success: true,
      data: result.rows.map(row => row.continent),
    });
  } catch (error) {
    console.error('Error fetching continents:', error);
    res.json({
      success: true,
      data: ['Europe', 'North America', 'Asia', 'Oceania', 'Africa', 'South America', 'Global'],
    });
  }
};

export const getCountries = async (req: Request, res: Response) => {
  try {
    const { continent } = req.query;
    
    let query = `
      SELECT DISTINCT country, full_country_name 
      FROM talkgroups 
      WHERE country IS NOT NULL
    `;
    const params: any[] = [];
    
    if (continent && continent !== 'all') {
      query += ` AND continent = $1`;
      params.push(continent);
    }
    
    query += ` ORDER BY full_country_name`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.json({
      success: true,
      data: [],
    });
  }
};

export const pollNewEntries = async (req: Request, res: Response) => {
  try {
    const lastUpdateTimestamp = req.query.lastUpdate as string;
    const timeFilter = req.query.time as string; // in minutes
    const continent = req.query.continent as string;
    const country = req.query.country as string;
    const limit = parseInt(req.query.limit as string) || 100;

    if (USE_MOCK_DATA) {
      // For mock data, just return empty since we don't have real-time updates
      return res.json({
        success: true,
        data: [],
        newEntries: 0,
      });
    }

    // Build dynamic query with filters
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    // Always filter by timestamp if provided
    if (lastUpdateTimestamp) {
      const lastUpdate = parseFloat(lastUpdateTimestamp);
      if (!isNaN(lastUpdate)) {
        paramCount++;
        whereConditions.push(`lh.created_at > $${paramCount}`);
        queryParams.push(Math.floor(lastUpdate)); // Convert to integer for bigint compatibility
      }
    }

    // Time filter - only include entries within the specified time range
    if (timeFilter) {
      const minutesAgo = parseInt(timeFilter);
      if (!isNaN(minutesAgo)) {
        paramCount++;
        whereConditions.push(`lh."Start" >= EXTRACT(EPOCH FROM NOW()) - ($${paramCount} * 60)`);
        queryParams.push(minutesAgo);
      }
    }

    // Continent filter
    if (continent && continent !== 'all') {
      paramCount++;
      whereConditions.push(`tg.continent = $${paramCount}`);
      queryParams.push(continent);
    }

    // Country filter
    if (country && country !== 'all') {
      paramCount++;
      whereConditions.push(`tg.country = $${paramCount}`);
      queryParams.push(country);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT lh.*, 
             tg.continent, 
             tg.country, 
             tg.full_country_name,
             tg.name as talkgroup_name
      FROM lastheard lh
      LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
      ${whereClause}
      ORDER BY lh."Start" DESC 
      LIMIT ${limit}
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
      newEntries: result.rows.length,
      lastUpdate: Math.floor(Date.now() / 1000), // Current timestamp for next poll as integer
    });
  } catch (error) {
    console.error('Error polling new entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to poll new entries',
    });
  }
};
