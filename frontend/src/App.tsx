import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header/Header';
import LastHeardTable from './components/LastHeardTable/LastHeardTable';
import { lastHeardService } from './services/api';
import { LastHeardEntry } from './types';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [entries, setEntries] = useState<LastHeardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isRealTime, setIsRealTime] = useState<boolean>(true);

  const handleNewEntry = useCallback((newEntry: LastHeardEntry) => {
    setEntries(prevEntries => {
      // Add new entry at the beginning and limit to 100 entries
      const updatedEntries = [newEntry, ...prevEntries];
      return updatedEntries.slice(0, 100);
    });
  }, []);

  // Initialize WebSocket for real-time updates
  useWebSocket({
    onNewEntry: isRealTime ? handleNewEntry : undefined,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await lastHeardService.getLastHeard(50, 0);
      setEntries(data);
    } catch (err) {
      setError('Failed to load data. Please check if the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds as fallback
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <div className="controls">
          <button onClick={fetchData} disabled={loading}>
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
        </div>
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchData}>Retry</button>
          </div>
        )}
        <LastHeardTable entries={entries} loading={loading} />
      </main>
    </div>
  );
}

export default App;
