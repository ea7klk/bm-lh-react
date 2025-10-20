# LastHeard Data Summarization Strategy

## Overview

This document outlines the strategy for periodically and incrementally summarizing data from the `lastheard` table to enable efficient querying of historical data aggregated by time periods (≥1 hour resolution), talkgroups, and callsigns.

## Architecture

### Database Tables

#### 1. `lastheard_hourly_summary`
The main summary table that stores aggregated data per hour for each source/destination combination:

- **Primary Key**: `id` (auto-increment)
- **Time Dimensions**: `hour_start`, `hour_end` (unix timestamps)
- **Source Dimensions**: `source_id`, `source_call`, `source_name`
- **Destination Dimensions**: `destination_id`, `destination_call`, `destination_name`
- **Metrics**: `total_calls`, `total_duration`, `avg_duration`, `min_duration`, `max_duration`
- **Metadata**: `first_call_start`, `last_call_start`, `created_at`, `updated_at`

#### 2. `summary_processing_log`
Tracks the incremental processing state and history:

- **Processing State**: `last_processed_timestamp`, `last_processed_record_id`
- **Execution Tracking**: `processing_started_at`, `processing_completed_at`, `records_processed`
- **Status Management**: `status` ('in_progress', 'completed', 'failed'), `error_message`

### Key Design Decisions

1. **Minimal Table Count**: Only 2 new tables to minimize storage overhead
2. **Hour-Level Granularity**: Balances query performance with storage efficiency
3. **Incremental Processing**: Processes only new data since last run
4. **Upsert Strategy**: Handles late-arriving data by updating existing summaries
5. **Unique Constraints**: Prevents duplicate summaries for same hour/source/destination

## Processing Strategy

### Incremental Algorithm

1. **State Recovery**: Query `summary_processing_log` to find last processed timestamp/record ID
2. **Batch Processing**: Process records in configurable batches (default: 1000 records)
3. **Hour Aggregation**: Group records by hour boundaries and aggregate metrics
4. **Upsert Operations**: Insert new summaries or update existing ones
5. **State Persistence**: Update processing log with new state after each batch

### Scheduling

- **Frequency**: Every hour at 5 minutes past (e.g., 01:05, 02:05, etc.)
- **Rationale**: Allows current hour to complete before processing
- **Scheduler**: Node.js `node-schedule` library with cron expression `'5 * * * *'`

### Data Consistency

- **Transactional Updates**: Each batch is processed in a database transaction
- **Conflict Resolution**: ON CONFLICT clauses handle duplicate hour/source/destination combinations
- **Metric Aggregation**: Properly accumulates totals and recalculates averages/min/max

## API Endpoints

### Query Endpoints

#### 1. Get Callsigns by Talkgroup
```
GET /api/summary/talkgroups/:talkgroupId/callsigns?startTime=X&endTime=Y
```
Returns all callsigns active on a specific talkgroup during the time range.

#### 2. Get Talkgroup Activity
```
GET /api/summary/talkgroups?startTime=X&endTime=Y&limit=50
```
Returns talkgroup activity summary for the time range.

#### 3. Get Hourly Activity
```
GET /api/summary/hourly?startTime=X&endTime=Y&talkgroupId=Z
```
Returns hour-by-hour activity breakdown, optionally filtered by talkgroup.

### Administrative Endpoints

#### 4. Trigger Processing
```
POST /api/summary/process
```
Manually triggers summary processing (for admin use).

#### 5. Get Processing Status
```
GET /api/summary/status
```
Returns processing logs and summary statistics.

## Implementation Files

### Backend Services
- `src/services/summaryService.ts` - Core summarization logic
- `src/controllers/summaryController.ts` - API request handlers
- `src/routes/summaryRoutes.ts` - Route definitions

### Database
- `database/migrations/add_summary_tables.sql` - Table creation script
- `database/migrations/run_summary_migration.sh` - Migration execution script

### Scheduler Integration
- Updated `src/services/schedulerService.ts` to include hourly job

## Deployment Steps

1. **Run Migration**:
   ```bash
   cd backend/database/migrations
   ./run_summary_migration.sh
   ```

2. **Update Server Code**: The new routes are automatically included when the server restarts

3. **Verify Scheduler**: Ensure the scheduler service is running and logs show the hourly job

4. **Initial Processing**: Trigger manual processing to populate initial data:
   ```bash
   curl -X POST http://localhost:3001/api/summary/process
   ```

## Performance Characteristics

### Storage Efficiency
- **Compression Ratio**: ~1000:1 (1000 individual records → 1 summary record)
- **Index Strategy**: Optimized for time-range and talkgroup queries
- **Growth Rate**: ~24 records per day per active source/destination pair

### Query Performance
- **Time Range Queries**: O(log n) with time-based indexes
- **Talkgroup Filtering**: O(log n) with composite indexes
- **Callsign Lookup**: Efficient with dedicated indexes

### Processing Performance
- **Batch Size**: 1000 records per batch (configurable)
- **Memory Usage**: Minimal - processes data in streaming fashion
- **CPU Usage**: Low - simple aggregation operations
- **I/O Pattern**: Sequential reads from lastheard, batch writes to summary

## Monitoring and Maintenance

### Health Checks
- Monitor `summary_processing_log` for failed processing runs
- Check time gaps in `lastheard_hourly_summary` for missing data
- Verify scheduler is running via application logs

### Performance Monitoring
- Track processing time trends in logs
- Monitor batch sizes and adjust if needed
- Watch for memory usage during large catch-up operations

### Data Quality
- Compare summary totals with raw data samples
- Verify no duplicate summaries exist
- Check for reasonable min/max/average values

## Future Enhancements

### Potential Improvements
1. **Daily/Weekly Summaries**: Additional aggregation levels for longer-term analysis
2. **Retention Policies**: Automatic cleanup of old summary data
3. **Parallel Processing**: Multi-threaded processing for large catch-up operations
4. **Real-time Updates**: WebSocket notifications for live dashboard updates
5. **Data Export**: Bulk export capabilities for external analysis

### Scalability Considerations
- **Partitioning**: Time-based table partitioning for very large datasets
- **Read Replicas**: Separate read database for query workloads
- **Caching**: Redis cache for frequently accessed summary data
- **Compression**: PostgreSQL table compression for older summary data

## Example Queries

### Get Most Active Callsigns on Talkgroup 91 Last Week
```sql
SELECT source_call, source_name, SUM(total_calls) as calls, SUM(total_duration) as duration
FROM lastheard_hourly_summary 
WHERE destination_id = 91 
  AND hour_start >= extract(epoch from now() - interval '7 days')
GROUP BY source_call, source_name
ORDER BY calls DESC
LIMIT 20;
```

### Get Hourly Activity Pattern for Last 24 Hours
```sql
SELECT 
  to_timestamp(hour_start) as hour,
  SUM(total_calls) as total_calls,
  COUNT(DISTINCT destination_id) as active_talkgroups,
  COUNT(DISTINCT source_call) as active_callsigns
FROM lastheard_hourly_summary
WHERE hour_start >= extract(epoch from now() - interval '24 hours')
GROUP BY hour_start
ORDER BY hour_start;
```

### Find Talkgroups with Most Unique Users This Month
```sql
SELECT 
  destination_id,
  destination_name,
  COUNT(DISTINCT source_call) as unique_users,
  SUM(total_calls) as total_calls
FROM lastheard_hourly_summary
WHERE hour_start >= extract(epoch from date_trunc('month', now()))
GROUP BY destination_id, destination_name
ORDER BY unique_users DESC
LIMIT 10;
```