import React, { useState, useEffect } from 'react';
import { fetchBananaPuzzle, validateBananaPuzzleAnswer } from '../../services/banana-api';
import './BananaGame.css';

const BananaGame = ({ onComplete, onCancel }) => {
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);

  // Fetch puzzle on component mount
  useEffect(() => {
    const getPuzzle = async () => {
      try {
        setLoading(true);
        const puzzleData = await fetchBananaPuzzle();
        setPuzzle(puzzleData);
      } catch (err) {
        setError('Failed to fetch puzzle. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getPuzzle();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!puzzle) {
      return;
    }
    
    const isCorrect = validateBananaPuzzleAnswer(puzzle, answer);
    
    if (isCorrect) {
      setSuccess(true);
      // Allow a brief moment to see success message
      setTimeout(() => onComplete(), 1500);
    } else {
      setAttempts(attempts + 1);
      setError('Incorrect answer! Try again.');
      
      // After 3 failed attempts, give up
      if (attempts >= 2) {
        setTimeout(() => onCancel(), 1500);
      }
    }
  };

  return (
    <div className="banana-game-container">
      <div className="banana-game-content">
        <h2>Answer Correctly For An Extra Life!</h2>
        
        {loading ? (
          <div className="loading">Loading puzzle...</div>
        ) : error && !success ? (
          <div className="error-message">{error}</div>
        ) : success ? (
          <div className="success-message">
            Correct! Getting extra life...
          </div>
        ) : (
          <>
            <p className="instruction">
              What number should replace the question mark?
            </p>

            {puzzle && puzzle.image && (
              <div className="puzzle-image">
                <img src={puzzle.image} alt="Banana Puzzle" />
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  required
                />
              </div>

              <button type="submit" className="submit-button">
                Submit Answer
              </button>
            </form>

            <div className="attempts">
              Attempts remaining: {3 - attempts}
            </div>
          </>
        )}

        <button 
          className="cancel-button" 
          onClick={onCancel}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default BananaGame;