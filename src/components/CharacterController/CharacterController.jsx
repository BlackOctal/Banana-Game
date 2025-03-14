import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import InfiniteRoad from '../InfinityRoad/InfinityRoad';
import './CharacterController.css';
import Obstacles from '../Obstacles/Obstacles';

const CharacterController = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [model, setModel] = useState(null);
  const [mixer, setMixer] = useState(null);
  const [actions, setActions] = useState({});
  const [activeAction, setActiveAction] = useState(null);
  const [clock] = useState(new THREE.Clock());
  const [isGameMode, setIsGameMode] = useState(false);
  const initialPosition = useRef(new THREE.Vector3(0, 0, 0));
  const initialCameraPosition = useRef(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      const storedHighScore = user.highScore || 0;
      setHighScore(storedHighScore);
    } else {
      // Get high score from localStorage if no user is logged in
      const localHighScore = parseInt(localStorage.getItem('highScore') || '0');
      setHighScore(localHighScore);
    }
  }, []);

  // Scroll to top of the page when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      
      if (currentUser) {
        // Update user's high score
        const updatedUser = { ...currentUser, highScore: score };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Update users array if needed
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = users.map(user => {
          if (user.username === currentUser.username) {
            return { ...user, highScore: score };
          }
          return user;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      } else {
        // Store high score in localStorage for non-logged in users
        localStorage.setItem('highScore', score.toString());
      }
    }
  }, [score, highScore, currentUser]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isGameMode) return;

      switch (event.key) {
        case 'ArrowLeft':
          moveCharacter('left');
          break;
        case 'ArrowRight':
          moveCharacter('right');
          break;
        case ' ': // Spacebar
        case 'ArrowUp':
          handleGameJump();
          break;
        default:
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGameMode]); 

  // Handle collision with obstacles
  const handleCollision = (obstacle) => {
    setGameOver(true);
    
    // Stop all current animations before playing death
    if (mixer) {
      mixer.stopAllAction();
    }
    
    fadeToAction('Death');
    setIsGameMode(false);
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    console.log("Initializing scene");
    
    // Scene setup
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Camera setup
    const newCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);
    newCamera.position.set(-5, 3, 10);
    newCamera.lookAt(0, 2, 0);
    initialCameraPosition.current = newCamera.position.clone();

    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setPixelRatio(window.devicePixelRatio);
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(newRenderer.domElement);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    newScene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(0, 20, 10);
    newScene.add(dirLight);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    console.log("Scene setup complete");

    // Load character model
    const loader = new GLTFLoader();
    loader.load(
      'models/gltf/RobotExpressive/RobotExpressive.glb', 
      (gltf) => {
        console.log("Model loaded successfully", gltf);
        const newModel = gltf.scene;
        newModel.position.y = 0.5; // Lift character slightly above road
        newScene.add(newModel);
        setModel(newModel);
        initialPosition.current.copy(newModel.position);

        const newMixer = new THREE.AnimationMixer(newModel);
        setMixer(newMixer);
        
        const newActions = {};
        gltf.animations.forEach((clip) => {
          const action = newMixer.clipAction(clip);
          newActions[clip.name] = action;
          
          if (['Death'].includes(clip.name)) {
            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;
          }
        });

        setActions(newActions);
        
        // Play initial animation
        if (newActions['Dance']) {
          newActions['Dance'].reset().play();
          setActiveAction(newActions['Dance']);
        }
      },
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error("Error loading model:", error);
      }
    );

    // Handle window resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update score
  useEffect(() => {
    if (isGameMode) {
      const scoreInterval = setInterval(() => {
        setScore(prev => prev + 1);
      }, 1000);

      return () => clearInterval(scoreInterval);
    }
  }, [isGameMode]);

  // Animation loop
  useEffect(() => {
    if (!renderer || !scene || !camera || !mixer) return;

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixer.update(delta);

      // Update camera for game mode
      if (isGameMode && model) {
        const idealOffset = new THREE.Vector3(0, 10, -15);  // Increased y from 5 to 10
        const idealLookat = new THREE.Vector3(0, 2, 10);    
        
        const modelPosition = model.position.clone();
        const currentOffset = idealOffset.clone();
        currentOffset.applyMatrix4(model.matrix);
        
        camera.position.lerp(currentOffset, 0.1);
        const targetLook = modelPosition.clone().add(idealLookat);
        camera.lookAt(targetLook);
      }

      renderer.render(scene, camera);
    };

    animate();
  }, [renderer, scene, camera, mixer, clock, model, isGameMode]);

  // Handle animation transitions
  const fadeToAction = (actionName, duration = 0.2) => {
    if (!actions[actionName]) {
      console.warn(`Action "${actionName}" not found`);
      return;
    }

    const newAction = actions[actionName];
    
    // Reset mixer first by stopping all actions
    if (mixer) {
      // We don't want to stop all actions, just fade between them
      if (activeAction && activeAction !== newAction) {
        activeAction.fadeOut(duration);
      }
    }

    // Reset and play the new action
    newAction.reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();

    setActiveAction(newAction);
  };

  // Handle movement
  const moveCharacter = (direction) => {
    if (!model) return;
    const moveDistance = 3;
    
    if (direction === 'left') {
      model.position.x += moveDistance;
    } else if (direction === 'right') {
      model.position.x -= moveDistance;
    }
    
    // Clamp character position to road width
    model.position.x = THREE.MathUtils.clamp(model.position.x, -8, 8);
  };

  // Handle jump
  const handleGameJump = () => {
    if (!isGameMode || !actions['Jump']) return;
    
    const jumpAction = actions['Jump'];
    const runningAction = actions['Running'];
    
    jumpAction.reset();
    jumpAction.setEffectiveTimeScale(2.0);
    jumpAction.play();
    
    setTimeout(() => {
      jumpAction.stop();
      runningAction.play();
    }, 400);
  };

  // Toggle game mode
  const toggleGameMode = () => {
    // Always scroll to top when toggling game mode
    window.scrollTo(0, 0);
    
    if (gameOver) {
      // Reset game state
      setGameOver(false);
      setScore(0);
      if (model) {
        model.position.copy(initialPosition.current);
      }
    }
    
    const startingGame = !isGameMode;
    setIsGameMode(startingGame);
    
    if (startingGame) {
      // Starting game - make sure to reset mixer before playing a new animation
      if (mixer) {
        mixer.stopAllAction();
      }
      
      fadeToAction('Running');
      
      if (camera && model) {
        camera.position.set(model.position.x, model.position.y + 3, model.position.z - 5);
        camera.lookAt(model.position.x, model.position.y + 2, model.position.z + 10);
      }
    } else {
      // Stopping game
      if (mixer) {
        mixer.stopAllAction();
      }
      
      fadeToAction('Dance');
      
      if (model) {
        model.rotation.set(0, 0, 0);
      }
    }
  };

  // Start a new game after death
  const restartGame = () => {
    // Always scroll to top when restarting
    window.scrollTo(0, 0);
    
    setGameOver(false);
    setScore(0);
    
    // Reset character position
    if (model) {
      model.position.copy(initialPosition.current);
    }
    
    // Reset all animations
    if (mixer) {
      mixer.stopAllAction();
    }
    
    setIsGameMode(true);
    fadeToAction('Running');
  };

  return (
    <div className="container">
      <div ref={containerRef} className="canvas-container" />
      
      {scene && (
        <>
          <InfiniteRoad scene={scene} isGameMode={isGameMode} />
          <Obstacles 
            scene={scene}
            isGameMode={isGameMode}
            playerPosition={model?.position}
            onCollision={handleCollision}
          />
        </>
      )}
      
      {/* User Info Display */}
      <div className="user-info">
        {currentUser ? (
          <>
            <span className="username">{currentUser.username}</span>
            <span className="score-value">Score: {score}</span>
            <span className="high-score-value">High Score: {highScore}</span>
          </>
        ) : (
          <Link to="/login" className="login-prompt">
            Login to save your score
          </Link>
        )}
      </div>
      
      {/* Score Display */}
      {isGameMode && (
        <div className="score-display">
          Score: {score}
        </div>
      )}
      
      {/* Top Controls (moved from bottom to top) */}
      <div className="top-controls">
        {!gameOver && !isGameMode && (
          <>
            <button
              className="button button-red"
              onClick={toggleGameMode}
            >
              Start Game
            </button>
            
            {/* <div className="animation-controls">
              {['Walking', 'Running', 'Dance', 'Death', 'Jump'].map((state) => (
                <button
                  key={state}
                  className="button button-green"
                  onClick={() => {
                    if (state === 'Jump') {
                      fadeToAction('Jump');
                      setTimeout(() => {
                        fadeToAction('Dance');
                      }, 1000);
                    } else {
                      fadeToAction(state);
                    }
                  }}
                >
                  {state}
                </button>
              ))}
            </div> */}
          </>
        )}
        
        {/* Only show Stop Game button when in game mode */}
        {isGameMode && !gameOver && (
          <button
            className="button button-red stop-button"
            onClick={toggleGameMode}
          >
            Stop Game
          </button>
        )}
        
        <Link to="/" className="back-home-btn">
          Back to Home
        </Link>
      </div>
  
      {/* Game Over Message */}
      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <div className="game-over-buttons">
            <button className="restart-button" onClick={restartGame}>
              Start Again
            </button>
            <button className="extra-life-button">
              Play Banana Game for Extra Life
            </button>
          </div>
          <Link to="/" className="back-home-btn">
            Back to Home
          </Link>
        </div>
      )}
  
      {/* Game Instructions */}
      {isGameMode && !gameOver && (
        <div className="instructions">
          <p>Use ← → arrow keys to move</p>
          <p>Press ↑ or Space to jump</p>
        </div>
      )}
    </div>
  );
};

export default CharacterController;