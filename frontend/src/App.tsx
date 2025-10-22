import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header/Header';
import TalkgroupChart from './components/TalkgroupChart/TalkgroupChart';
import TalkgroupDurationChart from './components/TalkgroupDurationChart/TalkgroupDurationChart';
import TalkgroupTable from './components/TalkgroupTable/TalkgroupTable';
import FilterPanel from './components/FilterPanel/FilterPanel';
import LanguageSelector from './components/LanguageSelector/LanguageSelector';
import { AuthModal, UserMenu, UserProfile, AccountSettings, EmailChangeModal } from './components/Auth';
import AdminPanel from './components/Admin/AdminPanel';
import { lastHeardService } from './services/api';
import { TalkgroupStats, TalkgroupDurationStats, FilterOptions } from './types';
import { loadFiltersFromStorage, saveFiltersToStorage } from './utils/filterStorage';
import { useTranslation } from 'react-i18next';
import { useAuth } from './contexts/AuthContext';

function MainDashboard() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [talkgroupStats, setTalkgroupStats] = useState<TalkgroupStats[]>([]);
  const [talkgroupDurationStats, setTalkgroupDurationStats] = useState<TalkgroupDurationStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Math.floor(Date.now() / 1000));
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [emailChangeModalOpen, setEmailChangeModalOpen] = useState<boolean>(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(() => {
    // Load filters from storage on initial render
    return loadFiltersFromStorage();
  });

  // User menu handlers
  const handleViewProfile = () => {
    setProfileModalOpen(true);
  };

  const handleAccountSettings = () => {
    setSettingsModalOpen(true);
  };

  const handleChangeEmail = () => {
    setEmailChangeModalOpen(true);
  };

  const handleAdmin = () => {
    navigate('/admin');
  };

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

  // Check for email verification parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const message = urlParams.get('message');
    
    if (verified !== null && message) {
      setVerificationSuccess(verified === 'true');
      setVerificationMessage(decodeURIComponent(message));
      
      // Clear URL parameters after showing message
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Clear message after 10 seconds
      setTimeout(() => {
        setVerificationMessage('');
        setVerificationSuccess(null);
      }, 10000);
    }
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
          
          {/* Authentication Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAuthenticated ? (
              <UserMenu 
                user={user!} 
                onLogout={logout}
                onProfile={handleViewProfile}
                onSettings={handleAccountSettings}
                onChangeEmail={handleChangeEmail}
                onAdmin={handleAdmin}
                isAdmin={user?.callsign === 'EA7KLK'}
              />
            ) : (
              <button 
                className="auth-button" 
                onClick={() => setAuthModalOpen(true)}
              >
                {t('login')}
              </button>
            )}
          </div>
          
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

        {verificationMessage && (
          <div className={`verification-message ${verificationSuccess ? 'success' : 'error'}`}>
            <p>{verificationMessage}</p>
            <button onClick={() => {
              setVerificationMessage('');
              setVerificationSuccess(null);
            }}>×</button>
          </div>
        )}
        
        <TalkgroupChart data={talkgroupStats} loading={loading} />
        <TalkgroupDurationChart data={talkgroupDurationStats} loading={loading} />
        <TalkgroupTable 
          statsData={talkgroupStats} 
          durationData={talkgroupDurationStats} 
          loading={loading} 
        />
      </main>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      
      {/* User Profile Modal */}
      {isAuthenticated && user && (
        <UserProfile 
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={user}
        />
      )}

      {/* Account Settings Modal */}
      {isAuthenticated && user && (
        <AccountSettings 
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          user={user}
        />
      )}

      {/* Email Change Modal */}
      {isAuthenticated && user && (
        <EmailChangeModal 
          isOpen={emailChangeModalOpen}
          onClose={() => setEmailChangeModalOpen(false)}
          currentEmail={user.email}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
