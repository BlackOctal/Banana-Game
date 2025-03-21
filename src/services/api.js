import axios from 'axios';

// Replace this line that's causing the error:
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// With this for Vite:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Or simply hardcode it if you don't need environment variables yet:
// const API_URL = 'http://localhost:5000/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;