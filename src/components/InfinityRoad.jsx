// InfiniteRoad.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ROAD_LENGTH = 50;
const ROAD_SPEED = 0.5;

const InfiniteRoad = ({ scene, isGameMode }) => {
  const roadRefs = useRef([null, null]);

  useEffect(() => {
    if (!scene) return;

    // Create road materials and geometry
    const roadGeometry = new THREE.PlaneGeometry(20, ROAD_LENGTH);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    // Create two road segments
    const road1 = new THREE.Mesh(roadGeometry, roadMaterial);
    const road2 = new THREE.Mesh(roadGeometry, roadMaterial);
    
    road1.rotation.x = -Math.PI / 2;
    road2.rotation.x = -Math.PI / 2;
    
    road1.position.set(0, 0, 0);
    road2.position.set(0, 0, -ROAD_LENGTH);
    
    roadRefs.current = [road1, road2];
    scene.add(road1);
    scene.add(road2);

    // Cleanup function
    return () => {
      scene.remove(road1);
      scene.remove(road2);
      roadGeometry.dispose();
      roadMaterial.dispose();
    };
  }, [scene]);

  // Animation function for road movement
  useEffect(() => {
    if (!scene || !isGameMode) return;

    const animate = () => {
      if (!isGameMode) return;

      roadRefs.current.forEach(road => {
        road.position.z += ROAD_SPEED;
        if (road.position.z >= ROAD_LENGTH) {
          road.position.z = -ROAD_LENGTH;
        }
      });
    };

    // Add to animation loop
    const animationId = setInterval(animate, 16); // roughly 60fps

    return () => clearInterval(animationId);
  }, [scene, isGameMode]);

  return null; // This is a purely logical component
};

export default InfiniteRoad;