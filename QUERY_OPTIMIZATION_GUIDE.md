# Database Query Optimization Strategies

## Performance Issues Identified:

1. **Multiple COUNT queries**: The `getLastHeard` function runs separate COUNT queries
2. **Large JOINs**: JOIN with talkgroups table on every query
3. **No query result caching**
4. **Inefficient polling**: `pollNewEntries` could be optimized
5. **Aggregation queries**: Stats queries scan large datasets

## Optimization Strategies:

### 1. **Use Window Functions Instead of Separate COUNT Queries**
Replace separate COUNT queries with window functions:

```sql
-- Instead of separate queries, use:
SELECT 
  lh.*, 
  tg.continent, 
  tg.country, 
  tg.full_country_name,
  tg.name as talkgroup_name,
  COUNT(*) OVER() as total_count
FROM lastheard lh
LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
WHERE conditions...
ORDER BY lh."Start" DESC 
LIMIT ? OFFSET ?
```

### 2. **Implement Query Result Caching**
- Use Redis or in-memory caching for frequently accessed data
- Cache talkgroup stats for 5-10 minutes
- Cache continent/country lists (rarely change)

### 3. **Use Materialized Views for Heavy Analytics**
Create materialized views for expensive aggregations:

```sql
-- Daily talkgroup activity summary
CREATE MATERIALIZED VIEW daily_talkgroup_stats AS
SELECT 
  DATE_TRUNC('day', to_timestamp("Start")) as day,
  "DestinationID",
  COUNT(*) as total_calls,
  SUM(duration) as total_duration
FROM lastheard 
GROUP BY DATE_TRUNC('day', to_timestamp("Start")), "DestinationID";

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_talkgroup_stats;
```

### 4. **Optimize Time-Range Queries**
- Use proper date/time handling instead of epoch calculations
- Create partitioned tables by time range for very large datasets

### 5. **Batch Operations for Data Migration**
- Use `COPY` instead of individual INSERT statements
- Process migrations in smaller batches with VACUUM between

### 6. **Connection Pooling**
- Implement proper connection pooling (already using pool from config)
- Set appropriate pool sizes

### 7. **Use Summary Tables More Effectively**
- Query summary tables for historical data instead of raw lastheard table
- Implement proper incremental updates

## Implementation Priority:
1. Add new indexes (immediate impact)
2. Implement result caching (medium effort, high impact)
3. Optimize query patterns (refactor controllers)
4. Create materialized views (for analytics)
5. Implement table partitioning (long-term for very large datasets)