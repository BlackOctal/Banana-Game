import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import bananaCharacter from '../../assets/banana-character.svg';

const HomePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };
  
  return (
    <div className="home-container">
      
      {/* Main content */}
      <div className="home-content">
        {/* User authentication message */}
        {currentUser && (
          <div className="welcome-message">
            Welcome, <span className="username-display">{currentUser.username}</span>!
            <div className="user-high-score">High Score: {currentUser.highScore || 0}</div>
          </div>
        )}
        
        {/* Auth buttons */}
        
     
          
      
        
        
        {/* Banana character */}
        <div className="banana-character">
        <img 
          src={bananaCharacter} 
          alt="Banana Character" 
          style={{ width: '100%', height: '100%' }}
        />
        </div>
        
        {/* Game title */}
        <div className="game-title">
          <h1 className="title-text">BANANA</h1>
          <h1 className="title-text small">RUNNER</h1>
        
        </div>
        <div className='auth'>
          <Link to="/login" className="auth-button">Login</Link>
          <Link to="/register" className="auth-button">Register</Link>
          </div>
        
        
        {/* Play button */}
        <Link to="/game" className="play-button">
          PLAY
        </Link>
        
        {/* Bottom icon buttons */}
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