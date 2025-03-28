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

// Define character colors for different score levels
const CHARACTER_COLORS = {
  default: 0x4c9e6d,  // Default green color
  level1: 0xffff00,   // Yellow (50 points)
  level2: 0x0088ff,   // Blue (100 points)
  level3: 0xff0000    // Red (150 points)
};

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
  
  // Color selection states
  const [activeColor, setActiveColor] = useState('default');
  const [unlockedColors, setUnlockedColors] = useState({
    yellow: false,
    blue: false,
    red: false
  });

  // Load user data and high score
  useEffect(() => {
    const user = getCurrentUser();
    if (user && user._id) {
      setCurrentUser(user);
      setHighScore(user.highScore || 0);
      setCharacterColor(user.selectedCharacter || 'yellow');
      
      // Set unlocked colors based on high score
      if (user.highScore >= 150) {
        setUnlockedColors({ yellow: true, blue: true, red: true });
      } else if (user.highScore >= 100) {
        setUnlockedColors({ yellow: true, blue: true, red: false });
      } else if (user.highScore >= 50) {
        setUnlockedColors({ yellow: true, blue: false, red: false });
      }
      
      // If user has unlocked colors saved, load them
      if (user.unlockedColors) {
        setUnlockedColors(user.unlockedColors);
      }
    } else {
      const localHighScore = parseInt(localStorage.getItem('highScore') || '0');
      setHighScore(localHighScore);
      
      // Check for saved unlocked colors in localStorage
      const savedUnlockedColors = JSON.parse(localStorage.getItem('unlockedColors'));
      if (savedUnlockedColors) {
        setUnlockedColors(savedUnlockedColors);
      } else {
        // Set unlocked colors based on local high score
        if (localHighScore >= 150) {
          setUnlockedColors({ yellow: true, blue: true, red: true });
        } else if (localHighScore >= 100) {
          setUnlockedColors({ yellow: true, blue: true, red: false });
        } else if (localHighScore >= 50) {
          setUnlockedColors({ yellow: true, blue: false, red: false });
        }
      }
    }
  }, []);

  // Update unlocked colors based on score during gameplay
  useEffect(() => {
    if (!isGameMode) return;
    
    // Update unlocked colors based on score milestones
    if (score >= 150 && !unlockedColors.red) {
      setUnlockedColors(prev => ({ ...prev, red: true }));
    } 
    else if (score >= 100 && !unlockedColors.blue) {
      setUnlockedColors(prev => ({ ...prev, blue: true }));
    } 
    else if (score >= 50 && !unlockedColors.yellow) {
      setUnlockedColors(prev => ({ ...prev, yellow: true }));
    }
  }, [score, unlockedColors, isGameMode]);

  // Update high score when score changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      
      // If logged in, update user's high score on the server
      if (currentUser && currentUser._id) {
        const saveUserScore = async () => {
          try {
            await saveScore({ 
              score, 
              characterColor,
              unlockedColors: unlockedColors // Save unlocked colors with score
            });
          } catch (error) {
            console.error('Error saving score:', error);
          }
        };
        
        saveUserScore();
      } else {
        // If not logged in, use local storage
        localStorage.setItem('highScore', score.toString());
        localStorage.setItem('unlockedColors', JSON.stringify(unlockedColors));
      }
    }
  }, [score, highScore, currentUser, characterColor, unlockedColors]);

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

  // Function to change character color when color button is clicked
  const handleColorChange = (colorKey) => {
    if (!model) return;
    
    setActiveColor(colorKey);
    const colorHex = CHARACTER_COLORS[colorKey];
    
    // Store the current action name
    const currentActionName = activeAction ? 
      Object.keys(actions).find(key => actions[key] === activeAction) : null;
    
    // If in game mode, briefly pause animations
    const wasInGameMode = isGameMode;
    if (wasInGameMode && mixer) {
      mixer.stopAllAction();
    }
    
    // Apply color change
    changeModelColor(model, colorHex);
    
    // Resume the current animation after color change
    if (currentActionName && mixer) {
      setTimeout(() => {
        fadeToAction(currentActionName, 0.1);
        
        // If was in game mode, ensure we're in Running animation
        if (wasInGameMode) {
          fadeToAction('Running', 0.1);
        }
      }, 50);
    }
  };

  // Improved function to change the material color of the model
  const changeModelColor = (model, color) => {
    if (!model) return;
    
    console.log(`Changing model color to: ${color.toString(16)}`);
    
    model.traverse((object) => {
      if (object.isMesh && object.material) {
        // Handle both single material and material array
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material && material.color) {
              material.color.setHex(color);
              // Also update emissive for better effect
              if (material.emissive) {
                material.emissive.setHex(0x111111); // Dark emissive
              }
            }
          });
        } else if (object.material && object.material.color) {
          object.material.color.setHex(color);
          // Also update emissive for better effect
          if (object.material.emissive) {
            object.material.emissive.setHex(0x111111); // Dark emissive
          }
        }
      }
    });
  };

  // IMPORTANT: Updated model loading useEffect WITHOUT color dependencies
  useEffect(() => {
    if (!containerRef.current) return;

    console.log("Initializing scene");
    
    // Create a new scene
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Set up camera
    const newCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);
    newCamera.position.set(-5, 3, 10);
    newCamera.lookAt(0, 2, 0);
    initialCameraPosition.current = newCamera.position.clone();

    // Set up renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setPixelRatio(window.devicePixelRatio);
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(newRenderer.domElement);

    // Add lights - IMPORTANT for visibility
    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
    hemiLight.position.set(0, 20, 0);
    newScene.add(hemiLight);

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(5, 10, 7.5);
    newScene.add(dirLight);

    // Ambient light - ensures everything is visible
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    newScene.add(ambientLight);

    // Set state
    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    console.log("Scene setup complete");

    // Create road first (separate from character loading)
    const roadGeometry = new THREE.PlaneGeometry(40, 110);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 0);
    road.name = "Road";
    newScene.add(road);

    // Add road markings
    const lineGeometry = new THREE.PlaneGeometry(0.5, 110);
    const lineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.01, 0); // Slightly above road
    centerLine.name = "CenterLine";
    newScene.add(centerLine);

    // Load character model
    const loader = new GLTFLoader();
    loader.load(
      'models/gltf/RobotExpressive/RobotExpressive.glb', 
      (gltf) => {
        console.log("Model loaded successfully");
        
        // Log model structure to help debug
        console.log("Model structure:", gltf.scene);
        
        const newModel = gltf.scene;
        newModel.position.y = 0.5;
        newModel.name = "RobotCharacter";
        
        // Log all mesh names to help with debugging
        console.log("Analyzing model meshes:");
        newModel.traverse(object => {
          if (object.isMesh) {
            console.log(`- Mesh: ${object.name}`);
          }
        });
        
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
        
        // Apply initial character color after model is loaded
        if (activeColor && CHARACTER_COLORS[activeColor]) {
          changeModelColor(newModel, CHARACTER_COLORS[activeColor]);
        } else {
          applyColorToModel(newModel, characterColor);
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
  }, []); // REMOVED dependencies on characterColor and activeColor

  // Add a separate useEffect for color changes
  useEffect(() => {
    if (!model) return;
    
    console.log(`Applying color for activeColor: ${activeColor}`);
    
    // Apply color change based on active color
    if (activeColor && CHARACTER_COLORS[activeColor]) {
      changeModelColor(model, CHARACTER_COLORS[activeColor]);
    } else {
      // Fallback to normal applyColorToModel method
      applyColorToModel(model, characterColor);
    }
  }, [model, activeColor, characterColor]);

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
        // Position camera behind character for running view
        const idealOffset = new THREE.Vector3(0, 10, -15);
        const idealLookat = new THREE.Vector3(0, 2, 10);
        
        // Set camera position directly behind character
        camera.position.x = model.position.x;
        camera.position.y = model.position.y + idealOffset.y; 
        camera.position.z = model.position.z + idealOffset.z;
        
        // Look ahead of character
        camera.lookAt(
          model.position.x,
          model.position.y + idealLookat.y,
          model.position.z + idealLookat.z
        );
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
      model.position.x -= moveDistance;
    } else if (direction === 'right') {
      model.position.x += moveDistance;
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
        // Make sure to reset all animations first
        mixer.stopAllAction();
      }
      
      // Explicitly reset the model position and rotation
      if (model) {
        model.position.copy(initialPosition.current);
        model.rotation.set(0, 0, 0);
      }
      
      // Wait a frame before starting the running animation
      setTimeout(() => {
        fadeToAction('Running');
        
        // Reset camera position
        if (camera && model) {
          // Position camera behind character
          camera.position.set(0, 10, -15);
          camera.lookAt(0, 2, 10);
        }
      }, 50);
      
    } else {
      if (mixer) {
        mixer.stopAllAction();
      }
      
      fadeToAction('Dance');
      
      if (model) {
        model.rotation.set(0, 0, 0);
      }
      
      // Reset camera position when not in game mode
      if (camera && initialCameraPosition.current) {
        camera.position.copy(initialCameraPosition.current);
        camera.lookAt(0, 2, 0);
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

      {/* Color selection buttons on the left side */}
      <div className="color-buttons">
        <button 
          className={`color-btn default-color ${activeColor === 'default' ? 'active' : ''}`}
          onClick={() => handleColorChange('default')}
          title="Default Green"
        ></button>
        
        <button 
          className={`color-btn yellow-color ${activeColor === 'level1' ? 'active' : ''} ${!unlockedColors.yellow ? 'locked' : ''}`}
          onClick={() => unlockedColors.yellow && handleColorChange('level1')}
          title={unlockedColors.yellow ? "Yellow (50+ Score)" : "Locked - Reach 50 points to unlock"}
        >
          {!unlockedColors.yellow && <span className="lock-icon">🔒</span>}
        </button>
        
        <button 
          className={`color-btn blue-color ${activeColor === 'level2' ? 'active' : ''} ${!unlockedColors.blue ? 'locked' : ''}`}
          onClick={() => unlockedColors.blue && handleColorChange('level2')}
          title={unlockedColors.blue ? "Blue (100+ Score)" : "Locked - Reach 100 points to unlock"}
        >
          {!unlockedColors.blue && <span className="lock-icon">🔒</span>}
        </button>
        
        <button 
          className={`color-btn red-color ${activeColor === 'level3' ? 'active' : ''} ${!unlockedColors.red ? 'locked' : ''}`}
          onClick={() => unlockedColors.red && handleColorChange('level3')}
          title={unlockedColors.red ? "Red (150+ Score)" : "Locked - Reach 150 points to unlock"}
        >
          {!unlockedColors.red && <span className="lock-icon">🔒</span>}
        </button>
      </div>
      
      <div className="user-info">
        {currentUser ? (
          <>
            <span className="username">{currentUser.username}</span>
            <span className="score-value">Score: {score}</span>
            <span className="high-score-value">High Score: {highScore}</span>
            <span className="character-indicator" style={{ backgroundColor: characterColor }}>
              {characterColor.charAt(0).toUpperCase() + characterColor.slice(1)}
            </span>
             <Link to="/" className="back-home-btn">
          Back to Home
        </Link>
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