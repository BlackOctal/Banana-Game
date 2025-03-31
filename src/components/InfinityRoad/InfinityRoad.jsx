import React, { useEffect } from 'react';
import * as THREE from 'three';

const ROAD_LENGTH = 110;

const InfinityRoad = ({ scene, isGameMode }) => {
  useEffect(() => {
    if (!scene) return;

    const roadGeometry = new THREE.PlaneGeometry(40, ROAD_LENGTH);
    
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
      name: 'roadMaterial' 
    });

    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.name = 'road'; 
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 0);
    
    scene.add(road);

    const edgeGeometry = new THREE.BoxGeometry(2, 1, ROAD_LENGTH);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.5,
      metalness: 0.2,
      name: 'edgeMaterial'
    });

    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    leftEdge.position.set(-20, 0.5, 0);
    leftEdge.name = 'leftEdge';
    scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    rightEdge.position.set(20, 0.5, 0);
    rightEdge.name = 'rightEdge';
    scene.add(rightEdge);

    return () => {
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