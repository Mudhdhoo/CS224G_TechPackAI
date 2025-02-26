import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class TechpackAI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(method: string, endpoint: string, data?: any) {
    try {
      const response = await axios({
        method,
        url: `${API_URL}${endpoint}`,
        data,
        headers: this.token ? {
          Authorization: `Bearer ${this.token}`
        } : {}
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'An error occurred');
      }
      throw error;
    }
  }

  async getProjectMessages(projectId: string) {
    return this.request('GET', `/api/projects/${projectId}/messages`);
  }

  async sendMessage(projectId: string, content: string) {
    return this.request('POST', `/api/projects/${projectId}/messages`, { content });
  }

  async generatePdf(projectId: string) {
    return this.request('POST', `/api/projects/${projectId}/pdf`);
  }

  async getPdfUrl(projectId: string) {
    return this.request('GET', `/api/projects/${projectId}/pdf`);
  }
}

export const techpackAI = new TechpackAI();
