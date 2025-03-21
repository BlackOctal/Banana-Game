import axios from 'axios';

const BANANA_API_URL = 'http://marcconrad.com/uob/banana/api.php';

// Fetch a new banana game puzzle
export const fetchBananaPuzzle = async () => {
  try {
    const response = await axios.get(BANANA_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching banana puzzle:', error);
    throw error;
  }
};

// Validate banana puzzle answer
export const validateBananaPuzzleAnswer = (puzzleData, answer) => {
  // Check if the puzzle data and solution exist
  if (!puzzleData || !puzzleData.solution) {
    return false;
  }
  
  // Convert answer to integer and compare with solution
  const numericAnswer = parseInt(answer, 10);
  return numericAnswer === puzzleData.solution;
};