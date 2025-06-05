import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const userApi = {
  // Add your API methods here
  getUser: async (id: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
}; 