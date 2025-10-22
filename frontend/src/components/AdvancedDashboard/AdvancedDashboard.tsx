import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdvancedDashboard.css';
import Header from '../Header/Header';
import TalkgroupChart from '../TalkgroupChart/TalkgroupChart';
import TalkgroupDurationChart from '../TalkgroupDurationChart/TalkgroupDurationChart';
import TalkgroupTable from '../TalkgroupTable/TalkgroupTable';
import AdvancedFilterPanel from '../FilterPanel/AdvancedFilterPanel';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import Footer from '../Footer/Footer';
import { UserMenu, UserProfile, AccountSettings, EmailChangeModal } from '../Auth';
import { lastHeardService } from '../../services/api';
import { TalkgroupStats, TalkgroupDurationStats, AdvancedFilterOptions } from '../../types';
import { loadAdvancedFiltersFromStorage, saveFiltersToStorage } from '../../utils/filterStorage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const AdvancedDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [talkgroupStats, setTalkgroupStats] = useState<TalkgroupStats[]>([]);
  const [talkgroupDurationStats, setTalkgroupDurationStats] = useState<TalkgroupDurationStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Math.floor(Date.now() / 1000));
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [emailChangeModalOpen, setEmailChangeModalOpen] = useState<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize advanced filters with default values
  const [filters, setFilters] = useState<AdvancedFilterOptions>(() => {
    return loadAdvancedFiltersFromStorage();
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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

  const handleStandardDashboard = () => {
    navigate('/');
  };

  const fetchData = async (currentFilters?: AdvancedFilterOptions) => {
    try {
      setLoading(true);
      setError('');
      const filtersToUse = currentFilters || filters;
      
      // Convert advanced filters to base FilterOptions for API calls
      const baseFilters = {
        timeFilter: filtersToUse.timeFilter,
        continent: filtersToUse.continent,
        country: filtersToUse.country,
        maxEntries: filtersToUse.maxEntries,
      };
      
      // Fetch both charts data in parallel
      const [statsResult, durationResult] = await Promise.all([
        lastHeardService.getTalkgroupStats(baseFilters),
        lastHeardService.getTalkgroupDurationStats(baseFilters)
      ]);
      
      // Apply additional filtering based on talkgroup and callsign if selected
      let filteredStats = statsResult;
      let filteredDurationStats = durationResult;
      
      if (filtersToUse.talkgroup && filtersToUse.talkgroup !== 'all') {
        const talkgroupId = parseInt(filtersToUse.talkgroup);
        filteredStats = statsResult.filter(stat => stat.talkgroup_id === talkgroupId);
        filteredDurationStats = durationResult.filter(stat => stat.talkgroup_id === talkgroupId);
      }
      
      setTalkgroupStats(filteredStats);
      setTalkgroupDurationStats(filteredDurationStats);
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
      // Convert advanced filters to base FilterOptions for API calls
      const baseFilters = {
        timeFilter: filters.timeFilter,
        continent: filters.continent,
        country: filters.country,
        maxEntries: filters.maxEntries,
      };
      
      // Poll both charts data in parallel
      const [statsResult, durationResult] = await Promise.all([
        lastHeardService.getTalkgroupStats(baseFilters),
        lastHeardService.getTalkgroupDurationStats(baseFilters)
      ]);
      
      // Apply additional filtering based on talkgroup and callsign if selected
      let filteredStats = statsResult;
      let filteredDurationStats = durationResult;
      
      if (filters.talkgroup && filters.talkgroup !== 'all') {
        const talkgroupId = parseInt(filters.talkgroup);
        filteredStats = statsResult.filter(stat => stat.talkgroup_id === talkgroupId);
        filteredDurationStats = durationResult.filter(stat => stat.talkgroup_id === talkgroupId);
      }
      
      setTalkgroupStats(filteredStats);
      setTalkgroupDurationStats(filteredDurationStats);
      setLastUpdate(Math.floor(Date.now() / 1000));
    } catch (err) {
      console.error('Error polling talkgroup stats:', err);
      // Don't show error for polling failures to avoid UI spam
    }
  }, [isPolling, filters]);

  const handleFiltersChange = (newFilters: AdvancedFilterOptions) => {
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
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

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
    if (isAuthenticated) {
      fetchData();
      setLastUpdate(Math.floor(Date.now() / 1000)); // Reset timestamp when filters change
    }
  }, [filters, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

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
            <UserMenu 
              user={user!} 
              onLogout={logout}
              onProfile={handleViewProfile}
              onSettings={handleAccountSettings}
              onChangeEmail={handleChangeEmail}
              onAdmin={handleAdmin}
              onStandardDashboard={handleStandardDashboard}
              isAdmin={user?.callsign === 'EA7KLK'}
            />
          </div>
          
          <span className="entry-count">
            {t('showingTalkgroups', { count: talkgroupStats.length })}
          </span>
        </div>
        
        <AdvancedFilterPanel 
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
        <TalkgroupTable 
          statsData={talkgroupStats} 
          durationData={talkgroupDurationStats} 
          loading={loading} 
        />
      </main>
      
      <Footer />
      
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
};

export default AdvancedDashboard;