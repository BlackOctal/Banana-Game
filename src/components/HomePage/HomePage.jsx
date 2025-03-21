import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import bananaCharacter from '../../assets/banana-character.svg';
import { getCurrentUser, logout } from '../../services/auth';
import { getAvailableColors } from '../../utils/characterColors';

const HomePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);
  
  useEffect(() => {
    const user = getCurrentUser();
    if (user && user._id) {
      setCurrentUser(user);
      
      // Get available/unlocked characters
      const colors = getAvailableColors(user.unlockedCharacters);
      setUnlockedCharacters(colors.filter(color => color.unlocked));
    }
  }, []);
  
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setUnlockedCharacters([]);
  };
  
  return (
    <div className="home-container">
      <div className="home-content">
        {currentUser ? (
          <div className="welcome-message">
            <span className="username-display">{currentUser.username}</span>
            <div className="user-high-score">High Score: {currentUser.highScore || 0}</div>
            
            {unlockedCharacters.length > 1 && (
              <div className="unlocked-characters">
                Characters: 
                {unlockedCharacters.map(color => (
                  <span 
                    key={color.id}
                    className="character-dot"
                    style={{ backgroundColor: `#${color.color.getHexString()}` }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
        
        <div className="banana-character">
          <img 
            src={bananaCharacter} 
            alt="Banana Character" 
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        
        <div className="game-title">
          <h1 className="title-text">BANANA</h1>
          <h1 className="title-text small">RUNNER</h1>
        </div>
        
        <div className="game-buttons">
          <Link to="/game" className="play-button">
            PLAY
          </Link>
          
          {currentUser ? (
            <Link to="/characters" className="character-button">
              CHARACTERS
            </Link>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-button">Login</Link>
              <Link to="/register" className="auth-button">Register</Link>
            </div>
          )}
        </div>
        
        <div className="icon-buttons">
          {currentUser && (
            <button onClick={handleLogout} className="icon-button" title="Logout">
              ⎋
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;