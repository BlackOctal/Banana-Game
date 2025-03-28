import React, { useEffect } from 'react';
import * as THREE from 'three';

const ROAD_LENGTH = 110;

const InfinityRoad = ({ scene, isGameMode }) => {
  useEffect(() => {
    if (!scene) return;

    // Create road geometry
    const roadGeometry = new THREE.PlaneGeometry(40, ROAD_LENGTH);
    
    // Use a material that won't be affected by the character color change
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
      name: 'roadMaterial' // Add a name to identify it
    });

    // Create the road mesh
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.name = 'road'; // Name it for easier identification
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 0);
    
    // Add the road to the scene
    scene.add(road);

    // Add road edges for better visibility
    const edgeGeometry = new THREE.BoxGeometry(2, 1, ROAD_LENGTH);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.5,
      metalness: 0.2,
      name: 'edgeMaterial'
    });

    // Left edge
    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    leftEdge.position.set(-20, 0.5, 0);
    leftEdge.name = 'leftEdge';
    scene.add(leftEdge);

    // Right edge
    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    rightEdge.position.set(20, 0.5, 0);
    rightEdge.name = 'rightEdge';
    scene.add(rightEdge);

    return () => {
      // Clean up when component unmounts
      scene.remove(road);
      scene.remove(leftEdge);
      scene.remove(rightEdge);
      roadGeometry.dispose();
      roadMaterial.dispose();
      edgeGeometry.dispose();
      edgeMaterial.dispose();
    };
  }, [scene]);

  return null;
};

export default InfinityRoad;