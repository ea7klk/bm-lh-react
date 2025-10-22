import { LastHeardEntry, ApiResponse, Country, FilterOptions, TalkgroupStats, TalkgroupDurationStats, AdvancedFilterOptions, Talkgroup, CallsignInfo } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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

  async getTalkgroupDurationStats(
    filters?: FilterOptions
  ): Promise<TalkgroupDurationStats[]> {
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

      const response = await fetch(`${API_BASE_URL}/lastheard/stats/talkgroups/duration?${params}`);
      const result: ApiResponse<TalkgroupDurationStats[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch talkgroup duration statistics');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching talkgroup duration stats:', error);
      throw error;
    }
  },

  async getTalkgroupsByFilters(
    continent?: string, 
    country?: string
  ): Promise<{ success: boolean; data: any[] }> {
    try {
      let url = `${API_BASE_URL}/talkgroups`;
      
      if (continent && continent !== 'all' && continent !== 'global' && continent !== 'others') {
        if (country && country !== 'all') {
          url = `${API_BASE_URL}/talkgroups/country/${country}`;
        } else {
          url = `${API_BASE_URL}/talkgroups/continent/${continent}`;
        }
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch talkgroups');
      }
      
      return { success: true, data: result.data || result };
    } catch (error) {
      console.error('Error fetching talkgroups:', error);
      throw error;
    }
  },

  async getCallsignsByTalkgroup(
    talkgroupId: number,
    timeFilter?: string
  ): Promise<{ success: boolean; data: any }> {
    try {
      const params = new URLSearchParams();
      
      if (timeFilter && timeFilter !== 'all') {
        const minutes = parseInt(timeFilter);
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - (minutes * 60);
        params.append('startTime', startTime.toString());
        params.append('endTime', endTime.toString());
      }

      const response = await fetch(`${API_BASE_URL}/summary/talkgroup/${talkgroupId}/callsigns?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch callsigns');
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching callsigns by talkgroup:', error);
      throw error;
    }
  },
};
