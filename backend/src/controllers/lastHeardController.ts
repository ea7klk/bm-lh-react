import { Request, Response } from 'express';
import pool from '../config/database';
import { LastHeardEntry } from '../models/LastHeard';

export const getLastHeard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch last heard data',
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
