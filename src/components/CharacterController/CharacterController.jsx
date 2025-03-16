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


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      const storedHighScore = user.highScore || 0;
      setHighScore(storedHighScore);
    } else {
      const localHighScore = parseInt(localStorage.getItem('highScore') || '0');
      setHighScore(localHighScore);
    }
  }, []);

//user high score update
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      
      if (currentUser) {
        const updatedUser = { ...currentUser, highScore: score };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = users.map(user => {
          if (user.username === currentUser.username) {
            return { ...user, highScore: score };
          }
          return user;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      } else {
        localStorage.setItem('highScore', score.toString());
      }
    }
  }, [score, highScore, currentUser]);

  // character control key 
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

  // when character hit obstacles character act like dead and game is over
  const handleCollision = (obstacle) => {
    setGameOver(true);
    
    
    if (mixer) {
      mixer.stopAllAction();
    }
    
    fadeToAction('Death');
    setIsGameMode(false);
  };

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

    // character model 
    const loader = new GLTFLoader();
    loader.load(
      'models/gltf/RobotExpressive/RobotExpressive.glb', 
      (gltf) => {
        console.log("Model loaded successfully", gltf);
        const newModel = gltf.scene;
        newModel.position.y = 0.5; 
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
        
        // Character plays dance animation 
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
  }, []);

  // Update score part
  useEffect(() => {
    if (isGameMode) {
      const scoreInterval = setInterval(() => {
        setScore(prev => prev + 1);
      }, 1000);

      return () => clearInterval(scoreInterval);
    }
  }, [isGameMode]);

  useEffect(() => {
    if (!renderer || !scene || !camera || !mixer) return;

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixer.update(delta);

      // character view while running
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

  // character movements control
  const moveCharacter = (direction) => {
    if (!model) return;
    const moveDistance = 3;
    
    if (direction === 'left') {
      model.position.x += moveDistance;
    } else if (direction === 'right') {
      model.position.x -= moveDistance;
    }
    
    model.position.x = THREE.MathUtils.clamp(model.position.x, -8, 8);
  };


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

  // after dead charcter start to run again
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
        {!gameOver && !isGameMode && (
          <>
            <button
              className="button button-red"
              onClick={toggleGameMode}
            >
              Start Game
            </button>
            
          </>
        )}
        
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
  
      {isGameMode && !gameOver && (
        <div className="instructions">
          <p>Use ← → arrow keys to move</p>
        </div>
      )}
    </div>
  );
};

export default CharacterController;