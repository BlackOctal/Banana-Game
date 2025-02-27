import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import './Obstacles.css';

const Obstacles = ({ scene, isGameMode, playerPosition, onCollision }) => {
  const [obstacles, setObstacles] = useState([]);
  const obstacleSpeed = 0.1; // Reduced speed from 0.2 to 0.1
  const spawnInterval = 3000; // Increased spawn interval from 2000 to 3000ms for more spacing
  
  // Initialize obstacles
  useEffect(() => {
    if (!scene || !isGameMode) return;
    
    const materials = {
      circle: new THREE.MeshPhongMaterial({ color: 0xff0000 }),
      square: new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    };
    
    const geometries = {
      circle: new THREE.CylinderGeometry(1, 1, 2, 32),
      square: new THREE.BoxGeometry(2, 2, 2)
    };
    
    // Function to create a new obstacle
    const createObstacle = () => {
      const type = Math.random() > 0.5 ? 'circle' : 'square';
      const geometry = geometries[type];
      const material = materials[type];
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Random x position between -8 and 8 (road width)
      mesh.position.x = Math.random() * 16 - 8;
      mesh.position.y = 1; // Height of obstacle
      mesh.position.z = 50; // Start from in front (positive Z) instead of behind
      
      scene.add(mesh);
      
      return {
        mesh,
        type,
        id: Date.now() + Math.random()
      };
    };
    
    // Spawn obstacles interval
    const spawnObstacle = setInterval(() => {
      if (!isGameMode) return;
      
      const newObstacle = createObstacle();
      setObstacles(prev => [...prev, newObstacle]);
    }, spawnInterval);
    
    // Cleanup
    return () => {
      clearInterval(spawnObstacle);
      obstacles.forEach(obstacle => {
        scene.remove(obstacle.mesh);
      });
      setObstacles([]);
    };
  }, [scene, isGameMode]);
  
  // Update obstacles position and check collisions
  useEffect(() => {
    if (!isGameMode) return;
    
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      setObstacles(prev => {
        const updatedObstacles = prev.filter(obstacle => {
          // Move obstacle toward the character (negative Z direction)
          obstacle.mesh.position.z -= obstacleSpeed;
          
          // Remove obstacle if it's passed the character
          if (obstacle.mesh.position.z < -20) {
            scene.remove(obstacle.mesh);
            return false;
          }
          
          // Check collision with player
          if (playerPosition) {
            const distance = new THREE.Vector3(
              playerPosition.x,
              playerPosition.y,
              playerPosition.z
            ).distanceTo(obstacle.mesh.position);
            
            if (distance < 2) {
              onCollision(obstacle);
              scene.remove(obstacle.mesh);
              return false;
            }
          }
          
          return true;
        });
        
        return updatedObstacles;
      });
    };
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isGameMode, scene, playerPosition, onCollision]);
  
  return null;
};

export default Obstacles;