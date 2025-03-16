import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import './Obstacles.css';

const Obstacles = ({ scene, isGameMode, playerPosition, onCollision }) => {
  const [obstacles, setObstacles] = useState([]);
  const obstacleSpeed = 0.03; 
  const spawnInterval = 5000; 

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
    
    // obstacle create part
    const createObstacle = () => {
      const type = Math.random() > 0.5 ? 'circle' : 'square';
      const geometry = geometries[type];
      const material = materials[type];
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // random obstacles positions
      mesh.position.x = Math.random() * 16 - 8;
      mesh.position.y = 1; 
      mesh.position.z = 80; 
      scene.add(mesh);
      
      return {
        mesh,
        type,
        id: Date.now() + Math.random()
      };
    };
    
    const spawnObstacle = setInterval(() => {
      if (!isGameMode) return;
      
      const newObstacle = createObstacle();
      setObstacles(prev => [...prev, newObstacle]);
    }, spawnInterval);
    
    return () => {
      clearInterval(spawnObstacle);
      obstacles.forEach(obstacle => {
        scene.remove(obstacle.mesh);
      });
      setObstacles([]);
    };
  }, [scene, isGameMode]);
  
  useEffect(() => {
    if (!isGameMode) return;
    
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      setObstacles(prev => {
        const updatedObstacles = prev.filter(obstacle => {
          obstacle.mesh.position.z -= obstacleSpeed;
          
          // Remove obstacle when character pass it
          if (obstacle.mesh.position.z < -20) {
            scene.remove(obstacle.mesh);
            return false;
          }
          
          if (playerPosition) {
            const distance = new THREE.Vector3(
              playerPosition.x,
              playerPosition.y,
              playerPosition.z
            ).distanceTo(obstacle.mesh.position);
            
            if (distance < 4) {
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