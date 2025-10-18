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

  // Helper function to check if an entry matches current filters
  const entryMatchesFilters = useCallback((entry: LastHeardEntry, currentFilters: FilterOptions): boolean => {
    // Check time filter
    if (currentFilters.timeFilter !== 'all') {
      const now = Date.now() / 1000; // Current time in seconds
      const entryTime = entry.Start; // Entry start time in seconds
      const timeFilterMinutes: { [key: string]: number } = {
        '5': 5,
        '10': 10,
        '15': 15,
        '30': 30,
        '60': 60,
        '180': 180,
        '360': 360,
        '720': 720,
        '1440': 1440,
        '4320': 4320,
        '7200': 7200,
        '10080': 10080,
      };
      
      const filterMinutes = timeFilterMinutes[currentFilters.timeFilter];
      if (filterMinutes && (now - entryTime) > (filterMinutes * 60)) {
        return false;
      }
    }

    // Check continent filter
    if (currentFilters.continent !== 'all' && entry.continent !== currentFilters.continent) {
      return false;
    }

    // Check country filter
    if (currentFilters.country !== 'all' && entry.country !== currentFilters.country) {
      return false;
    }

    return true;
  }, []);

  const handleNewEntry = useCallback((newEntry: LastHeardEntry) => {
    if (!isRealTime) return;

    // Check if the new entry matches current filters
    if (entryMatchesFilters(newEntry, filters)) {
      setEntries(prevEntries => {
        // Add new entry at the beginning and limit to 100 entries
        const updatedEntries = [newEntry, ...prevEntries];
        return updatedEntries.slice(0, 100);
      });
      
      // Update total count
      setTotal(prevTotal => prevTotal + 1);
    }
  }, [isRealTime, filters, entryMatchesFilters]);

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
    // Auto-refresh every 30 seconds as fallback when real-time is enabled
    if (isRealTime) {
      const interval = setInterval(() => fetchData(), 30000);
      return () => clearInterval(interval);
    }
  }, [isRealTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data when filters change (to immediately apply new filters)
  useEffect(() => {
    // Only fetch if not in the initial load (handled by the first useEffect)
    fetchData();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

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
