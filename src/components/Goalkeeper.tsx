import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Group } from 'three';

import {
    SCENE_DIMENSIONS,
    isCollisionWithGoalkeeper,
    GAME_SETTINGS,
    GOALKEEPER_SETTINGS,
    type GoalkeeperState,
    type DiveDirection
} from '../constants/gameConstants';
import { trace } from 'console';

type Difficulty = 'easy' | 'medium' | 'hard';
interface GoalkeeperProps {
    ballPosition: THREE.Vector3;
    difficulty?: Difficulty;
    reactionTime?: number;
    onGoal?: () => void;
    onSave?: () => void;
    className?: string;  // Yeni prop
    ballRef: React.RefObject<THREE.Mesh>;
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
        const goalkeeperRef = useRef<THREE.Group>(null);
   
        const [gameStatus, setGameStatus] = useState<GoalkeeperState>('idle');

        const {
            saveProbability,
            updateAIMemory
        } = useGoalkeeperLogic(
            ballPosition,
            difficulty
        );

        const animationMap = {
            idle: "Armature|mixamo.com|Base Layer",
            diveLeft: "Armature.001|mixamo.com|Base Layer",
            diveRight: "Armature.002|mixamo.com|Base Layer",
            diveUp: "Armature.003|mixamo.com|Base Layer",
            diveLeftbottom: "Armature.004|mixamo.com|Base Layer",
            diveRightbottom: "Armature.005|mixamo.com|Base Layer",
        };

        const predictBallTrajectory = (ballPos: THREE.Vector3): THREE.Vector3 => {
            return ballPos.clone();
        };

        useEffect(() => {
            if (!actions || !scene) return;

            Object.values(actions).forEach((action) => action?.stop());
             
            let animationName = animationMap.idle; // Varsayılan animasyon "idle"

            scene.children.forEach((child, index) => {
                child.visible = index === 0; 
            });
        

             if (gameStatus === "diving") {    

                if (ballPosition.z < -1.3) { // Kaleye yaklaşma durumu
                    const xThreshold = 0.1;  // X ekseninde daha hassas ayrım
                    const yUpperThreshold = 0.1;  // Üst bölge için daha net sınır
                    const yLowerThreshold = 0.1;  // Alt bölge için daha net sınır
                
                    if (ballPosition.x < -xThreshold) {
                        if (ballPosition.y > yUpperThreshold) {
                            animationName = animationMap.diveUp; // Sol üst kurtarış
                        } else if (ballPosition.y < yLowerThreshold) {
                            animationName = animationMap.diveLeftbottom; // Sol alt kurtarış
                        } else {
                            animationName = animationMap.diveLeft; // Normal sol kurtarış
                        }
                    } else if (ballPosition.x > xThreshold) {
                        if (ballPosition.y > yUpperThreshold) {
                            animationName = animationMap.diveUp; // Sağ üst kurtarış
                        } else if (ballPosition.y < yLowerThreshold) {
                            animationName = animationMap.diveRightbottom; // Sağ alt kurtarış
                        } else {
                            animationName = animationMap.diveRight; // Normal sağ kurtarış
                        }
                    } else { // Merkez bölgesi
                        // Merkez için daha detaylı kontrol
                        if (ballPosition.y > yUpperThreshold) {
                            animationName = ballPosition.x < 0 
                                ? animationMap.diveLeft  // Sola doğru yüksek top
                                : animationMap.diveRight; // Sağa doğru yüksek top
                        } else if (ballPosition.y < yLowerThreshold) {
                            animationName = ballPosition.x < 0 
                                ? animationMap.diveLeftbottom  // Sola doğru düşük top
                                : animationMap.diveRightbottom; // Sağa doğru düşük top
                        } else {
                            animationName = animationMap.diveUp; // Tam merkezde düz kurtarış
                        }
                    }
                }

                if (animationName === animationMap.diveLeft) {
                    scene.children.forEach((child, index) => {
                        child.visible = index === 1; // 1. model için görünür yap
                    });
                } else if (animationName === animationMap.diveRight) {
                    scene.children.forEach((child, index) => {
                        child.visible = index === 2; // 2. model için görünür yap
                    });
                } else if (animationName === animationMap.diveUp) {
                    scene.children.forEach((child, index) => {
                        child.visible = index === 3; // 3. model için görünür yap
                    });
                } else if (animationName === animationMap.diveLeftbottom) {
                    scene.children.forEach((child, index) => {
                        child.visible = index === 4; // 4. model için görünür yap
                    });
                } else if (animationName === animationMap.diveRightbottom) {
                    scene.children.forEach((child, index) => {
                        child.visible = index === 5; // 5. model için görünür yap
                    });
                };

                const diveAnimation = actions[animationName];

                if (diveAnimation) {
                    diveAnimation.reset();
                    diveAnimation.setLoop(THREE.LoopOnce, 1);
                    diveAnimation.clampWhenFinished = true;
                    diveAnimation.play();
                }
          
        
                setTimeout(() => {
                    setGameStatus("idle");
                }, 2000);

            } else if (actions[animationName]) {
                actions[animationName]?.reset().play();
            }
        
        }, [gameStatus, actions, ballPosition, scene]);
        
        const calculateSavePosition = (predictedBallPos: THREE.Vector3) => {
            const targetX = THREE.MathUtils.clamp(
                predictedBallPos.x,
                -SCENE_DIMENSIONS.GOALKEEPER_MOVE_RANGE_X,
                SCENE_DIMENSIONS.GOALKEEPER_MOVE_RANGE_X
            );
            return new THREE.Vector3(targetX  , 0, 0);
        };

        useFrame(() => {
            if (!goalkeeperRef.current || !ballPosition) return;
        
            const predictedPosition = predictBallTrajectory(ballPosition);
            const savePosition = calculateSavePosition(predictedPosition);
        
            goalkeeperRef.current.position.lerp(savePosition, 0.1);
        
            if (savePosition.x > 0 || savePosition.x < 0) {
                setGameStatus("diving");
            }

        });

        return (
            <group ref={goalkeeperRef}>
                <pointLight
                    position={[0, 0, 0]}
                    intensity={0}
                    distance={0}
                    color="#ffffff"
                />
                <primitive
                    ref={goalkeeperRef}
                    object={scene}
                    position={[0, 0, SCENE_DIMENSIONS.GOALKEEPER_START_Z]}
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