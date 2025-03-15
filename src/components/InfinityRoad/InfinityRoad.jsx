import React, { useEffect } from 'react';
import * as THREE from 'three';

const ROAD_LENGTH = 110;

const FixedRoad = ({ scene }) => {
  useEffect(() => {
    if (!scene) return;

    // Create single road with fixed length
    const roadGeometry = new THREE.PlaneGeometry(40, ROAD_LENGTH);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    // Create single road segment
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 0);
    
    scene.add(road);

    // Cleanup function
    return () => {
      scene.remove(road);
      roadGeometry.dispose();
      roadMaterial.dispose();
    };
  }, [scene]);

  return null;
};

export default FixedRoad;