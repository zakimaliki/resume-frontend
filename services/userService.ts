import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';

export interface BackendUser {
  id: string;
  email: string;
  name?: string;
  // Add other fields from your backend user model
}

const createAuthConfig = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const userService = {
  getAllUsers: async (token: string): Promise<BackendUser[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/api/users`, createAuthConfig(token));
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

  getUserById: async (id: string, token: string): Promise<BackendUser> => {
    try {
      const response = await axios.get(`${BASE_URL}/api/users/${id}`, createAuthConfig(token));
      return response.data;
    } catch (error) {
      console.error('Error fetching user data by ID:', error);
      throw error;
    }
  },

  createUser: async (userData: Partial<BackendUser>, token: string): Promise<BackendUser> => {
    try {
      const response = await axios.post(`${BASE_URL}/api/users`, userData, createAuthConfig(token));
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (id: string, userData: Partial<BackendUser>, token: string): Promise<BackendUser> => {
    try {
      const response = await axios.put(`${BASE_URL}/api/users/${id}`, userData, createAuthConfig(token));
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (id: string, token: string): Promise<void> => {
    try {
      await axios.delete(`${BASE_URL}/api/users/${id}`, createAuthConfig(token));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // You can add other user-related API calls here (e.g., createUser, updateUser)
}; 