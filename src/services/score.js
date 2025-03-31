import api from './api';

export const saveScore = async (scoreData) => {
  try {
    const response = await api.post('/scores', scoreData);
    
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

export const getUserScores = async () => {
  try {
    const response = await api.get('/scores');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

export const getLeaderboard = async () => {
  try {
    const response = await api.get('/scores/leaderboard');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

export const unlockCharacter = async (characterColor) => {
  try {
    const response = await api.put('/scores/unlock-character', { characterColor });
    
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

export const selectCharacter = async (characterColor) => {
  try {
    const response = await api.put('/scores/select-character', { characterColor });
    
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