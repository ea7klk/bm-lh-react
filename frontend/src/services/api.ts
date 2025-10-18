import { LastHeardEntry, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const lastHeardService = {
  async getLastHeard(limit: number = 50, offset: number = 0): Promise<LastHeardEntry[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/lastheard?limit=${limit}&offset=${offset}`
      );
      const result: ApiResponse<LastHeardEntry[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching last heard:', error);
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
};
