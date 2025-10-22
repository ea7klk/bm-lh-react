#!/bin/bash

# Database Performance Monitoring Script
# Run this to check current query performance

echo "=== Database Performance Check ==="

# 1. Check table sizes
echo "Table sizes:"
docker exec -i bm-lh-postgres psql -h localhost -p 5432 -U bmuser -d bm_lastheard -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# 2. Check index usage
echo -e "\nIndex usage statistics:"
docker exec -i bm-lh-postgres psql -h localhost -p 5432 -U bmuser -d bm_lastheard -c "
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;
"

# 3. Check slow queries (if pg_stat_statements is enabled)
echo -e "\nSlow query analysis:"
docker exec -i bm-lh-postgres psql -h localhost -p 5432 -U bmuser -d bm_lastheard -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
" 2>/dev/null || echo "pg_stat_statements not available"

# 4. Check current connections
echo -e "\nCurrent connections:"
docker exec -i bm-lh-postgres psql -h localhost -p 5432 -U bmuser -d bm_lastheard -c "
SELECT count(*) as connection_count, state 
FROM pg_stat_activity 
WHERE datname = 'bm_lastheard'
GROUP BY state;
"

echo "=== Performance check complete ==="