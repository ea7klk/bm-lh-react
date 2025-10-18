import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header/Header';
import LastHeardTable from './components/LastHeardTable/LastHeardTable';
import FilterPanel from './components/FilterPanel/FilterPanel';
import { lastHeardService } from './services/api';
import { LastHeardEntry, FilterOptions } from './types';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [entries, setEntries] = useState<LastHeardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isRealTime, setIsRealTime] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [filters, setFilters] = useState<FilterOptions>({
    timeFilter: 'all',
    continent: 'all',
    country: 'all',
  });

  const handleNewEntry = useCallback((newEntry: LastHeardEntry) => {
    // Only add to real-time updates if no filters are applied
    if (isRealTime && filters.timeFilter === 'all' && filters.continent === 'all' && filters.country === 'all') {
      setEntries(prevEntries => {
        // Add new entry at the beginning and limit to 100 entries
        const updatedEntries = [newEntry, ...prevEntries];
        return updatedEntries.slice(0, 100);
      });
    }
  }, [isRealTime, filters]);

  // Initialize WebSocket for real-time updates
  useWebSocket({
    onNewEntry: handleNewEntry,
  });

  const fetchData = async (currentFilters?: FilterOptions) => {
    try {
      setLoading(true);
      setError('');
      const filtersToUse = currentFilters || filters;
      const result = await lastHeardService.getLastHeard(50, 0, filtersToUse);
      setEntries(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Failed to load data. Please check if the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    fetchData(filters);
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds as fallback only when no filters are applied
    const shouldAutoRefresh = filters.timeFilter === 'all' && filters.continent === 'all' && filters.country === 'all';
    if (shouldAutoRefresh) {
      const interval = setInterval(() => fetchData(), 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Fetch data when filters change to 'all' (real-time mode)
  useEffect(() => {
    const isRealTimeMode = filters.timeFilter === 'all' && filters.continent === 'all' && filters.country === 'all';
    if (isRealTimeMode && isRealTime) {
      fetchData();
    }
  }, [filters, isRealTime]);

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <div className="controls">
          <button onClick={() => fetchData()} disabled={loading}>
            Refresh Data
          </button>
          <label className="realtime-toggle">
            <input
              type="checkbox"
              checked={isRealTime}
              onChange={(e) => setIsRealTime(e.target.checked)}
            />
            Real-time updates
          </label>
          <span className="entry-count">
            Showing {entries.length} of {total} entries
          </span>
        </div>
        
        <FilterPanel 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
        />
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => fetchData()}>Retry</button>
          </div>
        )}
        <LastHeardTable entries={entries} loading={loading} />
      </main>
    </div>
  );
}

export default App;
