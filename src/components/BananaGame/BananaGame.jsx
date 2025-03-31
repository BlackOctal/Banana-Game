import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BananaGame.css';

const BananaGame = ({ onComplete, onCancel }) => {
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://marcconrad.com/uob/banana/api.php');
        setPuzzle(response.data);
      } catch (err) {
        setError('Failed to fetch puzzle. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!puzzle || !puzzle.solution) {
      return;
    }
    
    const userAnswer = parseInt(answer, 10);
    const isCorrect = userAnswer === puzzle.solution;
    
    if (isCorrect) {
      setSuccess(true);

      setTimeout(() => onComplete(), 1500);
    } else {
      setAttempts(attempts + 1);
      setError('Incorrect answer! Try again.');
      setAnswer(''); 
      
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

            {puzzle && puzzle.question && (
              <div className="puzzle-image">
                <img src={puzzle.question} alt="Banana Puzzle" />
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
              Attempts remaining: 1
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