import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AdvancedFilterOptions, Country, Talkgroup, CallsignInfo } from '../../types';
import { lastHeardService } from '../../services/api';
import { saveFiltersToStorage, areFiltersCustomized } from '../../utils/filterStorage';
import { useTranslation } from 'react-i18next';
import './FilterPanel.css';

interface AdvancedFilterPanelProps {
  filters: AdvancedFilterOptions;
  onFiltersChange: (filters: AdvancedFilterOptions) => void;
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({ filters, onFiltersChange }) => {
  const { t } = useTranslation();
  const [continents, setContinents] = useState<string[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [talkgroups, setTalkgroups] = useState<Talkgroup[]>([]);
  const [callsigns, setCallsigns] = useState<CallsignInfo[]>([]);
  const [talkgroupSearch, setTalkgroupSearch] = useState('');
  const [callsignSearch, setCallsignSearch] = useState('');
  const [loadingTalkgroups, setLoadingTalkgroups] = useState(false);
  const [loadingCallsigns, setLoadingCallsigns] = useState(false);

  // Helper function to get translated continent name
  const getTranslatedContinent = useCallback((continent: string): string => {
    const continentTranslations = t('continents', { returnObjects: true }) as Record<string, string>;
    return continentTranslations[continent] || continent;
  }, [t]);

  // Helper function to get translated country name
  const getTranslatedCountry = useCallback((countryCode: string, fallbackName: string): string => {
    const countryTranslations = t('countries', { returnObjects: true }) as Record<string, string>;
    return countryTranslations[countryCode] || fallbackName;
  }, [t]);

  // Sort countries alphabetically by translated names
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => {
      const nameA = getTranslatedCountry(a.country, a.full_country_name);
      const nameB = getTranslatedCountry(b.country, b.full_country_name);
      return nameA.localeCompare(nameB);
    });
  }, [countries, getTranslatedCountry]);

  // Filter talkgroups based on search
  const filteredTalkgroups = useMemo(() => {
    if (!talkgroupSearch) return talkgroups;
    return talkgroups.filter(tg => 
      tg.name.toLowerCase().includes(talkgroupSearch.toLowerCase()) ||
      tg.id.toString().includes(talkgroupSearch)
    );
  }, [talkgroups, talkgroupSearch]);

  // Filter callsigns based on search
  const filteredCallsigns = useMemo(() => {
    if (!callsignSearch) return callsigns;
    return callsigns.filter(cs => 
      cs.callsign.toLowerCase().includes(callsignSearch.toLowerCase()) ||
      (cs.name && cs.name.toLowerCase().includes(callsignSearch.toLowerCase()))
    );
  }, [callsigns, callsignSearch]);

  const TIME_OPTIONS = [
    { value: 'all', label: t('allTime') },
    { value: '5', label: t('last5minutes') },
    { value: '10', label: t('last10minutes') },
    { value: '15', label: t('last15minutes') },
    { value: '30', label: t('last30minutes') },
    { value: '60', label: t('lastHour') },
    { value: '180', label: t('last3hours') },
    { value: '360', label: t('last6hours') },
    { value: '720', label: t('last12hours') },
    { value: '1440', label: t('last24hours') },
    { value: '4320', label: t('last3days') },
    { value: '7200', label: t('last5days') },
    { value: '10080', label: t('lastWeek') },
  ];

  const MAX_ENTRIES_OPTIONS = [
    { value: '10', label: t('entries10') },
    { value: '20', label: t('entries20') },
    { value: '30', label: t('entries30') },
    { value: '50', label: t('entries50') },
  ];

  useEffect(() => {
    fetchContinents();
  }, []);

  useEffect(() => {
    fetchCountries(filters.continent);
  }, [filters.continent]);

  useEffect(() => {
    if (shouldShowTalkgroupFilter()) {
      fetchTalkgroups();
    } else {
      setTalkgroups([]);
    }
  }, [filters.continent, filters.country]);

  useEffect(() => {
    if (filters.talkgroup && filters.talkgroup !== 'all') {
      fetchCallsigns();
    } else {
      setCallsigns([]);
    }
  }, [filters.talkgroup, filters.timeFilter]);

  const fetchContinents = async () => {
    try {
      const data = await lastHeardService.getContinents();
      setContinents(data);
    } catch (error) {
      console.error('Error fetching continents:', error);
    }
  };

  const fetchCountries = async (continent: string) => {
    try {
      const data = await lastHeardService.getCountries(continent);
      setCountries(data);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]);
    }
  };

  const fetchTalkgroups = async () => {
    setLoadingTalkgroups(true);
    try {
      const result = await lastHeardService.getTalkgroupsByFilters(
        filters.continent === 'all' ? undefined : filters.continent,
        filters.country === 'all' ? undefined : filters.country
      );
      
      const talkgroupData = result.data.map((tg: any) => ({
        id: tg.id || tg.talkgroup_id,
        name: tg.name || `TG ${tg.id || tg.talkgroup_id}`,
        continent: tg.continent,
        country: tg.country
      }));
      
      setTalkgroups(talkgroupData);
    } catch (error) {
      console.error('Error fetching talkgroups:', error);
      setTalkgroups([]);
    } finally {
      setLoadingTalkgroups(false);
    }
  };

  const fetchCallsigns = async () => {
    setLoadingCallsigns(true);
    try {
      const talkgroupId = parseInt(filters.talkgroup);
      const result = await lastHeardService.getCallsignsByTalkgroup(
        talkgroupId,
        filters.timeFilter
      );
      
      const callsignData = result.data.callsigns || [];
      setCallsigns(callsignData);
    } catch (error) {
      console.error('Error fetching callsigns:', error);
      setCallsigns([]);
    } finally {
      setLoadingCallsigns(false);
    }
  };

  const shouldShowTalkgroupFilter = (): boolean => {
    return (
      filters.continent === 'global' || 
      filters.continent === 'others' || 
      (filters.continent !== 'all' && filters.country !== 'all')
    );
  };

  const shouldShowCallsignFilter = (): boolean => {
    return !!(filters.talkgroup && filters.talkgroup !== 'all');
  };

  const handleFilterChange = (key: keyof AdvancedFilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters when parent filters change
    if (key === 'continent') {
      newFilters.country = 'all';
      newFilters.talkgroup = 'all';
      newFilters.callsign = 'all';
    } else if (key === 'country') {
      newFilters.talkgroup = 'all';
      newFilters.callsign = 'all';
    } else if (key === 'talkgroup') {
      newFilters.callsign = 'all';
    }
    
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters: AdvancedFilterOptions = {
      timeFilter: '15',
      continent: 'all',
      country: 'all',
      maxEntries: '50',
      talkgroup: 'all',
      callsign: 'all',
    };
    onFiltersChange(defaultFilters);
    saveFiltersToStorage(defaultFilters);
  };

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>{t('filters')} - {t('advancedMode')}</h3>
        
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="time-filter">{t('timeFilter')}:</label>
            <select
              id="time-filter"
              value={filters.timeFilter}
              onChange={(e) => handleFilterChange('timeFilter', e.target.value)}
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="continent-filter">{t('continent')}:</label>
            <select
              id="continent-filter"
              value={filters.continent}
              onChange={(e) => handleFilterChange('continent', e.target.value)}
            >
              <option value="all">{t('allContinents')}</option>
              {continents.map((continent) => (
                <option key={continent} value={continent}>
                  {getTranslatedContinent(continent)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="country-filter">{t('country')}:</label>
            <select
              id="country-filter"
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              disabled={filters.continent === 'all' || countries.length === 0}
            >
              <option value="all">{t('allCountries')}</option>
              {sortedCountries.map((country) => (
                <option key={country.country} value={country.country}>
                  {getTranslatedCountry(country.country, country.full_country_name)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="max-entries-filter">{t('maxEntries')}:</label>
            <select
              id="max-entries-filter"
              value={filters.maxEntries}
              onChange={(e) => handleFilterChange('maxEntries', e.target.value)}
            >
              {MAX_ENTRIES_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced filters row */}
        <div className="filter-row">
          {shouldShowTalkgroupFilter() && (
            <div className="filter-group">
              <label htmlFor="talkgroup-filter">{t('talkgroup')}:</label>
              <div className="searchable-select">
                <input
                  type="text"
                  placeholder={t('searchTalkgroups')}
                  value={talkgroupSearch}
                  onChange={(e) => setTalkgroupSearch(e.target.value)}
                  className="search-input"
                />
                <select
                  id="talkgroup-filter"
                  value={filters.talkgroup}
                  onChange={(e) => handleFilterChange('talkgroup', e.target.value)}
                  disabled={loadingTalkgroups}
                >
                  <option value="all">{loadingTalkgroups ? t('loading') : t('allTalkgroups')}</option>
                  {filteredTalkgroups.map((talkgroup) => (
                    <option key={talkgroup.id} value={talkgroup.id.toString()}>
                      {talkgroup.name} ({talkgroup.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {shouldShowCallsignFilter() && (
            <div className="filter-group">
              <label htmlFor="callsign-filter">{t('callsign')}:</label>
              <div className="searchable-select">
                <input
                  type="text"
                  placeholder={t('searchCallsigns')}
                  value={callsignSearch}
                  onChange={(e) => setCallsignSearch(e.target.value)}
                  className="search-input"
                />
                <select
                  id="callsign-filter"
                  value={filters.callsign}
                  onChange={(e) => handleFilterChange('callsign', e.target.value)}
                  disabled={loadingCallsigns}
                >
                  <option value="all">{loadingCallsigns ? t('loading') : t('allCallsigns')}</option>
                  {filteredCallsigns.map((callsign) => (
                    <option key={callsign.callsign} value={callsign.callsign}>
                      {callsign.callsign} {callsign.name && `(${callsign.name})`} - {callsign.count} QSOs
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="filter-actions">
          <button 
            onClick={handleClearFilters}
            className="clear-button"
          >
            {t('resetFilters')}
          </button>
          {areFiltersCustomized(filters) && (
            <span className="filter-status">
              📌 Filters saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;