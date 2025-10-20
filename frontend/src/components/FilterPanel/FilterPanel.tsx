import React, { useState, useEffect } from 'react';
import { FilterOptions, Country } from '../../types';
import { lastHeardService } from '../../services/api';
import { saveFiltersToStorage, areFiltersCustomized } from '../../utils/filterStorage';
import { useTranslation } from '../../i18n';
import './FilterPanel.css';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange }) => {
  const { t } = useTranslation();
  const [continents, setContinents] = useState<string[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

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

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset country when continent changes
    if (key === 'continent') {
      newFilters.country = 'all';
    }
    
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      timeFilter: '15',
      continent: 'all',
      country: 'all',
      maxEntries: '50',
    };
    onFiltersChange(defaultFilters);
    // Save the cleared filters to storage
    saveFiltersToStorage(defaultFilters);
  };

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>{t('filters')}</h3>
        
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
                  {continent}
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
              {countries.map((country) => (
                <option key={country.country} value={country.country}>
                  {country.full_country_name}
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

export default FilterPanel;