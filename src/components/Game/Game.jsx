import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './Game.css';

const Game = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  
  const sceneRef = useRef(null);
  const characterRef = useRef(null);
  const mixerRef = useRef(null);
  const animationsRef = useRef(null);
  const obstaclesRef = useRef([]);
  const scoreTimerRef = useRef(null);
  
  // Get current user from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      setHighScore(user.highScore || 0);
    }
  }, []);
  
  // Update high score and save to localStorage
  useEffect(() => {
    if (currentUser && score > highScore) {
      setHighScore(score);
      
      // Update user's high score in localStorage
      const updatedUser = { ...currentUser, highScore: score };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Also update the users array
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const updatedUsers = users.map(user => {
        if (user.username === currentUser.username) {
          return { ...user, highScore: score };
        }
        return user;
      });
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
  }, [score, highScore, currentUser]);
  
  // Initialize the scene, character, and game elements
  useEffect(() => {
    let scene, camera, renderer, controls;
    
    const init = () => {
      // Create scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87ceeb); // Sky blue
      
      // Create camera
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 2, 5);
      
      // Create renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      
      // Add renderer to DOM
      const container = sceneRef.current;
      if (container.children.length > 0) {
        container.removeChild(container.children[0]);
      }
      container.appendChild(renderer.domElement);
      
      // Create controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      
      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      // Create ground
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x91e396,
        side: THREE.DoubleSide
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1;
      ground.receiveShadow = true;
      scene.add(ground);
      
      // Load character model
      const loader = new GLTFLoader();
      loader.load('/models/character.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
          }
        });
        
        model.position.set(0, 0, 0);
        model.scale.set(0.5, 0.5, 0.5);
        scene.add(model);
        
        characterRef.current = model;
        
        // Set up animations
        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;
        
        const animations = {};
        gltf.animations.forEach((clip) => {
          animations[clip.name] = mixer.clipAction(clip);
        });
        
        animationsRef.current = animations;
        
        // Default to idle animation
        if (animations.Idle) {
          animations.Idle.play();
        }
      });
      
      sceneRef.current.scene = scene;
      sceneRef.current.camera = camera;
      sceneRef.current.renderer = renderer;
      
      // Handle window resize
      window.addEventListener('resize', onWindowResize);
      
      // Animation loop
      animate();
    };
    
    const onWindowResize = () => {
      const camera = sceneRef.current.camera;
      const renderer = sceneRef.current.renderer;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (mixerRef.current) {
        mixerRef.current.update(0.016); // Update animations
      }
      
      if (gameStarted && characterRef.current && !isDead) {
        // Move character forward
        characterRef.current.position.z -= 0.1;
        
        // Update camera position to follow character
        sceneRef.current.camera.position.z = characterRef.current.position.z + 5;
        
        // Check for collisions with obstacles
        checkCollisions();
        
        // Randomly generate obstacles
        if (Math.random() < 0.01) {
          createObstacle();
        }
      }
      
      // Render scene
      sceneRef.current.renderer.render(
        sceneRef.current.scene,
        sceneRef.current.camera
      );
    };
    
    const createObstacle = () => {
      const scene = sceneRef.current.scene;
      
      // Create obstacle geometry
      const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.ConeGeometry(0.5, 1, 32)
      ];
      
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshStandardMaterial({
        color: 0xff0000
      });
      
      const obstacle = new THREE.Mesh(geometry, material);
      
      // Position obstacle ahead of character
      const z = characterRef.current.position.z - 20 - Math.random() * 10;
      const x = Math.random() * 4 - 2; // Random x position between -2 and 2
      
      obstacle.position.set(x, 0, z);
      obstacle.castShadow = true;
      
      scene.add(obstacle);
      obstaclesRef.current.push(obstacle);
      
      // Remove obstacles that are too far behind
      obstaclesRef.current = obstaclesRef.current.filter((obs) => {
        if (obs.position.z > characterRef.current.position.z + 10) {
          scene.remove(obs);
          return false;
        }
        return true;
      });
    };
    
    const checkCollisions = () => {
      if (!characterRef.current || isDead) return;
      
      const characterPos = characterRef.current.position;
      const collisionThreshold = 0.75; // Adjust as needed
      
      for (const obstacle of obstaclesRef.current) {
        const obstaclePos = obstacle.position;
        
        const distance = Math.sqrt(
          Math.pow(characterPos.x - obstaclePos.x, 2) +
          Math.pow(characterPos.z - obstaclePos.z, 2)
        );
        
        if (distance < collisionThreshold) {
          handleDeath();
          break;
        }
      }
    };
    
    init();
    
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (scoreTimerRef.current) {
        clearInterval(scoreTimerRef.current);
      }
    };
  }, [gameStarted, isDead]);
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setIsDead(false);
    setScore(0);
    
    // Reset character position
    if (characterRef.current) {
      characterRef.current.position.set(0, 0, 0);
    }
    
    // Clear obstacles
    if (sceneRef.current && sceneRef.current.scene) {
      obstaclesRef.current.forEach((obstacle) => {
        sceneRef.current.scene.remove(obstacle);
      });
      obstaclesRef.current = [];
    }
    
    // Change to running animation
    if (animationsRef.current) {
      Object.values(animationsRef.current).forEach((action) => {
        action.stop();
      });
      
      if (animationsRef.current.Running) {
        animationsRef.current.Running.play();
      }
    }
    
    // Start score timer
    if (scoreTimerRef.current) {
      clearInterval(scoreTimerRef.current);
    }
    
    scoreTimerRef.current = setInterval(() => {
      setScore((prevScore) => prevScore + 1);
    }, 500);
  };
  
  // Handle character death
  const handleDeath = () => {
    setIsDead(true);
    
    if (scoreTimerRef.current) {
      clearInterval(scoreTimerRef.current);
    }
    
    // Change to death animation
    if (animationsRef.current) {
      Object.values(animationsRef.current).forEach((action) => {
        action.stop();
      });
      
      if (animationsRef.current.Death) {
        animationsRef.current.Death.play();
      }
    }
  };
  
  return (
    <div className="game-container">
      {!gameStarted && (
        <div className="game-overlay">
          <h1>Banana Runner</h1>
          <button className="start-game-btn" onClick={startGame}>
            Start Game
          </button>
          <Link to="/" className="back-home-btn">
            Back to Home
          </Link>
        </div>
      )}
      
      {isDead && (
        <div className="game-overlay">
          <h1>Game Over!</h1>
          <p>Your score: {score}</p>
          <button className="start-game-btn" onClick={startGame}>
            Play Again
          </button>
          <Link to="/" className="back-home-btn">
            Back to Home
          </Link>
        </div>
      )}
      
      <div className="user-info">
        {currentUser ? (
          <>
            <span className="username">{currentUser.username}</span>
            <span className="score">Score: {score}</span>
            <span className="high-score">High Score: {highScore}</span>
          </>
        ) : (
          <Link to="/login" className="login-prompt">
            Login to save your score
          </Link>
        )}
      </div>
      
      <div className="scene-container" ref={sceneRef}></div>
    </div>
  );
};

export default Game;