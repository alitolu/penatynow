import * as THREE from 'three';

export const SCENE_DIMENSIONS = {
  // Saha boyutları
  FIELD_WIDTH: 40,        // Daha gerçekçi bir genişlik
  FIELD_LENGTH: 60,       // Daha gerçekçi bir uzunluk
  FIELD_CENTER_Z: -10,    // Sahanın merkez noktası

  // Kale boyutları (FIFA standartları)
  GOAL_WIDTH: 7.32,       // FIFA standart kale genişliği
  GOAL_HEIGHT: 2.44,      // FIFA standart kale yüksekliği
  GOAL_DEPTH: 2,          // Kale derinliği
  GOAL_POSITION_Z: -20,   // Kalenin Z pozisyonu
  
  // Top özellikleri
  BALL_RADIUS: 0.11,      // FIFA standart top yarıçapı (22cm çap) - yarı boyutta
  BALL_START_HEIGHT: 0.2, // Başlangıç yüksekliği (yerden)
  BALL_START_Z: -1,       // Başlangıç Z pozisyonu
  
  // Kaleci boyutları ve pozisyonu
  GOALKEEPER_WIDTH: 1.4,   // Kaleci genişliği
  GOALKEEPER_HEIGHT: 1.5,  // Kaleci yüksekliği
  GOALKEEPER_DEPTH: 2,   // Kaleci derinliği
  GOALKEEPER_START_Z: -18, // Kaleci başlangıç Z pozisyonu
  
  // Penaltı noktası
  PENALTY_SPOT_Z: -1,     // Penaltı noktası Z pozisyonu
  PENALTY_SPOT_X: 0,     // Penaltı noktası X pozisyonu

  // Hareket sınırları
  GOALKEEPER_MOVE_RANGE_X: 3.5,  // Kalecinin yatayda hareket sınırı
  GOALKEEPER_MOVE_RANGE_Y: 1.8,  // Kalecinin dikeyde hareket sınırı
  
  // Çarpışma ve gol tespiti için toleranslar
  GOAL_DETECTION_TOLERANCE: 0.1,
  COLLISION_TOLERANCE: 0.1
};
export const GAME_PHYSICS = {
  GRAVITY: 9.81,
  MAX_SHOT_POWER: 25,
  MIN_SHOT_POWER: 5,
  BALL_MASS: 0.45,       // FIFA standart top kütlesi (kg)
  AIR_DENSITY: 1.225,    // Hava yoğunluğu (kg/m³)
  DRAG_COEFFICIENT: 0.47, // Top için sürüklenme katsayısı
};
// Kale çerçevesi için köşe noktaları
export const GOAL_FRAME = {
  topLeft: new THREE.Vector3(-SCENE_DIMENSIONS.GOAL_WIDTH/2, SCENE_DIMENSIONS.GOAL_HEIGHT, SCENE_DIMENSIONS.GOAL_POSITION_Z),
  topRight: new THREE.Vector3(SCENE_DIMENSIONS.GOAL_WIDTH/2, SCENE_DIMENSIONS.GOAL_HEIGHT, SCENE_DIMENSIONS.GOAL_POSITION_Z),
  bottomLeft: new THREE.Vector3(-SCENE_DIMENSIONS.GOAL_WIDTH/2, 0, SCENE_DIMENSIONS.GOAL_POSITION_Z),
  bottomRight: new THREE.Vector3(SCENE_DIMENSIONS.GOAL_WIDTH/2, 0, SCENE_DIMENSIONS.GOAL_POSITION_Z)
};
// Çarpışma algılama için yardımcı fonksiyonlar
export const isInGoal = (ballPosition: THREE.Vector3): boolean => {
  return (
    ballPosition.x >= -SCENE_DIMENSIONS.GOAL_WIDTH/2 &&
    ballPosition.x <= SCENE_DIMENSIONS.GOAL_WIDTH/2 &&
    ballPosition.y <= SCENE_DIMENSIONS.GOAL_HEIGHT &&
    ballPosition.y >= 0 &&
    ballPosition.z <= SCENE_DIMENSIONS.GOAL_POSITION_Z &&
    ballPosition.z >= SCENE_DIMENSIONS.GOAL_POSITION_Z - SCENE_DIMENSIONS.GOAL_DEPTH
  );
};
// Top ve kaleci arasındaki çarpışma kontrolü
export const isCollisionWithGoalkeeper = (
  ballPosition: THREE.Vector3,
  goalkeeperPosition: THREE.Vector3
): boolean => {
  const xDiff = Math.abs(ballPosition.x - goalkeeperPosition.x);
  const yDiff = Math.abs(ballPosition.y - goalkeeperPosition.y);
  const zDiff = Math.abs(ballPosition.z - goalkeeperPosition.z);

  return (
    xDiff < (SCENE_DIMENSIONS.GOALKEEPER_WIDTH/2 + SCENE_DIMENSIONS.BALL_RADIUS) &&
    yDiff < (SCENE_DIMENSIONS.GOALKEEPER_HEIGHT/2 + SCENE_DIMENSIONS.BALL_RADIUS) &&
    zDiff < (SCENE_DIMENSIONS.GOALKEEPER_WIDTH/2 + SCENE_DIMENSIONS.BALL_RADIUS)
  );
};
// Gerçekçi fizik hesaplamaları için yardımcı fonksiyonlar
export const calculateDragForce = (velocity: THREE.Vector3): THREE.Vector3 => {
  const speed = velocity.length();
  const dragMagnitude = 
    0.5 * 
    GAME_PHYSICS.AIR_DENSITY * 
    GAME_PHYSICS.DRAG_COEFFICIENT * 
    Math.PI * 
    Math.pow(SCENE_DIMENSIONS.BALL_RADIUS, 2) * 
    speed * speed;

  return velocity.clone().normalize().multiplyScalar(-dragMagnitude);
};
// Oyun ayarları
export const GAME_SETTINGS = {
  SHOT: {
    POWER_INCREASE_RATE: 2,      // Güç artış hızı (saniyede)
    POWER_INCREASE_INTERVAL: 50,  // Güç artış aralığı (ms)
    MAX_POWER: 100,              // Maksimum şut gücü
    MIN_POWER: 0,                // Minimum şut gücü
    DEFAULT_POWER: 50,           // Varsayılan şut gücü
    RESET_DELAY: 3000            // Şut sonrası reset süresi (ms)
  },
  GOALKEEPER: {
    DEFAULT_REACTION_TIME: 700,  // Kaleci tepki süresi (ms)
    DEFAULT_DIFFICULTY: 'medium' as const,
    POSITION: {
      X: 0,
      Y: 0,
      Z: -18
    }
  },
  CAMERA: {
    DEFAULT: {
      DISTANCE: 6,
      HEIGHT: 5,
      ANGLE: -20,
      POS_X: 0,
      POS_Y: 5,
      POS_Z: 7,
      ROT_X: -15,
      ROT_Y: 0,
      ROT_Z: 0,
      FOV: 45,
      ZOOM: 1,
      PERSPECTIVE: 'default' as const
    }
  },
  LIGHTING: {
    AMBIENT_INTENSITY: 0.5,
    DIRECTIONAL_LIGHT: {
      POSITION: new THREE.Vector3(-10, 10, 5),
      INTENSITY: 1
    },
    SPOT_LIGHT: {
      POSITION: new THREE.Vector3(0, 15, 0),
      ANGLE: 0.3,
      PENUMBRA: 1,
      INTENSITY: 0.8
    }
  }
};
// Oyun durumları
export const GAME_STATES = {
  IDLE: 'idle',
  SHOOTING: 'shooting',
  GOAL: 'goal',
  SAVE: 'save'
} as const;
// Zorluk seviyeleri
export const DIFFICULTY_LEVELS = {
  EASY: 'easy' as const,
  MEDIUM: 'medium' as const,
  HARD: 'hard' as const
} as const;
// Zorluk seviyeleri için tür tanımı
export type Difficulty = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];
// Skor tipi
export interface Score {
  player: number;
  goalkeeper: number;
}
// Oyun ayarları için sabitler
export const CONFIG_SETTINGS = {
  GRAPHICS_QUALITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  } as const,
  SOUND: {
    MIN: 0,
    MAX: 100,
    DEFAULT: 50
  },
  CONTROL: {
    MIN_SENSITIVITY: 0,
    MAX_SENSITIVITY: 100,
    DEFAULT_SENSITIVITY: 50
  }
} as const;
// UI Sabitleri
export const UI_SETTINGS = {
  MENU: {
    ANIMATION_DURATION: 0.3,
    BACKDROP_BLUR: '10px',
    BACKGROUND_OPACITY: 0.7
  },
  NOTIFICATIONS: {
    DEFAULT_DURATION: 3000,
    POSITION: {
      BOTTOM: 20,
      RIGHT: 20
    }
  }
} as const;
// Oyun durumları için tip tanımları
export type GameState = 'menu' | 'game' | 'settings' | 'paused';
export type GraphicsQuality = typeof CONFIG_SETTINGS.GRAPHICS_QUALITY[keyof typeof CONFIG_SETTINGS.GRAPHICS_QUALITY];
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
// Varsayılan ayarlar
export const DEFAULT_GAME_CONFIG = {
  difficulty: DIFFICULTY_LEVELS.MEDIUM,
  soundVolume: CONFIG_SETTINGS.SOUND.DEFAULT,
  graphicsQuality: CONFIG_SETTINGS.GRAPHICS_QUALITY.MEDIUM,
  controlSensitivity: CONFIG_SETTINGS.CONTROL.DEFAULT_SENSITIVITY
} as const;
// Menü sabitleri
export const MENU_SETTINGS = {
  DIFFICULTIES: [
    {
      level: DIFFICULTY_LEVELS.EASY,
      label: 'Kolay Mod',
      description: 'Başlangıç seviyesi',
      color: '#2ecc71',
      icon: '⚽️'
    },
    {
      level: DIFFICULTY_LEVELS.MEDIUM,
      label: 'Orta Mod',
      description: 'Dengeli zorluk',
      color: '#3498db',
      icon: '🥅'
    },
    {
      level: DIFFICULTY_LEVELS.HARD,
      label: 'Zor Mod',
      description: 'Profesyonel seviye',
      color: '#e74c3c',
      icon: '🏆'
    }
  ],
  ANIMATIONS: {
    BUTTON: {
      INITIAL: { opacity: 0, y: 50, scale: 0.8 },
      ANIMATE: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 10
        }
      },
      HOVER: { scale: 1.05 },
      TAP: { scale: 0.95 }
    }
  }
} as const;
// Kamera ayarları için sabitler
export const CAMERA_CONFIG = {
  DEFAULT: {
    DISTANCE: 6,
    HEIGHT: 5,
    ANGLE: -20,
    POS_X: 0,
    POS_Y: 5,
    POS_Z: 7,
    ROT_X: -15,
    ROT_Y: 0,
    ROT_Z: 0,
    FOV: 45,
    ZOOM: 1
  },
  PERSPECTIVES: {
    CLOSE: {
      DISTANCE: 4,
      HEIGHT: 3,
      ANGLE: -15,
      FOV: 60,
      ZOOM: 1.2,
      TRANSITION_SPEED: 0.5,  // Kamera geçiş hızı
      FOLLOW_BALL: true,       // Topun hareketini takip etme
      SHAKE_INTENSITY: 0.1     // Dinamik kamera sarsıntısı
    },
    WIDE: {
      DISTANCE: 8,
      HEIGHT: 6,
      ANGLE: -25,
      FOV: 90,
      ZOOM: 0.8,
      TRANSITION_SPEED: 0.3,  // Kamera geçiş hızı
      FOLLOW_BALL: false,      // Topun hareketini takip etmeme
      SHAKE_INTENSITY: 0.05    // Dinamik kamera sarsıntısı
    }
  },
  CONTROLS: {
    SLIDERS: {
      DISTANCE: { MIN: 1, MAX: 10, STEP: 0.1 },
      HEIGHT: { MIN: 1, MAX: 10, STEP: 0.1 },
      ANGLE: { MIN: -45, MAX: 45, STEP: 1 },
      FOV: { MIN: 30, MAX: 120, STEP: 1 }
    },
    DYNAMIC_LIMITS: {
      BALL_TRACKING: {
        MAX_DISTANCE: 15,    // Top takibi için maksimum mesafe
        MIN_DISTANCE: 2,     // Top takibi için minimum mesafe
        SMOOTHING_FACTOR: 0.2 // Kamera yumuşatma faktörü
      },
      FIELD_OF_VIEW: {
        DYNAMIC_ADJUSTMENT: true,  // Alan görüş açısının dinamik ayarı
        ADJUSTMENT_SPEED: 0.1      // Görüş açısı ayarlama hızı
      }
    }
  },
  EFFECTS: {
    MOTION_BLUR: {
      ENABLED: true,
      INTENSITY: 0.3
    },
    DEPTH_OF_FIELD: {
      ENABLED: true,
      FOCUS_DISTANCE: 6,
      APERTURE: 0.1
    }
  }
} as const;
export type CameraPerspective = 'default' | 'close' | 'wide';
export const GOALKEEPER_SETTINGS = {
  AI: {
    DIFFICULTY: {
      EASY: {
        REACTION_TIME: 0.5,
        PREDICTION_ACCURACY: 0.4,
        MOVEMENT_SPEED: 1.5,
        DIVE_RANGE: 1.5,
        ANTICIPATION_FACTOR: 0.3
      },
      MEDIUM: {
        REACTION_TIME: 0.3,
        PREDICTION_ACCURACY: 0.7,
        MOVEMENT_SPEED: 2,
        DIVE_RANGE: 2,
        ANTICIPATION_FACTOR: 0.5
      },
      HARD: {
        REACTION_TIME: 0.2,
        PREDICTION_ACCURACY: 0.9,
        MOVEMENT_SPEED: 3,
        DIVE_RANGE: 2.5,
        ANTICIPATION_FACTOR: 0.7
      }
    },
    ANIMATION: {
      STATES: {
        IDLE: 'idle',
        DIVING: 'diving',
        SAVING: 'saving',
        RECOVERING: 'recovering'
      },
      DIRECTIONS: {
        LEFT: 'left',
        RIGHT: 'right',
        CENTER: 'center',
        LEFT_UP: 'leftUp',
        RIGHT_UP: 'rightUp'
      }
    },
    TRAJECTORY: {
      MAX_POINTS: 10,  // Yörünge tahmininde kullanılacak maksimum nokta sayısı
      UPDATE_INTERVAL: 16  // Yörünge güncelleme aralığı (ms)
    }
  },
  MOVEMENT: {
    LERP_FACTOR: 0.1,  // Pozisyon yumuşatma faktörü
    SAVE_DISTANCE: 1.5, // Kurtarış mesafesi
    MIN_SAVE_INTERVAL: 500  // İki kurtarış arası minimum süre (ms)
  },
  STATS: {
    INITIAL: {
      TOTAL_SHOTS: 0,
      GOALS_SCORED: 0,
      SAVES: 0
    }
  }
} as const;
// Kaleci durum tipleri
export type GoalkeeperState = typeof GOALKEEPER_SETTINGS.AI.ANIMATION.STATES[keyof typeof GOALKEEPER_SETTINGS.AI.ANIMATION.STATES];
export type DiveDirection = typeof GOALKEEPER_SETTINGS.AI.ANIMATION.DIRECTIONS[keyof typeof GOALKEEPER_SETTINGS.AI.ANIMATION.DIRECTIONS]; 