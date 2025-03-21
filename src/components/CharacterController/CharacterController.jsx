import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import InfiniteRoad from '../InfinityRoad/InfinityRoad';
import './CharacterController.css';
import Obstacles from '../Obstacles/Obstacles';
import BananaGame from '../BananaGame/BananaGame';
import { getCurrentUser } from '../../services/auth';
import { saveScore } from '../../services/score';
import { applyColorToModel } from '../../utils/characterColors';

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
  const [showBananaGame, setShowBananaGame] = useState(false);
  const [characterColor, setCharacterColor] = useState('yellow');

  // Load user data and high score
  useEffect(() => {
    const user = getCurrentUser();
    if (user && user._id) {
      setCurrentUser(user);
      setHighScore(user.highScore || 0);
      setCharacterColor(user.selectedCharacter || 'yellow');
    } else {
      const localHighScore = parseInt(localStorage.getItem('highScore') || '0');
      setHighScore(localHighScore);
    }
  }, []);

  // Update high score when score changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      
      // If logged in, update user's high score on the server
      if (currentUser && currentUser._id) {
        const saveUserScore = async () => {
          try {
            await saveScore({ score, characterColor });
          } catch (error) {
            console.error('Error saving score:', error);
          }
        };
        
        saveUserScore();
      } else {
        // If not logged in, use local storage
        localStorage.setItem('highScore', score.toString());
      }
    }
  }, [score, highScore, currentUser, characterColor]);

  // Keyboard controls for character
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
        case ' ': 
        case 'ArrowUp':
          handleGameJump();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGameMode]); 

  // Handle collision with obstacles
  const handleCollision = (obstacle) => {
    // Show banana game instead of immediate game over
    setShowBananaGame(true);
    
    if (mixer) {
      mixer.stopAllAction();
    }
    
    // Character plays death animation
    fadeToAction('Death');
    setIsGameMode(false);
  };

  // Handle completing banana game successfully
  const handleBananaGameComplete = () => {
    setShowBananaGame(false);
    
    // Continue the game
    if (mixer) {
      mixer.stopAllAction();
    }
    
    setIsGameMode(true);
    fadeToAction('Running');
  };

  // Handle failing or skipping banana game
  const handleBananaGameFail = () => {
    setShowBananaGame(false);
    setGameOver(true);
  };

  // Initialize scene, camera, lights, and load character model
  useEffect(() => {
    if (!containerRef.current) return;

    console.log("Initializing scene");
    
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x87ceeb); // Sky blue background

    const newCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);
    newCamera.position.set(-5, 3, 10);
    newCamera.lookAt(0, 2, 0);
    initialCameraPosition.current = newCamera.position.clone();

    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setPixelRatio(window.devicePixelRatio);
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(newRenderer.domElement);

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
        newModel.position.y = 0.5; 
        
        // Apply character color
        applyColorToModel(newModel, characterColor);
        
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
        
        // Character plays dance animation initially
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
  }, [characterColor]);

  // Update score during gameplay
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

      // Update camera position during gameplay
      if (isGameMode && model) {
        const idealOffset = new THREE.Vector3(0, 10, -15);
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

  // Animation transition helper
  const fadeToAction = (actionName, duration = 0.2) => {
    if (!actions[actionName]) {
      console.warn(`Action "${actionName}" not found`);
      return;
    }

    const newAction = actions[actionName];
    
    if (mixer) {
      if (activeAction && activeAction !== newAction) {
        activeAction.fadeOut(duration);
      }
    }

    newAction.reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();

    setActiveAction(newAction);
  };

  // Character movement handler
  const moveCharacter = (direction) => {
    if (!model) return;
    const moveDistance = 3;
    
    if (direction === 'left') {
      model.position.x += moveDistance;
    } else if (direction === 'right') {
      model.position.x -= moveDistance;
    }
    
    // Limit movement to stay on the road
    model.position.x = THREE.MathUtils.clamp(model.position.x, -8, 8);
  };

  // Jump handler
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

  // Toggle game start/stop
  const toggleGameMode = () => {
    if (gameOver) {
      setGameOver(false);
      setScore(0);
      if (model) {
        model.position.copy(initialPosition.current);
      }
    }
    
    const startingGame = !isGameMode;
    setIsGameMode(startingGame);
    
    if (startingGame) {
      if (mixer) {
        mixer.stopAllAction();
      }
      
      fadeToAction('Running');
      
      if (camera && model) {
        camera.position.set(model.position.x, model.position.y + 3, model.position.z - 5);
        camera.lookAt(model.position.x, model.position.y + 2, model.position.z + 10);
      }
    } else {
      if (mixer) {
        mixer.stopAllAction();
      }
      
      fadeToAction('Dance');
      
      if (model) {
        model.rotation.set(0, 0, 0);
      }
    }
  };

  // Restart the game after game over
  const restartGame = () => {   
    setGameOver(false);
    setScore(0);
    
    if (model) {
      model.position.copy(initialPosition.current);
    }
    
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
      
      <div className="user-info">
        {currentUser ? (
          <>
            <span className="username">{currentUser.username}</span>
            <span className="score-value">Score: {score}</span>
            <span className="high-score-value">High Score: {highScore}</span>
            <span className="character-indicator" style={{ backgroundColor: characterColor }}>
              {characterColor.charAt(0).toUpperCase() + characterColor.slice(1)}
            </span>
          </>
        ) : (
          <Link to="/login" className="login-prompt">
            Login to save your score
          </Link>
        )}
      </div>
      
      {isGameMode && (
        <div className="score-display">
          Score: {score}
        </div>
      )}
      
      <div className="top-controls">
        {!gameOver && !isGameMode && !showBananaGame && (
          <>
            <button
              className="button button-red"
              onClick={toggleGameMode}
            >
              Start Game
            </button>
            
            <Link to="/characters" className="button button-purple">
              Change Character
            </Link>
          </>
        )}
        
        {isGameMode && !gameOver && !showBananaGame && (
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
  
      {gameOver && !showBananaGame && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <div className="game-over-buttons">
            <button className="restart-button" onClick={restartGame}>
              Start Again
            </button>
          </div>
          <Link to="/" className="back-home-btn">
            Back to Home
          </Link>
        </div>
      )}
  
      {isGameMode && !gameOver && !showBananaGame && (
        <div className="instructions">
          <p>Use ← → arrow keys to move</p>
          <p>Press space or ↑ to jump</p>
        </div>
      )}
      
      {showBananaGame && (
        <BananaGame 
          onComplete={handleBananaGameComplete}
          onCancel={handleBananaGameFail}
        />
      )}
    </div>
  );
};

export default CharacterController;