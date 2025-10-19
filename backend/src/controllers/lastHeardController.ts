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

export const getTalkgroupStats = async (req: Request, res: Response) => {
  try {
    const timeFilter = req.query.time as string; // in minutes
    const continent = req.query.continent as string;
    const country = req.query.country as string;
    const limit = parseInt(req.query.limit as string) || 20; // Default to top 20

    if (USE_MOCK_DATA) {
      // Return mock talkgroup stats
      const mockStats = [
        { talkgroup_id: 214, name: 'Spain', count: 45, continent: 'Europe', country: 'ES' },
        { talkgroup_id: 208, name: 'France', count: 38, continent: 'Europe', country: 'FR' },
        { talkgroup_id: 262, name: 'Germany', count: 32, continent: 'Europe', country: 'DE' },
        { talkgroup_id: 235, name: 'United Kingdom', count: 28, continent: 'Europe', country: 'GB' },
        { talkgroup_id: 222, name: 'Italy', count: 24, continent: 'Europe', country: 'IT' },
      ];
      
      return res.json({
        success: true,
        data: mockStats.slice(0, limit),
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

    // Add limit to params
    queryParams.push(limit);
    const limitParam = paramCount + 1;

    const query = `
      SELECT 
        lh."DestinationID" as talkgroup_id,
        COALESCE(tg.name, lh."DestinationName", 'Unknown') as name,
        COUNT(*) as count,
        tg.continent,
        tg.country,
        tg.full_country_name
      FROM lastheard lh
      LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
      ${whereClause}
      GROUP BY lh."DestinationID", tg.name, lh."DestinationName", tg.continent, tg.country, tg.full_country_name
      ORDER BY count DESC
      LIMIT $${limitParam}
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching talkgroup stats:', error);
    
    // Fallback to mock data if database fails
    const mockStats = [
      { talkgroup_id: 214, name: 'Spain', count: 45, continent: 'Europe', country: 'ES' },
      { talkgroup_id: 208, name: 'France', count: 38, continent: 'Europe', country: 'FR' },
      { talkgroup_id: 262, name: 'Germany', count: 32, continent: 'Europe', country: 'DE' },
    ];
    
    res.json({
      success: true,
      data: mockStats.slice(0, 20),
      warning: 'Using mock data - database not available',
    });
  }
};

export const getTalkgroupDurationStats = async (req: Request, res: Response) => {
  try {
    const timeFilter = req.query.time as string; // in minutes
    const continent = req.query.continent as string;
    const country = req.query.country as string;
    const limit = parseInt(req.query.limit as string) || 20; // Default to top 20

    if (USE_MOCK_DATA) {
      // Return mock talkgroup duration stats
      const mockDurationStats = [
        { talkgroup_id: 214, name: 'Spain', total_duration: 1200, continent: 'Europe', country: 'ES' },
        { talkgroup_id: 208, name: 'France', total_duration: 950, continent: 'Europe', country: 'FR' },
        { talkgroup_id: 262, name: 'Germany', total_duration: 860, continent: 'Europe', country: 'DE' },
        { talkgroup_id: 235, name: 'United Kingdom', total_duration: 720, continent: 'Europe', country: 'GB' },
        { talkgroup_id: 222, name: 'Italy', total_duration: 650, continent: 'Europe', country: 'IT' },
      ];
      
      return res.json({
        success: true,
        data: mockDurationStats.slice(0, limit),
      });
    }

    // Build dynamic query with filters
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    // Time filter is required for the new query structure
    let timeFilterMinutes = 15; // Default to 15 minutes if not specified
    if (timeFilter) {
      const minutesAgo = parseInt(timeFilter);
      if (!isNaN(minutesAgo)) {
        timeFilterMinutes = minutesAgo;
      }
    }
    
    // Add time filter minutes as first parameter
    queryParams.push(timeFilterMinutes);
    paramCount = 1;

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

    // Add limit to params
    queryParams.push(limit);
    const limitParam = paramCount + 1;

    const query = `
      WITH time_window AS (
        SELECT $1::integer * 60 as window_seconds,
               EXTRACT(EPOCH FROM NOW()) as current_time
      ),
      filtered_qsos AS (
        SELECT 
          lh."DestinationID",
          COALESCE(tg.name, lh."DestinationName", 'Unknown') as name,
          tg.continent,
          tg.country,
          tg.full_country_name,
          -- Clip QSO times to the time window boundaries
          GREATEST(lh."Start", tw.current_time - tw.window_seconds) as start_time,
          LEAST(lh."Stop", tw.current_time) as end_time
        FROM lastheard lh
        LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
        CROSS JOIN time_window tw
        WHERE lh.duration IS NOT NULL 
          AND lh.duration > 0 
          AND lh."Stop" IS NOT NULL
          AND lh."Start" < tw.current_time
          AND lh."Stop" > tw.current_time - tw.window_seconds
          ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      ),
      talkgroup_durations AS (
        SELECT 
          "DestinationID",
          name,
          continent,
          country,
          full_country_name,
          SUM(end_time - start_time) as raw_duration
        FROM filtered_qsos
        GROUP BY "DestinationID", name, continent, country, full_country_name
      )
      SELECT 
        "DestinationID" as talkgroup_id,
        name,
        -- Cap the duration at the time window to prevent impossible values
        LEAST(raw_duration, (SELECT window_seconds FROM time_window)) as total_duration,
        continent,
        country,
        full_country_name
      FROM talkgroup_durations
      ORDER BY total_duration DESC
      LIMIT $${limitParam}
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching talkgroup duration stats:', error);
    
    // Fallback to mock data if database fails
    const mockDurationStats = [
      { talkgroup_id: 214, name: 'Spain', total_duration: 1200, continent: 'Europe', country: 'ES' },
      { talkgroup_id: 208, name: 'France', total_duration: 950, continent: 'Europe', country: 'FR' },
      { talkgroup_id: 262, name: 'Germany', total_duration: 860, continent: 'Europe', country: 'DE' },
    ];
    
    res.json({
      success: true,
      data: mockDurationStats.slice(0, 20),
      warning: 'Using mock data - database not available',
    });
  }
};
