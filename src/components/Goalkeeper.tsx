import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { 
  SCENE_DIMENSIONS, 
  isCollisionWithGoalkeeper, 
  GAME_SETTINGS,
  GOALKEEPER_SETTINGS,
  type GoalkeeperState,
  type DiveDirection
} from '../constants/gameConstants';

type Difficulty = 'easy' | 'medium' | 'hard';
interface GoalkeeperProps {
  ballPosition: THREE.Vector3;
  difficulty?: Difficulty;
  reactionTime?: number;
  onGoal?: () => void;
  onSave?: () => void;
  className?: string;  // Yeni prop
  ballRef: React.RefObject<THREE.Group>;
}
type ShotResult = 'goal' | 'save';
type ShotRecord = {
  position: THREE.Vector3;
  power: number;
  result: ShotResult;
};
type AIMemoryState = {
  shotHistory: ShotRecord[];
  learningRate: number;
  predictionAccuracy: number;
};
const safeStringParam = <T extends string>(
  param: T | undefined, 
  defaultValue: T
): T => {
  return param ?? defaultValue;
};
const normalizeDifficulty = (difficulty?: Difficulty | string): Difficulty => {
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  
  if (!difficulty) return 'medium';
  
  const normalizedDifficulty = (
    typeof difficulty === 'string' 
      ? difficulty.toLowerCase() 
      : difficulty
  ) as Difficulty;
  
  return validDifficulties.includes(normalizedDifficulty) 
    ? normalizedDifficulty 
    : 'medium';
};
const performanceFunctions = (() => {
  const predictionCache = new Map<string, THREE.Vector3>();
  const saveProbabilityCache = new Map<string, number>();

  const PHYSICS_CONSTANTS = {
    GRAVITY: 9.81,           // Yerçekimi ivmesi
    BALL_FRICTION: 0.1,      // Top Sürtünme Katsayısı
    BALL_ELASTICITY: 0.7,    // Top Esneklik Katsayısı
    GOAL_TOLERANCE: 0.5      // Kale Tolerans Aralığı
  };

  const predictBallTrajectory = (
    ballPos: THREE.Vector3, 
    difficulty?: Difficulty | string
  ): THREE.Vector3 => {
    const safeDifficulty = normalizeDifficulty(difficulty);
    
    const cacheKey = `${ballPos.x},${ballPos.y},${ballPos.z},${safeDifficulty}`;
    
    if (predictionCache.has(cacheKey)) {
      return predictionCache.get(cacheKey)!;
    }

    const predictionFactors = {
      'hard': { variation: 1.2, randomness: 1.5 },
      'medium': { variation: 0.8, randomness: 1.0 },
      'easy': { variation: 0.5, randomness: 0.7 }
    };

    const { variation, randomness } = predictionFactors[safeDifficulty];
    
    const trajectoryVariation = new THREE.Vector3(
      Math.random() * variation * randomness,
      Math.random() * variation * randomness,
      Math.random() * variation * randomness
    );

    const predictedTrajectory = ballPos.clone()
      .add(trajectoryVariation)
      .multiplyScalar(variation)
      .sub(new THREE.Vector3(0, PHYSICS_CONSTANTS.GRAVITY * 0.01, 0)); // Yerçekimi etkisi

    predictionCache.set(cacheKey, predictedTrajectory);

    return predictedTrajectory;
  };

  const calculateSaveProbability = (
    ballPosition: THREE.Vector3, 
    difficulty?: Difficulty | string
  ): number => {
    const safeDifficulty = normalizeDifficulty(difficulty);
    
    const cacheKey = `${ballPosition.x},${ballPosition.y},${safeDifficulty}`;
    
    if (saveProbabilityCache.has(cacheKey)) {
      return saveProbabilityCache.get(cacheKey)!;
    }

    const goalWidth = SCENE_DIMENSIONS.GOAL_WIDTH;
    const goalHeight = SCENE_DIMENSIONS.GOAL_HEIGHT;

    const distanceFromCenter = Math.abs(ballPosition.x);
    const verticalDistance = ballPosition.y;

    const baseProb = 
      safeDifficulty === 'hard' ? 0.6 : 
      safeDifficulty === 'medium' ? 0.5 : 0.4;

    const horizontalFactor = 1 - Math.min(
      distanceFromCenter / (goalWidth / 2 + PHYSICS_CONSTANTS.GOAL_TOLERANCE), 
      1
    );

    const verticalFactor = 1 - Math.min(
      Math.abs(verticalDistance) / (goalHeight + PHYSICS_CONSTANTS.GOAL_TOLERANCE), 
      1
    );

    const saveProbability = Math.min(
      baseProb * horizontalFactor * verticalFactor * 
      (1 + Math.random() * 0.2 - 0.1), // Küçük rastgelelik
      1
    );

    saveProbabilityCache.set(cacheKey, saveProbability);

    return saveProbability;
  };

  return {
    predictBallTrajectory,
    calculateSaveProbability,
    PHYSICS_CONSTANTS
  };
})();
const useGoalkeeperLogic = (
  ballPosition: THREE.Vector3 | null, 
  difficulty?: Difficulty | string
) => {
  const safeDifficulty = normalizeDifficulty(difficulty);

  const [aiMemory, setAiMemory] = useState<AIMemoryState>({
    shotHistory: [],
    learningRate: 0.1,
    predictionAccuracy: 0.5
  });

  const predictedTrajectory = useMemo(() => {
    if (!ballPosition) return null;
    
    return performanceFunctions.predictBallTrajectory(
      ballPosition, 
      safeDifficulty
    );
  }, [ballPosition, safeDifficulty]);

  const saveProbability = useMemo(() => {
    if (!ballPosition) return 0;
    
    return performanceFunctions.calculateSaveProbability(
      ballPosition, 
      safeDifficulty
    );
  }, [ballPosition, safeDifficulty]);

  const updateAIMemory = useCallback((
    ballPosition: THREE.Vector3, 
    isGoal: boolean, 
    shotPower: number
  ) => {
    setAiMemory(prevState => {
      const newHistory = [...prevState.shotHistory];
      if (newHistory.length >= 20) {
        newHistory.shift();
      }
      newHistory.push({
        position: ballPosition,
        result: isGoal ? 'goal' : 'save',
        power: shotPower
      });
      return {
        shotHistory: newHistory,
        learningRate: prevState.learningRate * 0.99,
        predictionAccuracy: 1 - (newHistory.filter(s => s.result === 'goal').length / newHistory.length)
      };
    });
  }, []);

  return {
    aiMemory,
    predictedTrajectory,
    saveProbability,
    updateAIMemory
  };
};
const MemoizedGoalkeeper = React.memo(
  (props: GoalkeeperProps) => {
    const { 
      ballPosition, 
      difficulty = 'medium' as Difficulty,
      reactionTime = GAME_SETTINGS.GOALKEEPER.DEFAULT_REACTION_TIME,
      onSave,
      onGoal,
    } = props;

    const { scene, animations } = useGLTF('/models/goalkeeper.glb');
    const { actions } = useAnimations(animations, scene);
    const keeperRef = useRef<THREE.Group>(null);
    const trajectoryRef = useRef<THREE.Vector3[]>([]);
    const isMoving = useRef(false);

    const [gameStatus, setGameStatus] = useState<GoalkeeperState>('idle');

    const { 
      saveProbability, 
      updateAIMemory 
    } = useGoalkeeperLogic(
      ballPosition, 
      difficulty
    );

    const handleGoalkeeperInteraction = useCallback(() => {
      if (!ballPosition) return;

      const isSaved = saveProbability > 0.5;
      
      if (isSaved) {
        onSave?.();
        const diveDirection = determineDiveDirection(ballPosition);
        playGoalkeeperAnimation(diveDirection);
      } else {
        onGoal?.();
      }

      updateAIMemory(ballPosition, !isSaved, ballPosition.length());
    }, [
      ballPosition, 
      saveProbability, 
      updateAIMemory, 
      onSave, 
      onGoal
    ]);

    useEffect(() => {
      handleGoalkeeperInteraction();
    }, [handleGoalkeeperInteraction]);

    useEffect(() => {
      const renderTime = performance.now();
      return () => {
        const renderDuration = performance.now() - renderTime;
        if (renderDuration > 16) { // 60 FPS için maks render süresi
          console.warn(`Goalkeeper render performansı düşük: ${renderDuration}ms`);
        }
      };
    }, [ballPosition, difficulty]);

    useEffect(() => {
      if (ballPosition) {
        trajectoryRef.current.push(ballPosition.clone());
        if (trajectoryRef.current.length > GOALKEEPER_SETTINGS.AI.TRAJECTORY.MAX_POINTS) {
          trajectoryRef.current.shift();
        }
      }
    }, [ballPosition]);

    const predictBallTrajectory = (ballPos: THREE.Vector3): THREE.Vector3 => {
      return ballPos.clone();
    };

    const determineDiveDirection = (predictedPos: THREE.Vector3): 'left' | 'right' | 'center' | 'leftUp' | 'rightUp' => {
      const angleThreshold = Math.PI / 4;  // 45 derece
      const goalWidth = 7.32;  // Standart kale genişliği
      const normalizedX = predictedPos.x / (goalWidth / 2);
      const normalizedY = predictedPos.y;

      if (normalizedX < -Math.cos(angleThreshold) && normalizedY > 1) return 'leftUp';
      if (normalizedX < -Math.cos(angleThreshold)) return 'left';
      if (normalizedX > Math.cos(angleThreshold) && normalizedY > 1) return 'rightUp';
      if (normalizedX > Math.cos(angleThreshold)) return 'right';
      return 'center';
    };

    const calculateSaveProbability = (ballPosition: THREE.Vector3): number => {
      const distanceFromCenter = Math.abs(ballPosition.x);
      const verticalDistance = ballPosition.y;

      const baseProb = difficulty === 'hard' ? 0.7 : 
                       difficulty === 'medium' ? 0.5 : 0.3;

      const positionFactor = 1 - (distanceFromCenter / (SCENE_DIMENSIONS.GOAL_WIDTH / 2));
      const verticalFactor = 1 - (verticalDistance / SCENE_DIMENSIONS.GOAL_HEIGHT);

      return Math.min(baseProb * positionFactor * verticalFactor, 1);
    };

    const handleBallInteraction = useCallback((ballPos: THREE.Vector3) => {
      const saveProbability = calculateSaveProbability(ballPos);
      const randomOutcome = Math.random();
      if (randomOutcome > saveProbability) {
        onSave?.();
        const diveDirection = determineDiveDirection(ballPos);
        playGoalkeeperAnimation(diveDirection);
      } else {
        onGoal?.();
      }

      updateAIMemory(ballPos, !randomOutcome, ballPos.length());
    }, [difficulty, onGoal, onSave]);

    useEffect(() => {
      if (ballPosition) {
        handleBallInteraction(ballPosition);
      }
    }, [ballPosition, handleBallInteraction]);

    useEffect(() => {
      if (!scene || !actions) return;

      scene.rotation.set(0, 0, 0);

      if (scene && scene.children.length > 1) {
        scene.children.forEach((child, index) => {
          if (index > 0) child.visible = false; 
        });
      }

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const originalMaterial = child.material;
          if (originalMaterial instanceof THREE.MeshStandardMaterial) {
            const newMaterial = new THREE.MeshStandardMaterial({
              map: originalMaterial.map,
              normalMap: originalMaterial.normalMap,
              roughnessMap: originalMaterial.roughnessMap,
              metalnessMap: originalMaterial.metalnessMap,
              color: originalMaterial.color,
              roughness: originalMaterial.roughness,
              metalness: originalMaterial.metalness
            });
            
            child.material = newMaterial;
          }
        }
      });

      const idleAnimation = actions["Armature|mixamo.com|Base Layer"];
      if (idleAnimation) {
        Object.values(actions).forEach(action => action?.stop());
        idleAnimation.reset().play();
      }
    }, [scene, actions]);

    useEffect(() => {
      actions[GOALKEEPER_SETTINGS.AI.ANIMATION.STATES.IDLE]?.play();
    }, [actions]);

    useEffect(() => {
      if (!actions) return;

      if (gameStatus === 'diving' && !isMoving.current) {
        isMoving.current = true;
        setTimeout(() => {
          if (!keeperRef.current || !actions) return;
          let selectedDive = "Armature.001|mixamo.com|Base Layer";  // Sol
          if (ballPosition.x > 0) {
            selectedDive = "Armature.002|mixamo.com|Base Layer";  // Sağ
          }
          if (ballPosition.y > 1) {
            selectedDive = "Armature.005|mixamo.com|Base Layer";  // Sol Üst
          }
          const diveAction = actions[selectedDive];
          if (diveAction) {
            Object.values(actions).forEach(action => action?.stop());
            diveAction.reset().play();
            const targetX = THREE.MathUtils.clamp(
              ballPosition.x, 
              -3, 
              3
            );
            
            if (keeperRef.current) {
              keeperRef.current.position.x = targetX;
            }
          }
        }, reactionTime * 1000);
      } 
      else if (gameStatus === 'idle') {
        isMoving.current = false;

        const idleAnimation = actions["Armature|mixamo.com|Base Layer"];
        if (idleAnimation) {  
          Object.values(actions).forEach(action => action?.stop());
          idleAnimation.reset().play();
        }
      }
    }, [gameStatus, ballPosition, reactionTime, actions]);

    useEffect(() => {
      if (ballPosition.z < -7 && Math.abs(ballPosition.x) < 2) {
        setGameStatus('diving');
        onGoal?.();
      } else {
        setGameStatus('idle');
      }
    }, [ballPosition, onGoal]);

    useFrame((_, delta) => {
      if (actions && actions["Armature|mixamo.com|Base Layer"]) {
        actions["Armature|mixamo.com|Base Layer"].time += delta;
      }
    });

    const calculateSavePosition = (predictedBallPos: THREE.Vector3) => {
      const targetX = THREE.MathUtils.clamp(
        predictedBallPos.x,
        -SCENE_DIMENSIONS.GOALKEEPER_MOVE_RANGE_X,
        SCENE_DIMENSIONS.GOALKEEPER_MOVE_RANGE_X
      );
      return new THREE.Vector3(targetX, 0, 0); 
    };

    const playGoalkeeperAnimation = (direction: DiveDirection) => {

      if (!actions) return;

      switch(direction) {
        case 'left':
          actions['Armature.001|mixamo.com|Base Layer']?.play(); // Sol tarafa atlama
          break;
        case 'right':
          actions['Armature.002|mixamo.com|Base Layer']?.play(); // Sağ tarafa atlama
          break;
        case 'leftUp':
          actions['Armature.003|mixamo.com|Base Layer']?.play();
          break;
        case 'rightUp':
          actions['Armature.004|mixamo.com|Base Layer']?.play();
          break;
        default:
          actions['Armature.005|mixamo.com|Base Layer']?.play();
      }
    };

    useFrame(() => {
      if (!keeperRef.current || !ballPosition) return;

      const predictedPosition = predictBallTrajectory(ballPosition);
      const savePosition = calculateSavePosition(predictedPosition);
      keeperRef.current.position.lerp(savePosition, GOALKEEPER_SETTINGS.MOVEMENT.LERP_FACTOR);

      if (ballPosition && keeperRef.current) {
        const collision = isCollisionWithGoalkeeper(
          ballPosition,
          keeperRef.current.position
        );
        if (collision) {
          console.log('Collision detected!');
          onSave?.();
          playGoalkeeperAnimation('center');
        }
      }

    });

    return (
      <group ref={keeperRef}>
        <pointLight 
          position={[0, 0, 0]} 
          intensity={0} 
          distance={0} 
          color="#ffffff" 
        />
        <primitive 
          object={scene} 
          position={[0, 0.2, SCENE_DIMENSIONS.GOALKEEPER_START_Z]}
          scale={[
            SCENE_DIMENSIONS.GOALKEEPER_WIDTH,
            SCENE_DIMENSIONS.GOALKEEPER_HEIGHT,
            SCENE_DIMENSIONS.GOALKEEPER_DEPTH
          ]}
          className={props.className}  // className prop'u eklendi
        />
      </group>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.difficulty === nextProps.difficulty &&
      (!prevProps.ballPosition || !nextProps.ballPosition || 
        prevProps.ballPosition.equals(nextProps.ballPosition))
    );
  }
);
const Goalkeeper: React.FC<GoalkeeperProps> = (props) => {
  const { 
    ballPosition, 
    difficulty = 'medium' as Difficulty,
    reactionTime = GAME_SETTINGS.GOALKEEPER.DEFAULT_REACTION_TIME,
    onSave,
    onGoal,
    className = ''
  } = props;

  const safeDifficulty = normalizeDifficulty(difficulty as string) as Difficulty;
  const safeClassName = safeStringParam(className, '');

  const { 
  } = useGoalkeeperLogic(
    ballPosition, 
    safeDifficulty
  );

  return (
    <MemoizedGoalkeeper 
      ballPosition={ballPosition} 
      difficulty={safeDifficulty} 
      reactionTime={reactionTime} 
      onSave={onSave}
      onGoal={onGoal}
      className={safeClassName}
      ballRef={props.ballRef}
    />
  );
};
export default Goalkeeper;
