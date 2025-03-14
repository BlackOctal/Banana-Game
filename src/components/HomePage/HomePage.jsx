import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

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
      <div className="home-content">
        <h1>Banana Runner</h1>
        <p>Run through obstacles, collect bananas, and set new high scores!</p>
        
        {currentUser && (
          <div className="welcome-message">
            Welcome back, <span className="username-display">{currentUser.username}</span>!
            <p className="user-high-score">Your high score: {currentUser.highScore || 0}</p>
          </div>
        )}
        
        <div className="button-container">
          <Link to="/game" className="start-button">Start Game</Link>
          
          <div className="auth-buttons">
            {currentUser ? (
              <button onClick={handleLogout} className="auth-button logout-button">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="auth-button">Login</Link>
                <Link to="/register" className="auth-button">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;