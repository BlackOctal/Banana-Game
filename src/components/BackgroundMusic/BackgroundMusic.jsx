import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const BackgroundMusic = ({ src, volume = 10.5, autoPlay = true }) => {
  const [audio] = useState(new Audio(src));
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const location = useLocation();

  // Set up audio properties
  useEffect(() => {
    audio.loop = true;
    audio.volume = volume;
    
    // Clean up when component unmounts
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audio, volume]);

  // Handle playing/pausing
  useEffect(() => {
    if (isPlaying) {
      const playPromise = audio.play();
      
      // Handle autoplay policy restrictions
      if (playPromise !== undefined) {
        playPromise
          .catch(error => {
            console.error('Audio playback failed:', error);
            // Retry playing on user interaction
            document.addEventListener('click', function() {
              if (audio.paused) {
                audio.play().catch(e => console.error('Retry failed:', e));
              }
            }, { once: true });
          });
      }
    } else {
      audio.pause();
    }
  }, [audio, isPlaying]);

  // Optional: React to route changes (e.g., pause music on login/register)
  useEffect(() => {
    // Play music only on homepage and game page
    if (location.pathname === '/' || location.pathname === '/game') {
      if (!isPlaying) setIsPlaying(true);
    } else {
      // Optional: pause music on other pages like login/register
      // if (isPlaying) setIsPlaying(false);
    }
  }, [location, isPlaying]);

  // Provide controls to toggle music
  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="music-controls">
      <button 
        onClick={toggleMusic}
        style={{
          position: 'fixed',
          bottom: '15px',
          right: '15px',
          padding: '10px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={isPlaying ? 'Mute music' : 'Play music'}
      >
        {isPlaying ? '🔊' : '🔇'}
      </button>
    </div>
  );
};

export default BackgroundMusic;