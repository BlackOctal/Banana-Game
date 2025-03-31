const Score = require('../models/Score');
const User = require('../models/User');

exports.saveScore = async (req, res) => {
  try {
    const { score, characterColor } = req.body;
    
    const newScore = await Score.create({
      user: req.user.id,
      score,
      characterColor
    });

    const user = await User.findById(req.user.id);
    
    if (score > user.highScore) {
      user.highScore = score;
      
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
    
    if (characterColor !== 'yellow' && !user.unlockedCharacters[characterColor]) {
      return res.status(400).json({ message: 'This character is not unlocked yet' });
    }

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