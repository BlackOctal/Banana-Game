import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import InfiniteRoad from '../InfinityRoad/InfinityRoad';
import './CharacterController.css';
import Obstacles from '../Obstacles/Obstacles';

const CharacterController = () => {
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
      fadeToAction('Death');
      setIsGameMode(false);
      
      // Reset game after 2 seconds
      setTimeout(() => {
        setGameOver(false);
        setScore(0);
        if (model) {
          model.position.copy(initialPosition.current);
        }
        fadeToAction('Dance');
      }, 2000);
    };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

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

    // Load character model
    const loader = new GLTFLoader();
    loader.load('models/gltf/RobotExpressive/RobotExpressive.glb', (gltf) => {
      const newModel = gltf.scene;
      newModel.position.y = 0.5; // Lift character slightly above road
      newScene.add(newModel);
      setModel(newModel);
      initialPosition.current.copy(newModel.position);

      const newMixer = new THREE.AnimationMixer(newModel);
      const newActions = {};
      
      gltf.animations.forEach((clip) => {
        const action = newMixer.clipAction(clip);
        newActions[clip.name] = action;
        
        if (['Death'].includes(clip.name)) {
          action.clampWhenFinished = true;
          action.loop = THREE.LoopOnce;
        }
      });

      setMixer(newMixer);
      setActions(newActions);
      setActiveAction(newActions['Dance']);
      newActions['Dance'].play();
    });

    return () => {
      containerRef.current?.removeChild(renderer.domElement);
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
    if (!actions[actionName]) return;

    const newAction = actions[actionName];
    if (activeAction === newAction) return;

    if (activeAction) {
      activeAction.fadeOut(duration);
    }

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
    setIsGameMode(!isGameMode);
    if (!isGameMode) {
      fadeToAction('Running');
      if (camera && model) {
        camera.position.set(model.position.x, model.position.y + 3, model.position.z - 5);
        camera.lookAt(model.position.x, model.position.y + 2, model.position.z + 10);
      }
    } else {
      fadeToAction('Dance');
      if (model) {
        model.rotation.set(0, 0, 0);
      }
    }
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
      
      {/* Score Display */}
      {isGameMode && (
        <div className="score-display">
          Score: {score}
        </div>
      )}
  
      {/* Game Over Message */}
      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
        </div>
      )}
  
      {/* Updated Game Instructions */}
      {isGameMode && !gameOver && (
        <div className="instructions">
          <p>Use ← → arrow keys to move</p>
          <p>Press ↑ or Space to jump</p>
        </div>
      )}
      
      {/* Game Controls - Removed movement buttons, kept main toggle */}
      <div className="controls-container">
        <button
          className="button button-red"
          onClick={toggleGameMode}
        >
          {isGameMode ? 'Stop Game' : 'Start Game'}
        </button>
  
        {/* Animation Controls (Only shown when not in game mode) */}
        {!isGameMode && (
          <>
            <div className="button-row">
              {['Walking', 'Running', 'Dance', 'Death'].map((state) => (
                <button
                  key={state}
                  className="button button-green"
                  onClick={() => fadeToAction(state)}
                >
                  {state}
                </button>
              ))}
            </div>
  
            <div className="button-row">
              <button
                className="button button-purple"
                onClick={() => {
                  fadeToAction('Jump');
                  setTimeout(() => {
                    fadeToAction('Walking');
                  }, 1000);
                }}
              >
                Jump
              </button>
            </div>
          </>
        )}
      </div>
  
      {/* High Score Display */}
      <div className="high-score">
        High Score: {Math.max(score, localStorage.getItem('highScore') || 0)}
      </div>
    </div>
  );
};

export default CharacterController;