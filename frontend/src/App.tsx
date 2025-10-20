import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Header from './components/Header/Header';
import TalkgroupChart from './components/TalkgroupChart/TalkgroupChart';
import TalkgroupDurationChart from './components/TalkgroupDurationChart/TalkgroupDurationChart';
import FilterPanel from './components/FilterPanel/FilterPanel';
import LanguageSelector from './components/LanguageSelector/LanguageSelector';
import { lastHeardService } from './services/api';
import { TalkgroupStats, TalkgroupDurationStats, FilterOptions } from './types';
import { loadFiltersFromStorage, saveFiltersToStorage } from './utils/filterStorage';
import { useTranslation } from './i18n';

function App() {
  const { t } = useTranslation();
  const [talkgroupStats, setTalkgroupStats] = useState<TalkgroupStats[]>([]);
  const [talkgroupDurationStats, setTalkgroupDurationStats] = useState<TalkgroupDurationStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Math.floor(Date.now() / 1000));
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(() => {
    // Load filters from storage on initial render
    return loadFiltersFromStorage();
  });

  const fetchData = async (currentFilters?: FilterOptions) => {
    try {
      setLoading(true);
      setError('');
      const filtersToUse = currentFilters || filters;
      
      // Fetch both charts data in parallel
      const [statsResult, durationResult] = await Promise.all([
        lastHeardService.getTalkgroupStats(filtersToUse),
        lastHeardService.getTalkgroupDurationStats(filtersToUse)
      ]);
      
      setTalkgroupStats(statsResult);
      setTalkgroupDurationStats(durationResult);
      setLastUpdate(Math.floor(Date.now() / 1000));
    } catch (err) {
      setError(t('failedToLoad'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pollNewEntries = useCallback(async () => {
    if (!isPolling) return;

    try {
      // Poll both charts data in parallel
      const [statsResult, durationResult] = await Promise.all([
        lastHeardService.getTalkgroupStats(filters),
        lastHeardService.getTalkgroupDurationStats(filters)
      ]);
      
      setTalkgroupStats(statsResult);
      setTalkgroupDurationStats(durationResult);
      setLastUpdate(Math.floor(Date.now() / 1000));
    } catch (err) {
      console.error('Error polling talkgroup stats:', err);
      // Don't show error for polling failures to avoid UI spam
    }
  }, [isPolling, filters]);

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Save filters to storage whenever they change
    saveFiltersToStorage(newFilters);
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
    setLastUpdate(Math.floor(Date.now() / 1000)); // Reset timestamp when filters change
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <div className="controls">
          <button onClick={() => fetchData()} disabled={loading}>
            {t('refreshData')}
          </button>
          <label className="realtime-toggle">
            <input
              type="checkbox"
              checked={isPolling}
              onChange={(e) => setIsPolling(e.target.checked)}
            />
            {t('autoRefresh')}
          </label>
          <LanguageSelector />
          <span className="entry-count">
            {t('showingTalkgroups', { count: talkgroupStats.length })}
          </span>
        </div>
        
        <FilterPanel 
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => fetchData()}>{t('retry')}</button>
          </div>
        )}
        
        <TalkgroupChart data={talkgroupStats} loading={loading} />
        <TalkgroupDurationChart data={talkgroupDurationStats} loading={loading} />
      </main>
    </div>
  );
}

export default App;
