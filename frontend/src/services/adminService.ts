const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

interface AdminStats {
  totalRecords: number;
  uniqueTalkgroups: number;
  uniqueCallsigns: number;
}

class AdminService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('session_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getStats(): Promise<AdminStats> {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin stats');
    }

    return response.json();
  }

  async getUsers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  async expungeOldRecords(): Promise<{ message: string; deletedCount: number }> {
    const response = await fetch(`${API_BASE_URL}/admin/expunge`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to expunge records');
    }

    return response.json();
  }

  async updateTalkgroups(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/update-talkgroups`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to update talkgroups');
    }

    return response.json();
  }

  async sendEmailToAllUsers(subject: string, htmlContent: string, plainContent: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/send-email-to-all`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        subject,
        htmlContent,
        plainContent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send emails');
    }

    return response.json();
  }

  // Check if current user is admin (EA7KLK)
  isAdmin(callsign: string): boolean {
    return callsign === 'EA7KLK';
  }
}

export const adminService = new AdminService();