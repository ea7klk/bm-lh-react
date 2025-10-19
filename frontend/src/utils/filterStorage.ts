import { FilterOptions } from '../types';
import { setCookie, getCookie, deleteCookie } from './cookies';

const FILTER_COOKIE_NAME = 'bm_lh_filters';
const DEFAULT_FILTERS: FilterOptions = {
  timeFilter: '15',
  continent: 'all',
  country: 'all',
  maxEntries: '50',
};

/**
 * Save filter options to cookie
 */
export function saveFiltersToStorage(filters: FilterOptions): void {
  try {
    const filterData = JSON.stringify(filters);
    setCookie(FILTER_COOKIE_NAME, filterData, {
      expires: 90, // 90 days
      path: '/',
      sameSite: 'lax'
    });
  } catch (error) {
    console.warn('Failed to save filters to storage:', error);
  }
}

/**
 * Load filter options from cookie
 */
export function loadFiltersFromStorage(): FilterOptions {
  try {
    const filterData = getCookie(FILTER_COOKIE_NAME);
    if (filterData) {
      const parsedFilters = JSON.parse(filterData) as FilterOptions;
      
      // Validate the loaded filters have all required properties
      const validatedFilters: FilterOptions = {
        timeFilter: parsedFilters.timeFilter || DEFAULT_FILTERS.timeFilter,
        continent: parsedFilters.continent || DEFAULT_FILTERS.continent,
        country: parsedFilters.country || DEFAULT_FILTERS.country,
        maxEntries: parsedFilters.maxEntries || DEFAULT_FILTERS.maxEntries,
      };
      
      return validatedFilters;
    }
  } catch (error) {
    console.warn('Failed to load filters from storage:', error);
  }
  
  return DEFAULT_FILTERS;
}

/**
 * Clear saved filters from storage
 */
export function clearFiltersFromStorage(): void {
  try {
    deleteCookie(FILTER_COOKIE_NAME);
  } catch (error) {
    console.warn('Failed to clear filters from storage:', error);
  }
}

/**
 * Check if filters are different from defaults
 */
export function areFiltersCustomized(filters: FilterOptions): boolean {
  return (
    filters.timeFilter !== DEFAULT_FILTERS.timeFilter ||
    filters.continent !== DEFAULT_FILTERS.continent ||
    filters.country !== DEFAULT_FILTERS.country ||
    filters.maxEntries !== DEFAULT_FILTERS.maxEntries
  );
}