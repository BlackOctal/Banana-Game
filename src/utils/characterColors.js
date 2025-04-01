import * as THREE from 'three';

export const CHARACTER_COLORS = {
  yellow: {
    name: 'Yellow',
    scoreRequired: 0,  
    hexColor: 0xf8ff5a 
  },
  green: {
    name: 'Green',
    scoreRequired: 50, 
    hexColor: 0x4c9e6d 
  },
  blue: {
    name: 'Blue',
    scoreRequired: 100,
    hexColor: 0x5dade2 
  },
  red: {
    name: 'Red',
    scoreRequired: 150,
    hexColor: 0xf55c5c 
  }
};

export const COLOR_DB_MAPPING = {
  default: 'green',
  level1: 'yellow',
  level2: 'blue',
  level3: 'red'
};

export const DB_COLOR_MAPPING = {
  green: 'default',
  yellow: 'level1',
  blue: 'level2',
  red: 'level3'
};

export const applyColorToModel = (model, colorKey) => {
  if (!model) return;
  
  const actualColorKey = DB_COLOR_MAPPING[colorKey] || colorKey;
  
  const colorConfig = CHARACTER_COLORS[actualColorKey] || CHARACTER_COLORS.default;
  const colorHex = colorConfig.hexColor;
  
  model.traverse((object) => {
    if (object.isMesh && object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          if (material && material.color) {
            material.color.setHex(colorHex);
            
            if (material.emissive) {
              material.emissive.setHex(0x111111);
            }
          }
        });
      } else if (object.material && object.material.color) {
        object.material.color.setHex(colorHex);
        
        if (object.material.emissive) {
          object.material.emissive.setHex(0x111111);
        }
      }
    }
  });
};

export const getUnlockedColors = (score = 0) => {

  const unlockedColors = {
    green: true,  
    yellow: score >= 50,
    blue: score >= 100,
    red: score >= 150
  };
  
  return unlockedColors;
};

export const getAvailableColors = (unlockedColors = {}) => {
  return Object.entries(CHARACTER_COLORS).map(([id, { name, scoreRequired, hexColor }]) => ({
    id,
    name,
    scoreRequired,
    color: new THREE.Color(hexColor),
    unlocked: unlockedColors[COLOR_DB_MAPPING[id]] || id === 'default' 
  }));
};

export const getColorHexFromName = (colorName) => {
  const colorKey = DB_COLOR_MAPPING[colorName] || 'default';
  return CHARACTER_COLORS[colorKey].hexColor;
};