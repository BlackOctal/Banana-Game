import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      // For now, we'll use localStorage to simulate registration
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Check if username already exists
      if (users.some(user => user.username === formData.username)) {
        setError('Username already exists');
        return;
      }
      
      // Add new user
      const newUser = {
        username: formData.username,
        password: formData.password,
        highScore: 0
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Set user as logged in
      localStorage.setItem('currentUser', JSON.stringify({
        username: newUser.username,
        highScore: newUser.highScore
      }));
      
      // Redirect to home page
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h1>Register</h1>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="auth-submit-btn">Register</button>
        </form>
        
        <p className="auth-redirect">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        
        <Link to="/" className="back-home">Back to Home</Link>
      </div>
    </div>
  );
};

export default Register;