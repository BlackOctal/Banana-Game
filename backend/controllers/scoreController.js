const Score = require('../models/Score');
const User = require('../models/User');

// @desc    Save a new score
// @route   POST /api/scores
// @access  Private
exports.saveScore = async (req, res) => {
  try {
    const { score, characterColor } = req.body;
    
    // Create the score
    const newScore = await Score.create({
      user: req.user.id,
      score,
      characterColor
    });

    // Update user's high score if needed
    const user = await User.findById(req.user.id);
    
    if (score > user.highScore) {
      user.highScore = score;
      
      // Unlock characters based on high score
      if (score >= 50 && !user.unlockedCharacters.green) {
        user.unlockedCharacters.green = true;
      }
      
      if (score >= 100 && !user.unlockedCharacters.blue) {
        user.unlockedCharacters.blue = true;
      }
      
      if (score >= 150 && !user.unlockedCharacters.red) {
        user.unlockedCharacters.red = true;
      }
      
      await user.save();
    }

    res.status(201).json({
      _id: newScore._id,
      score: newScore.score,
      characterColor: newScore.characterColor,
      date: newScore.date,
      user: {
        _id: user._id,
        username: user.username,
        highScore: user.highScore,
        unlockedCharacters: user.unlockedCharacters
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's scores
// @route   GET /api/scores
// @access  Private
exports.getUserScores = async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user.id })
      .sort({ score: -1 })
      .limit(10);
    
    res.json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get top scores leaderboard
// @route   GET /api/scores/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Score.find()
      .sort({ score: -1 })
      .limit(10)
      .populate('user', 'username');
    
    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unlock character for user
// @route   PUT /api/scores/unlock-character
// @access  Private
exports.unlockCharacter = async (req, res) => {
  try {
    const { characterColor } = req.body;
    
    if (!['green', 'blue', 'red'].includes(characterColor)) {
      return res.status(400).json({ message: 'Invalid character color' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has enough score to unlock the character
    const scoreThresholds = {
      green: 50,
      blue: 100,
      red: 150
    };
    
    if (user.highScore < scoreThresholds[characterColor]) {
      return res.status(400).json({
        message: `You need a score of at least ${scoreThresholds[characterColor]} to unlock this character`
      });
    }
    
    // Unlock the character
    user.unlockedCharacters[characterColor] = true;
    await user.save();
    
    res.json({
      message: `${characterColor} character unlocked`,
      unlockedCharacters: user.unlockedCharacters
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Select character for user
// @route   PUT /api/scores/select-character
// @access  Private
exports.selectCharacter = async (req, res) => {
  try {
    const { characterColor } = req.body;
    
    if (!['yellow', 'green', 'blue', 'red'].includes(characterColor)) {
      return res.status(400).json({ message: 'Invalid character color' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if character is unlocked (yellow is always available)
    if (characterColor !== 'yellow' && !user.unlockedCharacters[characterColor]) {
      return res.status(400).json({ message: 'This character is not unlocked yet' });
    }
    
    // Set selected character
    user.selectedCharacter = characterColor;
    await user.save();
    
    res.json({
      message: `${characterColor} character selected`,
      selectedCharacter: user.selectedCharacter
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};