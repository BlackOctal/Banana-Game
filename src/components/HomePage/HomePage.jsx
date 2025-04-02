import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import { getCurrentUser, logout } from '../../services/auth';
import { getAvailableColors } from '../../utils/characterColors';

const HomePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user._id) {
      setCurrentUser(user);

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
            <span className="username-display">Hi : {currentUser.username}</span>
            <div className="user-high-score">High Score: {currentUser.highScore || 0}</div>
          </div>
        ) : null}

        <div className="banana-character">

        </div>

        <div className="game-title">
          <h1 className="title-text">BANANA</h1>
          <h1 className="title-text small">RUNNER</h1>
        </div>

        <div className="game-buttons">
          <Link to="/game" className="play-button">
            PLAY
          </Link>

          {currentUser ? null : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-button">Login</Link>
              <Link to="/register" className="auth-button">Register</Link>
            </div>
          )}
        </div>

        <div className="icon-buttons">
          {currentUser && (
            <button onClick={handleLogout} className="icon-button" title="Logout">
              Quit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
