import * as THREE from 'three';

// Character color configurations
export const CHARACTER_COLORS = {
  yellow: {
    name: 'Yellow',
    scoreRequired: 0,
    color: new THREE.Color(0xffff00), // Standard yellow
    materialParams: {
      color: 0xffff00,
      emissive: 0x111111,
      metalness: 0.2,
      roughness: 0.5
    }
  },
  green: {
    name: 'Green',
    scoreRequired: 50,
    color: new THREE.Color(0x00ff00), // Bright green
    materialParams: {
      color: 0x00ff00,
      emissive: 0x111111,
      metalness: 0.3,
      roughness: 0.4
    }
  },
  blue: {
    name: 'Blue',
    scoreRequired: 100,
    color: new THREE.Color(0x0088ff), // Sky blue
    materialParams: {
      color: 0x0088ff,
      emissive: 0x111111,
      metalness: 0.4,
      roughness: 0.3
    }
  },
  red: {
    name: 'Red',
    scoreRequired: 150,
    color: new THREE.Color(0xff0000), // Bright red
    materialParams: {
      color: 0xff0000,
      emissive: 0x111111,
      metalness: 0.5,
      roughness: 0.2
    }
  }
};

// Apply color to model
export const applyColorToModel = (model, colorName) => {
  if (!model || !CHARACTER_COLORS[colorName]) {
    return;
  }

  const colorConfig = CHARACTER_COLORS[colorName];
  
  // Traverse through all meshes in the model
  model.traverse((object) => {
    if (object.isMesh && object.material) {
      // Handle both single materials and material arrays
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          if (material.isMeshStandardMaterial || material.isMeshPhongMaterial) {
            // Clone the material to avoid affecting other instances
            const newMaterial = material.clone();
            Object.assign(newMaterial, colorConfig.materialParams);
            return newMaterial;
          }
        });
      } else if (object.material.isMeshStandardMaterial || object.material.isMeshPhongMaterial) {
        // Clone the material to avoid affecting other instances
        const newMaterial = object.material.clone();
        Object.assign(newMaterial, colorConfig.materialParams);
        object.material = newMaterial;
      }
    }
  });

  return model;
};

// Get all available character colors
export const getAvailableColors = (unlockedCharacters) => {
  const colors = [
    { id: 'yellow', ...CHARACTER_COLORS.yellow, unlocked: true }
  ];
  
  // Add other colors based on unlocked status
  if (unlockedCharacters) {
    if (unlockedCharacters.green) {
      colors.push({ id: 'green', ...CHARACTER_COLORS.green, unlocked: true });
    } else {
      colors.push({ id: 'green', ...CHARACTER_COLORS.green, unlocked: false });
    }
    
    if (unlockedCharacters.blue) {
      colors.push({ id: 'blue', ...CHARACTER_COLORS.blue, unlocked: true });
    } else {
      colors.push({ id: 'blue', ...CHARACTER_COLORS.blue, unlocked: false });
    }
    
    if (unlockedCharacters.red) {
      colors.push({ id: 'red', ...CHARACTER_COLORS.red, unlocked: true });
    } else {
      colors.push({ id: 'red', ...CHARACTER_COLORS.red, unlocked: false });
    }
  } else {
    colors.push(
      { id: 'green', ...CHARACTER_COLORS.green, unlocked: false },
      { id: 'blue', ...CHARACTER_COLORS.blue, unlocked: false },
      { id: 'red', ...CHARACTER_COLORS.red, unlocked: false }
    );
  }
  
  return colors;
};