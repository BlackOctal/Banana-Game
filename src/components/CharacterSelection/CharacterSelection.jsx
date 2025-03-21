import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableColors } from '../../utils/characterColors';
import { selectCharacter, unlockCharacter } from '../../services/score';
import { getCurrentUser } from '../../services/auth';
import './CharacterSelection.css';

const CharacterSelection = () => {
  const [availableColors, setAvailableColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    if (user && user.unlockedCharacters) {
      setAvailableColors(getAvailableColors(user.unlockedCharacters));
      setSelectedColor(user.selectedCharacter || 'yellow');
    } else {
      setAvailableColors(getAvailableColors());
    }
  }, []);

  const handleSelectCharacter = async (colorId) => {
    // If not logged in, show message
    if (!currentUser || !currentUser.token) {
      setMessage('Please log in to select different characters');
      return;
    }
    
    // If character not unlocked, show message
    const color = availableColors.find(c => c.id === colorId);
    if (!color.unlocked) {
      setMessage(`Score ${color.scoreRequired} points to unlock this character!`);
      return;
    }
    
    try {
      setLoading(true);
      await selectCharacter(colorId);
      setSelectedColor(colorId);
      setMessage(`${color.name} character selected!`);
      
      // Update current user in state
      const updatedUser = getCurrentUser();
      setCurrentUser(updatedUser);
    } catch (error) {
      setMessage(error.message || 'Failed to select character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="character-selection-container">
      <h1 className="selection-title">Select Your Character</h1>
      
      {message && (
        <div className={`message ${message.includes('Failed') || message.includes('Please log in') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <div className="characters-grid">
        {availableColors.map((color) => (
          <div 
            key={color.id}
            className={`character-option ${color.unlocked ? 'unlocked' : 'locked'} ${selectedColor === color.id ? 'selected' : ''}`}
            onClick={() => handleSelectCharacter(color.id)}
          >
            <div 
              className="character-color" 
              style={{ backgroundColor: `#${color.color.getHexString()}` }}
            />
            <div className="character-info">
              <span className="character-name">{color.name}</span>
              {!color.unlocked && (
                <span className="unlock-requirement">
                  Score {color.scoreRequired} to unlock
                </span>
              )}
            </div>
            {!color.unlocked && <div className="lock-icon">🔒</div>}
          </div>
        ))}
      </div>
      
      <div className="selection-actions">
        <Link to="/game" className="play-button">Play with selected character</Link>
        <Link to="/" className="back-button">Back to home</Link>
      </div>
    </div>
  );
};

export default CharacterSelection;