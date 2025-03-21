import api from './api';

// Save score
export const saveScore = async (scoreData) => {
  try {
    const response = await api.post('/scores', scoreData);
    
    // Update local user data if high score changed
    if (response.data && response.data.user) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        highScore: response.data.user.highScore,
        unlockedCharacters: response.data.user.unlockedCharacters
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get user scores
export const getUserScores = async () => {
  try {
    const response = await api.get('/scores');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Get leaderboard
export const getLeaderboard = async () => {
  try {
    const response = await api.get('/scores/leaderboard');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Unlock character
export const unlockCharacter = async (characterColor) => {
  try {
    const response = await api.put('/scores/unlock-character', { characterColor });
    
    // Update local user data
    if (response.data && response.data.unlockedCharacters) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        unlockedCharacters: response.data.unlockedCharacters
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Select character
export const selectCharacter = async (characterColor) => {
  try {
    const response = await api.put('/scores/select-character', { characterColor });
    
    // Update local user data
    if (response.data && response.data.selectedCharacter) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        selectedCharacter: response.data.selectedCharacter
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};