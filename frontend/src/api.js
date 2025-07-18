// api.js - Centralized API configuration and methods
import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging (optional)
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to:`, config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API methods - organized by functionality
export const userAPI = {
  // Get all users
  getAllUsers: () => api.get('/users'),
  
  // Add a new user
  addUser: (userData) => api.post('/users', userData),
  
  // Get user statistics summary
  getStats: () => api.get('/users/stats/summary'),
};

export const leaderboardAPI = {
  // Get leaderboard with optional limit
  getLeaderboard: (limit = 10) => api.get(`/leaderboard?limit=${limit}`),
};

export const claimAPI = {
  // Claim points for a user
  claimPoints: (claimData) => api.post('/claims', claimData),
};

// Export the configured axios instance for direct use if needed
export default api;