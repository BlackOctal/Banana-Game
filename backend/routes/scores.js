const express = require('express');
const router = express.Router();
const { 
  saveScore, 
  getUserScores, 
  getLeaderboard,
  unlockCharacter,
  selectCharacter
} = require('../controllers/scoreController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.post('/', protect, saveScore);
router.get('/', protect, getUserScores);
router.put('/unlock-character', protect, unlockCharacter);
router.put('/select-character', protect, selectCharacter);

module.exports = router;