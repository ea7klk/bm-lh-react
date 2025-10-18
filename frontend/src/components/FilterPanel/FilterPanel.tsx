import React, { useState, useEffect } from 'react';
import { FilterOptions, Country } from '../../types';
import { lastHeardService } from '../../services/api';
import './FilterPanel.css';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
}

const TIME_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '5', label: 'Last 5 minutes' },
  { value: '10', label: 'Last 10 minutes' },
  { value: '15', label: 'Last 15 minutes' },
  { value: '30', label: 'Last 30 minutes' },
  { value: '60', label: 'Last hour' },
  { value: '180', label: 'Last 3 hours' },
  { value: '360', label: 'Last 6 hours' },
  { value: '720', label: 'Last 12 hours' },
  { value: '1440', label: 'Last 24 hours' },
  { value: '4320', label: 'Last 3 days' },
  { value: '7200', label: 'Last 5 days' },
  { value: '10080', label: 'Last week' },
];

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, onApplyFilters }) => {
  const [continents, setContinents] = useState<string[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleApplyFilters = () => {
    setLoading(true);
    onApplyFilters();
    setTimeout(() => setLoading(false), 500); // Add small delay for UX
  };

  const handleClearFilters = () => {
    onFiltersChange({
      timeFilter: 'all',
      continent: 'all',
      country: 'all',
    });
  };

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>Filters</h3>
        
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="time-filter">Time Range:</label>
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
            <label htmlFor="continent-filter">Continent:</label>
            <select
              id="continent-filter"
              value={filters.continent}
              onChange={(e) => handleFilterChange('continent', e.target.value)}
            >
              <option value="all">All Continents</option>
              {continents.map((continent) => (
                <option key={continent} value={continent}>
                  {continent}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="country-filter">Country:</label>
            <select
              id="country-filter"
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              disabled={filters.continent === 'all' || countries.length === 0}
            >
              <option value="all">All Countries</option>
              {countries.map((country) => (
                <option key={country.country} value={country.country}>
                  {country.full_country_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button 
            onClick={handleApplyFilters} 
            disabled={loading}
            className="apply-button"
          >
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
          <button 
            onClick={handleClearFilters}
            className="clear-button"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;