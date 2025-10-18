import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header/Header';
import LastHeardTable from './components/LastHeardTable/LastHeardTable';
import { lastHeardService } from './services/api';
import { LastHeardEntry } from './types';

function App() {
  const [entries, setEntries] = useState<LastHeardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <Header />
      <main className="main-content">
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
