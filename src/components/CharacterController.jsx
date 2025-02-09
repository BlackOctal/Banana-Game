import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0xe0e0e0);
    newScene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

    // Camera setup
    const newCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);
    newCamera.position.set(-5, 3, 10);
    newCamera.lookAt(0, 2, 0);

    // Renderer setup
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

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    );
    ground.rotation.x = -Math.PI / 2;
    newScene.add(ground);

    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    newScene.add(grid);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    // Load model
    const loader = new GLTFLoader();
    loader.load('models/gltf/RobotExpressive/RobotExpressive.glb', (gltf) => {
      const newModel = gltf.scene;
      newScene.add(newModel);
      setModel(newModel);
      // Store initial position
      initialPosition.current.copy(newModel.position);

      // Setup animations
      const newMixer = new THREE.AnimationMixer(newModel);
      const newActions = {};
      
      gltf.animations.forEach((clip) => {
        const action = newMixer.clipAction(clip);
        newActions[clip.name] = action;
        
        if (['Jump', 'Death'].includes(clip.name)) {
          action.clampWhenFinished = true;
          action.loop = THREE.LoopOnce;
        }
      });

      setMixer(newMixer);
      setActions(newActions);
      setActiveAction(newActions['Walking']);
      newActions['Walking'].play();
    });

    return () => {
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Animation loop with camera follow
  useEffect(() => {
    if (!renderer || !scene || !camera || !mixer || !model) return;

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixer.update(delta);

      if (isGameMode) {
        // Update camera position to follow character
        const idealOffset = new THREE.Vector3(0, 5, -15);
        const idealLookat = new THREE.Vector3(0, 2, 10);

        // Transform ideal offset to world space
        const modelPosition = model.position.clone();
        const currentOffset = idealOffset.clone();
        currentOffset.applyMatrix4(model.matrix);
        
        // Update camera position and target
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
    const moveDistance = 0.5;
    
    if (direction === 'left') {
      model.position.x -= moveDistance;
      if (isGameMode) {
        model.position.z += moveDistance * 0.3; // Slight diagonal movement
      }
    } else if (direction === 'right') {
      model.position.x += moveDistance;
      if (isGameMode) {
        model.position.z += moveDistance * 0.3; // Slight diagonal movement
      }
    }
  };

  // Handle jump in game mode
  const handleGameJump = () => {
    if (!isGameMode || !actions['Jump']) return;
    
    const jumpAction = actions['Jump'];
    const runningAction = actions['Running'];
    
    // Play jump animation
    jumpAction.reset().play();
    
    // After jump animation completes, return to running
    setTimeout(() => {
      jumpAction.stop();
      runningAction.play();
    }, 1000); // Adjust timing based on your jump animation length
  };

  // Handle game mode toggle
  const toggleGameMode = () => {
    setIsGameMode(!isGameMode);
    if (!isGameMode) {
      // Start game mode
      fadeToAction('Running');
      // Reset camera position behind character
      if (camera && model) {
        camera.position.set(model.position.x, model.position.y + 3, model.position.z - 5);
        camera.lookAt(model.position.x, model.position.y + 2, model.position.z + 10);
      }
    } else {
      // End game mode
      fadeToAction('Walking');
      // Reset character and camera to original position
      if (model) {
        model.position.copy(initialPosition.current);
        model.rotation.set(0, 0, 0);
      }
      if (camera) {
        camera.position.set(-5, 3, 10);
        camera.lookAt(0, 2, 0);
      }
    }
  };

  return (
    <div className="w-full h-screen relative">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Control buttons */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col gap-4">
        {/* Game mode toggle button */}
        <button
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold"
          onClick={toggleGameMode}
        >
          {isGameMode ? 'Stop Game' : 'Play Game'}
        </button>

        {/* Movement and jump buttons */}
        <div className="flex justify-center gap-4">
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => moveCharacter('left')}
          >
            Left
          </button>
          {isGameMode && (
            <button
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              onClick={handleGameJump}
            >
              Jump
            </button>
          )}
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => moveCharacter('right')}
          >
            Right
          </button>
        </div>

        {/* Only show state buttons when not in game mode */}
        {!isGameMode && (
          <>
            <div className="flex justify-center gap-2">
              {['Walking', 'Running', 'Dance', 'Death'].map((state) => (
                <button
                  key={state}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  onClick={() => fadeToAction(state)}
                >
                  {state}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
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
    </div>
  );
};

export default CharacterController;