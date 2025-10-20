import pool from '../config/database';

interface SummaryProcessingState {
  lastProcessedTimestamp: number;
  lastProcessedRecordId: number;
}

interface HourlySummaryData {
  hourStart: number;
  hourEnd: number;
  sourceId: number;
  sourceCall: string;
  sourceName?: string;
  destinationId: number;
  destinationCall?: string;
  destinationName?: string;
  totalCalls: number;
  totalDuration: number;
  avgDuration: number;
  minDuration?: number;
  maxDuration?: number;
  firstCallStart?: number;
  lastCallStart?: number;
}

export class SummaryService {
  private static readonly BATCH_SIZE = 1000;
  private static readonly HOUR_IN_SECONDS = 3600;

  /**
   * Main method to run incremental summarization
   */
  public static async runIncrementalSummary(): Promise<void> {
    console.log('Starting incremental summary process...');
    
    try {
      const state = await this.getLastProcessingState();
      const logId = await this.startProcessingLog(state);
      
      let processedRecords = 0;
      let hasMoreData = true;
      
      while (hasMoreData) {
        const batch = await this.getNextBatch(state);
        
        if (batch.length === 0) {
          hasMoreData = false;
          break;
        }

        const summaries = await this.aggregateDataByHour(batch);
        await this.upsertHourlySummaries(summaries);
        
        // Update processing state
        const lastRecord = batch[batch.length - 1];
        state.lastProcessedTimestamp = lastRecord.Start;
        state.lastProcessedRecordId = lastRecord.id!;
        
        processedRecords += batch.length;
        
        // Update log
        await this.updateProcessingLog(logId, processedRecords, state);
        
        console.log(`Processed batch of ${batch.length} records. Total: ${processedRecords}`);
      }
      
      await this.completeProcessingLog(logId, processedRecords);
      console.log(`Incremental summary completed. Total records processed: ${processedRecords}`);
      
    } catch (error) {
      console.error('Error in incremental summary:', error);
      throw error;
    }
  }

  /**
   * Get the last processing state
   */
  private static async getLastProcessingState(): Promise<SummaryProcessingState> {
    const query = `
      SELECT last_processed_timestamp, last_processed_record_id
      FROM summary_processing_log
      WHERE status = 'completed'
      ORDER BY processing_completed_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      // First run - start from the beginning
      return {
        lastProcessedTimestamp: 0,
        lastProcessedRecordId: 0
      };
    }
    
    return {
      lastProcessedTimestamp: result.rows[0].last_processed_timestamp,
      lastProcessedRecordId: result.rows[0].last_processed_record_id
    };
  }

  /**
   * Get next batch of records to process
   */
  private static async getNextBatch(state: SummaryProcessingState): Promise<any[]> {
    const query = `
      SELECT id, "SourceID", "DestinationID", "SourceCall", "SourceName",
             "DestinationCall", "DestinationName", "Start", "Stop", duration
      FROM lastheard
      WHERE ("Start" > $1 OR ("Start" = $1 AND id > $2))
      ORDER BY "Start" ASC, id ASC
      LIMIT $3
    `;
    
    const result = await pool.query(query, [
      state.lastProcessedTimestamp,
      state.lastProcessedRecordId,
      this.BATCH_SIZE
    ]);
    
    return result.rows;
  }

  /**
   * Aggregate data by hour
   */
  private static async aggregateDataByHour(records: any[]): Promise<Map<string, HourlySummaryData>> {
    const summaries = new Map<string, HourlySummaryData>();
    
    for (const record of records) {
      const hourStart = Math.floor(record.Start / this.HOUR_IN_SECONDS) * this.HOUR_IN_SECONDS;
      const hourEnd = hourStart + this.HOUR_IN_SECONDS - 1;
      
      // Create unique key for this combination
      const key = `${hourStart}_${record.SourceID}_${record.DestinationID}`;
      
      if (!summaries.has(key)) {
        summaries.set(key, {
          hourStart,
          hourEnd,
          sourceId: record.SourceID,
          sourceCall: record.SourceCall,
          sourceName: record.SourceName,
          destinationId: record.DestinationID,
          destinationCall: record.DestinationCall,
          destinationName: record.DestinationName,
          totalCalls: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: undefined,
          maxDuration: undefined,
          firstCallStart: undefined,
          lastCallStart: undefined
        });
      }
      
      const summary = summaries.get(key)!;
      
      // Update aggregations
      summary.totalCalls++;
      
      const duration = record.duration || 0;
      summary.totalDuration += duration;
      
      if (duration > 0) {
        summary.minDuration = summary.minDuration === undefined ? duration : Math.min(summary.minDuration, duration);
        summary.maxDuration = summary.maxDuration === undefined ? duration : Math.max(summary.maxDuration, duration);
      }
      
      summary.firstCallStart = summary.firstCallStart === undefined ? record.Start : Math.min(summary.firstCallStart, record.Start);
      summary.lastCallStart = summary.lastCallStart === undefined ? record.Start : Math.max(summary.lastCallStart, record.Start);
    }
    
    // Calculate averages
    for (const summary of summaries.values()) {
      summary.avgDuration = summary.totalCalls > 0 ? Math.round(summary.totalDuration / summary.totalCalls) : 0;
    }
    
    return summaries;
  }

  /**
   * Upsert hourly summaries (insert or update if exists)
   */
  private static async upsertHourlySummaries(summaries: Map<string, HourlySummaryData>): Promise<void> {
    if (summaries.size === 0) return;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const summary of summaries.values()) {
        const upsertQuery = `
          INSERT INTO lastheard_hourly_summary (
            hour_start, hour_end, source_id, source_call, source_name,
            destination_id, destination_call, destination_name,
            total_calls, total_duration, avg_duration, min_duration, max_duration,
            first_call_start, last_call_start, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (hour_start, source_id, destination_id)
          DO UPDATE SET
            source_call = EXCLUDED.source_call,
            source_name = EXCLUDED.source_name,
            destination_call = EXCLUDED.destination_call,
            destination_name = EXCLUDED.destination_name,
            total_calls = lastheard_hourly_summary.total_calls + EXCLUDED.total_calls,
            total_duration = lastheard_hourly_summary.total_duration + EXCLUDED.total_duration,
            avg_duration = CASE 
              WHEN (lastheard_hourly_summary.total_calls + EXCLUDED.total_calls) > 0 
              THEN (lastheard_hourly_summary.total_duration + EXCLUDED.total_duration) / (lastheard_hourly_summary.total_calls + EXCLUDED.total_calls)
              ELSE 0 
            END,
            min_duration = CASE 
              WHEN EXCLUDED.min_duration IS NOT NULL AND lastheard_hourly_summary.min_duration IS NOT NULL 
              THEN LEAST(lastheard_hourly_summary.min_duration, EXCLUDED.min_duration)
              WHEN EXCLUDED.min_duration IS NOT NULL 
              THEN EXCLUDED.min_duration
              ELSE lastheard_hourly_summary.min_duration
            END,
            max_duration = CASE 
              WHEN EXCLUDED.max_duration IS NOT NULL AND lastheard_hourly_summary.max_duration IS NOT NULL 
              THEN GREATEST(lastheard_hourly_summary.max_duration, EXCLUDED.max_duration)
              WHEN EXCLUDED.max_duration IS NOT NULL 
              THEN EXCLUDED.max_duration
              ELSE lastheard_hourly_summary.max_duration
            END,
            first_call_start = CASE 
              WHEN EXCLUDED.first_call_start IS NOT NULL AND lastheard_hourly_summary.first_call_start IS NOT NULL 
              THEN LEAST(lastheard_hourly_summary.first_call_start, EXCLUDED.first_call_start)
              WHEN EXCLUDED.first_call_start IS NOT NULL 
              THEN EXCLUDED.first_call_start
              ELSE lastheard_hourly_summary.first_call_start
            END,
            last_call_start = CASE 
              WHEN EXCLUDED.last_call_start IS NOT NULL AND lastheard_hourly_summary.last_call_start IS NOT NULL 
              THEN GREATEST(lastheard_hourly_summary.last_call_start, EXCLUDED.last_call_start)
              WHEN EXCLUDED.last_call_start IS NOT NULL 
              THEN EXCLUDED.last_call_start
              ELSE lastheard_hourly_summary.last_call_start
            END,
            updated_at = EXCLUDED.updated_at
        `;
        
        await client.query(upsertQuery, [
          summary.hourStart,
          summary.hourEnd,
          summary.sourceId,
          summary.sourceCall,
          summary.sourceName,
          summary.destinationId,
          summary.destinationCall,
          summary.destinationName,
          summary.totalCalls,
          summary.totalDuration,
          summary.avgDuration,
          summary.minDuration,
          summary.maxDuration,
          summary.firstCallStart,
          summary.lastCallStart,
          Math.floor(Date.now() / 1000)
        ]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Start processing log entry
   */
  private static async startProcessingLog(state: SummaryProcessingState): Promise<number> {
    const query = `
      INSERT INTO summary_processing_log (
        last_processed_timestamp, last_processed_record_id, 
        processing_started_at, status
      ) VALUES ($1, $2, $3, 'in_progress')
      RETURNING id
    `;
    
    const result = await pool.query(query, [
      state.lastProcessedTimestamp,
      state.lastProcessedRecordId,
      Math.floor(Date.now() / 1000)
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Update processing log
   */
  private static async updateProcessingLog(
    logId: number, 
    recordsProcessed: number, 
    state: SummaryProcessingState
  ): Promise<void> {
    const query = `
      UPDATE summary_processing_log 
      SET last_processed_timestamp = $1, 
          last_processed_record_id = $2,
          records_processed = $3
      WHERE id = $4
    `;
    
    await pool.query(query, [
      state.lastProcessedTimestamp,
      state.lastProcessedRecordId,
      recordsProcessed,
      logId
    ]);
  }

  /**
   * Complete processing log
   */
  private static async completeProcessingLog(logId: number, recordsProcessed: number): Promise<void> {
    const query = `
      UPDATE summary_processing_log 
      SET processing_completed_at = $1, 
          records_processed = $2,
          status = 'completed'
      WHERE id = $3
    `;
    
    await pool.query(query, [
      Math.floor(Date.now() / 1000),
      recordsProcessed,
      logId
    ]);
  }

  /**
   * Query methods for accessing summarized data
   */
  
  /**
   * Get callsigns by talkgroup for a time range
   */
  public static async getCallsignsByTalkgroup(
    destinationId: number,
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    const query = `
      SELECT 
        source_call,
        source_name,
        SUM(total_calls) as total_calls,
        SUM(total_duration) as total_duration,
        AVG(avg_duration) as avg_duration,
        MIN(first_call_start) as first_activity,
        MAX(last_call_start) as last_activity
      FROM lastheard_hourly_summary
      WHERE destination_id = $1
        AND hour_start >= $2
        AND hour_end <= $3
      GROUP BY source_call, source_name
      ORDER BY total_calls DESC, total_duration DESC
    `;
    
    const result = await pool.query(query, [destinationId, startTime, endTime]);
    return result.rows;
  }

  /**
   * Get talkgroup activity summary for a time range
   */
  public static async getTalkgroupActivity(
    startTime: number,
    endTime: number,
    limit: number = 50
  ): Promise<any[]> {
    const query = `
      SELECT 
        destination_id,
        destination_name,
        destination_call,
        SUM(total_calls) as total_calls,
        SUM(total_duration) as total_duration,
        COUNT(DISTINCT source_call) as unique_callsigns,
        AVG(avg_duration) as avg_duration,
        MIN(first_call_start) as first_activity,
        MAX(last_call_start) as last_activity
      FROM lastheard_hourly_summary
      WHERE hour_start >= $1
        AND hour_end <= $2
      GROUP BY destination_id, destination_name, destination_call
      ORDER BY total_calls DESC, total_duration DESC
      LIMIT $3
    `;
    
    const result = await pool.query(query, [startTime, endTime, limit]);
    return result.rows;
  }

  /**
   * Get hourly activity breakdown
   */
  public static async getHourlyActivity(
    startTime: number,
    endTime: number,
    destinationId?: number
  ): Promise<any[]> {
    let query = `
      SELECT 
        hour_start,
        hour_end,
        SUM(total_calls) as total_calls,
        SUM(total_duration) as total_duration,
        COUNT(DISTINCT source_call) as unique_callsigns,
        COUNT(DISTINCT destination_id) as unique_talkgroups
      FROM lastheard_hourly_summary
      WHERE hour_start >= $1 AND hour_end <= $2
    `;
    
    const params = [startTime, endTime];
    
    if (destinationId) {
      query += ` AND destination_id = $3`;
      params.push(destinationId);
    }
    
    query += `
      GROUP BY hour_start, hour_end
      ORDER BY hour_start ASC
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get recent processing logs
   */
  public static async getRecentProcessingLogs(limit: number = 10): Promise<any[]> {
    const query = `
      SELECT 
        id,
        last_processed_timestamp,
        last_processed_record_id,
        processing_started_at,
        processing_completed_at,
        records_processed,
        status,
        error_message,
        created_at
      FROM summary_processing_log
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get summary statistics
   */
  public static async getSummaryStatistics(): Promise<any> {
    const queries = {
      totalSummaryRecords: 'SELECT COUNT(*) as count FROM lastheard_hourly_summary',
      oldestSummaryHour: 'SELECT MIN(hour_start) as oldest_hour FROM lastheard_hourly_summary',
      newestSummaryHour: 'SELECT MAX(hour_start) as newest_hour FROM lastheard_hourly_summary',
      uniqueTalkgroups: 'SELECT COUNT(DISTINCT destination_id) as count FROM lastheard_hourly_summary',
      uniqueCallsigns: 'SELECT COUNT(DISTINCT source_call) as count FROM lastheard_hourly_summary',
      totalCalls: 'SELECT SUM(total_calls) as total FROM lastheard_hourly_summary',
      totalDuration: 'SELECT SUM(total_duration) as total FROM lastheard_hourly_summary',
      lastProcessingRun: `
        SELECT 
          processing_completed_at,
          records_processed,
          status
        FROM summary_processing_log 
        WHERE status = 'completed'
        ORDER BY processing_completed_at DESC 
        LIMIT 1
      `
    };

    const results: any = {};

    for (const [key, query] of Object.entries(queries)) {
      try {
        const result = await pool.query(query);
        results[key] = result.rows[0];
      } catch (error) {
        console.error(`Error executing query for ${key}:`, error);
        results[key] = null;
      }
    }

    return results;
  }
}