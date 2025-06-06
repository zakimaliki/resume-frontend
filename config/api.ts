export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  jobs: `${API_BASE_URL}/jobs`,
  candidates: `${API_BASE_URL}/candidates`,
  interviewers: `${API_BASE_URL}/interviewers`,
  users: `${API_BASE_URL}/users`,
}; 