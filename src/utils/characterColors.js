// src/utils/characterColors.js
// COMPLETE REWRITE - SIMPLIFIED APPROACH

import * as THREE from 'three';

// Character color configurations - simple version
export const CHARACTER_COLORS = {
  yellow: {
    name: 'Yellow',
    scoreRequired: 0,
    hexColor: 0xffff00 // Standard yellow
  },
  green: {
    name: 'Green',
    scoreRequired: 50,
    hexColor: 0x00ff00 // Bright green
  },
  blue: {
    name: 'Blue',
    scoreRequired: 100,
    hexColor: 0x0088ff // Sky blue
  },
  red: {
    name: 'Red',
    scoreRequired: 150,
    hexColor: 0xff0000 // Bright red
  }
};

// Simplified color application that ONLY modifies character color without changing material properties
export const applyColorToModel = (model, colorName) => {
  if (!model) return null;
  
  // Default to yellow if invalid color
  const colorConfig = CHARACTER_COLORS[colorName] || CHARACTER_COLORS.yellow;
  const color = new THREE.Color(colorConfig.hexColor);
  
  // ONLY find and color the Robot body parts
  model.traverse((object) => {
    // Skip non-mesh objects
    if (!object.isMesh) return;
    
    // Check if this is part of the robot body
    // RobotExpressive.glb typically has parts named "Body" or similar
    const isBodyPart = object.name.includes('Body') || 
                      object.name.includes('Robot') ||
                      object.name.includes('HEAD') ||
                      object.name.includes('TORSO') ||
                      object.name.includes('ARM') ||
                      object.name.includes('LEG');
    
    if (isBodyPart) {
      // Simply set the color WITHOUT changing other material properties
      if (Array.isArray(object.material)) {
        // Handle multi-material objects
        object.material.forEach(mat => {
          if (mat) {
            // Only modify the color, preserve all other properties
            mat.color = color.clone();
          }
        });
      } else if (object.material) {
        // Handle single material objects
        object.material.color = color.clone();
      }
    }
  });
  
  return model;
};

// Get all available character colors
export const getAvailableColors = (unlockedCharacters) => {
  const colors = [
    { 
      id: 'yellow', 
      name: CHARACTER_COLORS.yellow.name,
      scoreRequired: CHARACTER_COLORS.yellow.scoreRequired,
      color: new THREE.Color(CHARACTER_COLORS.yellow.hexColor),
      unlocked: true 
    }
  ];
  
  // Add other colors based on unlocked status
  if (unlockedCharacters) {
    if (unlockedCharacters.green) {
      colors.push({ 
        id: 'green', 
        name: CHARACTER_COLORS.green.name,
        scoreRequired: CHARACTER_COLORS.green.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.green.hexColor),
        unlocked: true 
      });
    } else {
      colors.push({ 
        id: 'green', 
        name: CHARACTER_COLORS.green.name,
        scoreRequired: CHARACTER_COLORS.green.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.green.hexColor),
        unlocked: false 
      });
    }
    
    if (unlockedCharacters.blue) {
      colors.push({ 
        id: 'blue', 
        name: CHARACTER_COLORS.blue.name,
        scoreRequired: CHARACTER_COLORS.blue.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.blue.hexColor),
        unlocked: true 
      });
    } else {
      colors.push({ 
        id: 'blue', 
        name: CHARACTER_COLORS.blue.name,
        scoreRequired: CHARACTER_COLORS.blue.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.blue.hexColor),
        unlocked: false 
      });
    }
    
    if (unlockedCharacters.red) {
      colors.push({ 
        id: 'red', 
        name: CHARACTER_COLORS.red.name,
        scoreRequired: CHARACTER_COLORS.red.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.red.hexColor),
        unlocked: true 
      });
    } else {
      colors.push({ 
        id: 'red', 
        name: CHARACTER_COLORS.red.name,
        scoreRequired: CHARACTER_COLORS.red.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.red.hexColor),
        unlocked: false 
      });
    }
  } else {
    colors.push(
      { 
        id: 'green', 
        name: CHARACTER_COLORS.green.name,
        scoreRequired: CHARACTER_COLORS.green.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.green.hexColor),
        unlocked: false 
      },
      { 
        id: 'blue', 
        name: CHARACTER_COLORS.blue.name,
        scoreRequired: CHARACTER_COLORS.blue.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.blue.hexColor),
        unlocked: false 
      },
      { 
        id: 'red', 
        name: CHARACTER_COLORS.red.name,
        scoreRequired: CHARACTER_COLORS.red.scoreRequired,
        color: new THREE.Color(CHARACTER_COLORS.red.hexColor),
        unlocked: false 
      }
    );
  }
  
  return colors;
};