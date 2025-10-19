import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Header from './components/Header/Header';
import LastHeardTable from './components/LastHeardTable/LastHeardTable';
import FilterPanel from './components/FilterPanel/FilterPanel';
import { lastHeardService } from './services/api';
import { LastHeardEntry, FilterOptions } from './types';

function App() {
  const [entries, setEntries] = useState<LastHeardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now() / 1000);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    timeFilter: 'all',
    continent: 'all',
    country: 'all',
  });

  const fetchData = async (currentFilters?: FilterOptions) => {
    try {
      setLoading(true);
      setError('');
      const filtersToUse = currentFilters || filters;
      const result = await lastHeardService.getLastHeard(50, 0, filtersToUse);
      setEntries(result.data);
      setTotal(result.total);
      setLastUpdate(Date.now() / 1000);
    } catch (err) {
      setError('Failed to load data. Please check if the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pollNewEntries = useCallback(async () => {
    if (!isPolling) return;

    try {
      const result = await lastHeardService.pollNewEntries(lastUpdate, filters);
      
      if (result.newEntries > 0) {
        setEntries(prevEntries => {
          // Add new entries at the beginning and limit to 100 entries total
          const updatedEntries = [...result.data, ...prevEntries];
          return updatedEntries.slice(0, 100);
        });
        
        // Update total count
        setTotal(prevTotal => prevTotal + result.newEntries);
        setLastUpdate(result.lastUpdate);
      }
    } catch (err) {
      console.error('Error polling new entries:', err);
      // Don't show error for polling failures to avoid UI spam
    }
  }, [isPolling, lastUpdate, filters]);

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    fetchData(filters);
  };

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    if (isPolling) {
      pollingIntervalRef.current = setInterval(pollNewEntries, 10000); // Poll every 10 seconds
    }
  }, [isPolling, pollNewEntries]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Start/stop polling based on isPolling state
  useEffect(() => {
    startPolling();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [startPolling]);

  // Fetch data when filters change and reset lastUpdate timestamp
  useEffect(() => {
    fetchData();
    setLastUpdate(Date.now() / 1000); // Reset timestamp when filters change
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
              checked={isPolling}
              onChange={(e) => setIsPolling(e.target.checked)}
            />
            Auto-refresh (10s)
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
