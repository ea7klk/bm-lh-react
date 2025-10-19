import { LastHeardEntry, ApiResponse, Country, FilterOptions, TalkgroupStats } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const lastHeardService = {
  async getLastHeard(
    limit: number = 50, 
    offset: number = 0, 
    filters?: FilterOptions
  ): Promise<{ data: LastHeardEntry[]; total: number }> {
    try {
      const maxEntries = filters?.maxEntries ? parseInt(filters.maxEntries) : limit;
      const params = new URLSearchParams({
        limit: maxEntries.toString(),
        offset: offset.toString(),
      });

      if (filters?.timeFilter && filters.timeFilter !== 'all') {
        params.append('time', filters.timeFilter);
      }
      
      if (filters?.continent && filters.continent !== 'all') {
        params.append('continent', filters.continent);
      }
      
      if (filters?.country && filters.country !== 'all') {
        params.append('country', filters.country);
      }

      const response = await fetch(`${API_BASE_URL}/lastheard?${params}`);
      const result: ApiResponse<LastHeardEntry[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      return {
        data: result.data,
        total: result.total || result.data.length,
      };
    } catch (error) {
      console.error('Error fetching last heard:', error);
      throw error;
    }
  },

  async pollNewEntries(
    lastUpdate: number,
    filters?: FilterOptions
  ): Promise<{ data: LastHeardEntry[]; newEntries: number; lastUpdate: number }> {
    try {
      const params = new URLSearchParams({
        lastUpdate: lastUpdate.toString(),
      });

      if (filters?.timeFilter && filters.timeFilter !== 'all') {
        params.append('time', filters.timeFilter);
      }
      
      if (filters?.continent && filters.continent !== 'all') {
        params.append('continent', filters.continent);
      }
      
      if (filters?.country && filters.country !== 'all') {
        params.append('country', filters.country);
      }

      if (filters?.maxEntries) {
        params.append('limit', filters.maxEntries);
      }

      const response = await fetch(`${API_BASE_URL}/lastheard/poll?${params}`);
      const result: ApiResponse<LastHeardEntry[]> & { newEntries: number; lastUpdate: number } = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to poll new entries');
      }
      
      return {
        data: result.data,
        newEntries: result.newEntries,
        lastUpdate: result.lastUpdate,
      };
    } catch (error) {
      console.error('Error polling new entries:', error);
      throw error;
    }
  },

  async getLastHeardById(id: number): Promise<LastHeardEntry> {
    try {
      const response = await fetch(`${API_BASE_URL}/lastheard/${id}`);
      const result: ApiResponse<LastHeardEntry> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch entry');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching entry:', error);
      throw error;
    }
  },

  async getContinents(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/lastheard/continents`);
      const result: ApiResponse<string[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch continents');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching continents:', error);
      throw error;
    }
  },

  async getCountries(continent?: string): Promise<Country[]> {
    try {
      const params = new URLSearchParams();
      if (continent && continent !== 'all') {
        params.append('continent', continent);
      }

      const response = await fetch(`${API_BASE_URL}/lastheard/countries?${params}`);
      const result: ApiResponse<Country[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch countries');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  },

  async getTalkgroupStats(
    filters?: FilterOptions
  ): Promise<TalkgroupStats[]> {
    try {
      const limit = filters?.maxEntries ? parseInt(filters.maxEntries) : 20;
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (filters?.timeFilter && filters.timeFilter !== 'all') {
        params.append('time', filters.timeFilter);
      }
      
      if (filters?.continent && filters.continent !== 'all') {
        params.append('continent', filters.continent);
      }
      
      if (filters?.country && filters.country !== 'all') {
        params.append('country', filters.country);
      }

      const response = await fetch(`${API_BASE_URL}/lastheard/stats/talkgroups?${params}`);
      const result: ApiResponse<TalkgroupStats[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch talkgroup statistics');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching talkgroup stats:', error);
      throw error;
    }
  },
};
