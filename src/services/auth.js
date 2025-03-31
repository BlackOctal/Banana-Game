import api from './api';

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

export const login = async (userData) => {
  try {
    const response = await api.post('/auth/login', userData);
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/auth/profile', userData);
    
    if (response.data) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

export const isAuthenticated = () => {
  return localStorage.getItem('token') ? true : false;
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user') || '{}');
};