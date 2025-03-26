import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ROAD_LENGTH = 140;
const ROAD_WIDTH = 40;

// Create ground plane that extends beyond the road
const createGround = (scene) => {
  const groundGeometry = new THREE.PlaneGeometry(100, 200);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x7CFC00, // Grass green
    side: THREE.DoubleSide,
    roughness: 0.9,
  });
  
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2; // Slightly below the road
  
  scene.add(ground);
  
  return { ground, groundGeometry, groundMaterial };
};

const InfiniteRoad = ({ scene, isGameMode }) => {
  const roadRef = useRef(null);
  const animationIdRef = useRef(null);
  
  // Create and add road to scene
  useEffect(() => {
    if (!scene) return;

    // Create ground first (will be below the road)
    const { ground, groundGeometry, groundMaterial } = createGround(scene);
    
    // Create road geometry and material
    const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    // Create road mesh
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.1, 0); // Slightly lower to avoid z-fighting
    
    // Add road to scene
    scene.add(road);
    roadRef.current = { 
      road, 
      roadGeometry, 
      roadMaterial,
      ground,
      groundGeometry,
      groundMaterial
    };

    // Add road stripes
    const stripeGeometry = new THREE.PlaneGeometry(0.5, 5);
    const stripeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    const stripes = [];
    const stripeCount = 10;
    const stripeSpacing = ROAD_LENGTH / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0, (i * stripeSpacing) - (ROAD_LENGTH / 2) + (stripeSpacing / 2));
      scene.add(stripe);
      stripes.push(stripe);
    }

    // Add road edges for better visual reference
    const edgeGeometry = new THREE.BoxGeometry(1, 0.5, ROAD_LENGTH);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
    });

    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    leftEdge.position.set(-(ROAD_WIDTH / 2) - 0.5, 0.25, 0);
    scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    rightEdge.position.set((ROAD_WIDTH / 2) + 0.5, 0.25, 0);
    scene.add(rightEdge);

    // Animation for stripes movement
    const animateStripes = () => {
      if (isGameMode) {
        stripes.forEach(stripe => {
          stripe.position.z -= 0.5;
          
          // Reset stripe position when it goes out of view
          if (stripe.position.z < -(ROAD_LENGTH / 2)) {
            stripe.position.z = (ROAD_LENGTH / 2);
          }
        });
      }

      animationIdRef.current = requestAnimationFrame(animateStripes);
    };

    animateStripes();

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      
      // Remove objects from scene and dispose resources
      if (roadRef.current) {
        // Remove and dispose road
        scene.remove(roadRef.current.road);
        roadRef.current.roadGeometry.dispose();
        roadRef.current.roadMaterial.dispose();
        
        // Remove and dispose ground
        scene.remove(roadRef.current.ground);
        roadRef.current.groundGeometry.dispose();
        roadRef.current.groundMaterial.dispose();
      }
      
      // Remove stripes
      stripes.forEach(stripe => {
        scene.remove(stripe);
        stripe.geometry.dispose();
        stripe.material.dispose();
      });
      
      // Remove edges
      scene.remove(leftEdge);
      scene.remove(rightEdge);
      edgeGeometry.dispose();
      edgeMaterial.dispose();
      stripeGeometry.dispose();
      stripeMaterial.dispose();
    };
  }, [scene]);

  return null;
};

export default InfiniteRoad;