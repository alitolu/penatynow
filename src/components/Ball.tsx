import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import {
  SCENE_DIMENSIONS,
  calculateDragForce,
  isInGoal,
  Difficulty
} from '../constants/gameConstants';

interface BallPhysicsParams {
  gravity: number;
  airResistance: number;
  spinFactor: number;
  bounceFactor: number;
  windFactor: number;
  frictionCoefficient: number;
  mass: number;  
}

interface BallProps {
  initialPosition?: THREE.Vector3;
  difficulty?: 'easy' | 'medium' | 'hard';
  power?: number;
  onPositionUpdate: (position: THREE.Vector3) => void;
  onGoal?: () => void;
  shoot?: (horizontalAngle: number, verticalAngle: number, power: number) => void;
}

type CollisionType = 'ground' | 'wall' | 'goalkeeper' | 'default';

const Ball = React.forwardRef<THREE.Group, BallProps>((props, ref) => {
  const {
    initialPosition = new THREE.Vector3(
      0,
      0,
      SCENE_DIMENSIONS.BALL_START_Z
    ),
    difficulty = 'medium' as Difficulty,
    onGoal,
  } = props;
  const ballRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/ball.glb');
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const [physicsParams, setPhysicsParams] = useState<BallPhysicsParams>({
    gravity: 9.81,           // Yerçekimi
    airResistance: 0.2,     // Hava direnci
    spinFactor: 0.5,         // Daha yüksek spin etkisi
    bounceFactor: 0.2,       // Zıplama faktörü
    windFactor: 0.2,        // Rüzgar etkisi
    frictionCoefficient: 0.02, // Sürtünme katsayısı
    mass: 0.45               // Standart futbol topu kütlesi (kg)
  });

  const [ballState, setBallState] = useState({
    isMoving: false,
    trajectory: [] as THREE.Vector3[],
    lastPosition: initialPosition.clone()
  });

  const updateBallTrajectory = useCallback((currentPosition: THREE.Vector3) => {
    setBallState(prev => {
      const newTrajectory = [...prev.trajectory, currentPosition.clone()];

      if (newTrajectory.length > 50) {
        newTrajectory.shift();
      }

      return {
        ...prev,
        trajectory: newTrajectory,
        lastPosition: currentPosition
      };
    });
  }, []);

  const checkGoalInteraction = useCallback((position: THREE.Vector3) => {
    if (isInGoal(position)) {
      onGoal?.();
      console.log('⚽ GOL! Top kale içinde:', {
        position: position.toArray(),
        trajectory: ballState.trajectory.map(p => p.toArray())
      });
    }
  }, [onGoal, ballState.trajectory]);

  const simulateEnvironmentalEffects = useCallback((velocity: THREE.Vector3) => {
    const temperatureEffect = Math.sin(Date.now() * 0.0001) * 0.008;  // Biraz daha fazla sıcaklık değişimi
    const humidityEffect = Math.cos(Date.now() * 0.0002) * 0.005;   // Hafif nem etkisi

    velocity.x += temperatureEffect;
    velocity.z += humidityEffect;

    return velocity;
  }, []);

  const checkCollisions = useCallback((position: THREE.Vector3) => {
    // Çarpışma türleri
    const collisionTypes = {
      GROUND: 'ground',
      GOALKEEPER: 'goalkeeper',
      GOAL_POST: 'goalPost',
      FIELD_BOUNDARY: 'fieldBoundary'
    };

    // Çarpışma sonucu nesnesi
    interface CollisionResult {
      type: string;
      point: THREE.Vector3;
      normal: THREE.Vector3;
      impulse: number;
    }

    const collisionResults: CollisionResult[] = [];

    // 1. Zemin çarpışması
    if (position.y < SCENE_DIMENSIONS.BALL_RADIUS) {
      collisionResults.push({
        type: collisionTypes.GROUND,
        point: new THREE.Vector3(position.x, 0, position.z),
        normal: new THREE.Vector3(0, 1, 0),
        impulse: Math.abs(velocityRef.current.y) * physicsParams.bounceFactor
      });

      // Topun yönünü ve hızını güncelle
      velocityRef.current.y *= -physicsParams.bounceFactor;
      position.y = SCENE_DIMENSIONS.BALL_RADIUS;
    }

    // 2. Saha sınırları çarpışması
    const halfFieldWidth = SCENE_DIMENSIONS.FIELD_WIDTH / 2;
    const halfFieldLength = SCENE_DIMENSIONS.FIELD_LENGTH / 2;

    if (Math.abs(position.x) > halfFieldWidth - SCENE_DIMENSIONS.BALL_RADIUS) {
      collisionResults.push({
        type: collisionTypes.FIELD_BOUNDARY,
        point: new THREE.Vector3(
          Math.sign(position.x) * (halfFieldWidth - SCENE_DIMENSIONS.BALL_RADIUS),
          position.y,
          position.z
        ),
        normal: new THREE.Vector3(-Math.sign(position.x), 0, 0),
        impulse: Math.abs(velocityRef.current.x) * 0.5
      });

      // X yönündeki hızı tersine çevir ve azalt
      velocityRef.current.x *= -0.7;
    }

    // 3. Kale direği çarpışması (basitleştirilmiş)
    const goalPostPositions = [
      new THREE.Vector3(-SCENE_DIMENSIONS.GOAL_WIDTH / 2, SCENE_DIMENSIONS.GOAL_HEIGHT / 2, SCENE_DIMENSIONS.GOAL_POSITION_Z),
      new THREE.Vector3(SCENE_DIMENSIONS.GOAL_WIDTH / 2, SCENE_DIMENSIONS.GOAL_HEIGHT / 2, SCENE_DIMENSIONS.GOAL_POSITION_Z)
    ];

    goalPostPositions.forEach(postPosition => {
      const distanceToPost = position.distanceTo(postPosition);
      if (distanceToPost < (SCENE_DIMENSIONS.GOAL_WIDTH / 2 + SCENE_DIMENSIONS.BALL_RADIUS + 0.1)) {  // 10cm tolerans

        collisionResults.push({
          type: collisionTypes.GOAL_POST,
          point: postPosition,
          normal: position.clone().sub(postPosition).normalize(),
          impulse: velocityRef.current.length() * 0.6
        });

        // Çarpma açısına göre yön değişimi
        const reflectionVector = velocityRef.current.reflect(position.clone().sub(postPosition).normalize());
        velocityRef.current.copy(reflectionVector.multiplyScalar(0.7));
      }
    });

    // 4. Kaleci çarpışması (basitleştirilmiş)
    const keeperPosition = new THREE.Vector3(0, SCENE_DIMENSIONS.GOALKEEPER_HEIGHT / 2, SCENE_DIMENSIONS.GOALKEEPER_START_Z);
    const distanceToKeeper = position.distanceTo(keeperPosition);

    if (distanceToKeeper < (SCENE_DIMENSIONS.BALL_RADIUS + SCENE_DIMENSIONS.GOALKEEPER_WIDTH / 2)) {
      collisionResults.push({
        type: collisionTypes.GOALKEEPER,
        point: keeperPosition,
        normal: position.clone().sub(keeperPosition).normalize(),
        impulse: velocityRef.current.length() * 0.5
      });

      // Kaleciden sekme
      const reflectionVector = velocityRef.current.reflect(position.clone().sub(keeperPosition).normalize());
      velocityRef.current.copy(reflectionVector.multiplyScalar(0.6));
    }

    // Gol kontrolü
    const isInGoalArea = 
      position.x >= -SCENE_DIMENSIONS.GOAL_WIDTH / 2 &&
      position.x <= SCENE_DIMENSIONS.GOAL_WIDTH / 2 &&
      position.y >= 0 &&
      position.y <= SCENE_DIMENSIONS.GOAL_HEIGHT &&
      position.z >= SCENE_DIMENSIONS.GOAL_POSITION_Z - 0.1 &&
      position.z <= SCENE_DIMENSIONS.GOAL_POSITION_Z + 0.1;

    if (isInGoalArea) {
      console.log('🥅 GOL! Top kale içinde.');
      onGoal?.();
    }

    // Çarpışma loglaması
    if (collisionResults.length > 0) {
      console.log('🔥 Çarpışma Detayları:', collisionResults);
    }

    return collisionResults.length > 0;
  }, [physicsParams, velocityRef]);

  useEffect(() => {
    switch (difficulty) {
      case 'easy':
        setPhysicsParams({
          gravity: 9.81,           // Gerçekçi yerçekimi
          airResistance: 0.05,     // Düşük hava direnci
          spinFactor: 0.02,
          bounceFactor: 0.6,
          windFactor: 0.001,
          frictionCoefficient: 0.2,
          mass: 0.4  // Daha hafif top
        });
        break;
      case 'hard':
        setPhysicsParams({
          gravity: 9.81,
          airResistance: 0.08,
          spinFactor: 0.03,
          bounceFactor: 0.5,
          windFactor: 0.002,
          frictionCoefficient: 0.4,
          mass: 0.5  // Daha ağır top
        });
        break;
      default: // medium
        setPhysicsParams({
          gravity: 9.81,
          airResistance: 0.06,
          spinFactor: 0.025,
          bounceFactor: 0.55,
          windFactor: 0.0015,
          frictionCoefficient: 0.3,
          mass: 0.45 // Standart kütle
        });
    }
  }, [difficulty]);

  const [isShot, setIsShot] = useState(false);

  useEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.userData.shoot = (horizontalAngle: number, verticalAngle: number, power: number) => {
        const MAX_SHOT_SPEED = 50;
        const MIN_SHOT_SPEED = 10; 

        const hRad = (horizontalAngle * Math.PI) / 90;
        const vRad = (verticalAngle * Math.PI) / 90;

        const shotSpeed = THREE.MathUtils.clamp(
          power * MAX_SHOT_SPEED, 
          MIN_SHOT_SPEED, 
          MAX_SHOT_SPEED
        );

        const kickVelocity = new THREE.Vector3(
          Math.sin(hRad) * shotSpeed,   // X ekseninde yatay hareket
          Math.sin(vRad) * shotSpeed,   // Y ekseninde dikey hareket
          -Math.cos(hRad) * shotSpeed   // Z ekseninde ileri hareket
        );

        velocityRef.current.copy(kickVelocity);
        setIsShot(true);
      };
    }
  }, [ref]);

  useFrame((state, delta) => {
      if (!ballRef.current || !isShot) return;

      const position = ballRef.current.position;

      position.add(velocityRef.current.clone().multiplyScalar(delta * 1)); 

    checkGoalInteraction(position);
    updateBallTrajectory(position);
    simulateEnvironmentalEffects(velocityRef.current);
    checkCollisions(position);
    velocityRef.current = calculateDragForce(velocityRef.current).multiplyScalar(0.99);
  });

  useEffect(() => {
    if (ballRef.current) {
      while (ballRef.current.children.length) {
        ballRef.current.remove(ballRef.current.children[0]);
      }
      const clonedScene = scene.clone();
      ballRef.current.add(clonedScene);
      ballRef.current.position.copy(initialPosition);
    }
  }, [scene, initialPosition]);

  return (
    <group
      ref={(group) => {
        if (group) {
          const mutableRef = ballRef as { current: THREE.Group | null };
          mutableRef.current = group;

          const meshGroup = group as unknown as THREE.Group;
          if (typeof ref === 'function') {
            ref(meshGroup);
          } else if (ref) {
            const mutableExtRef = ref as { current: THREE.Group | null };
            mutableExtRef.current = meshGroup;
          }
        }
      }}
      position={initialPosition}
      scale={[0.22, 0.22, 0.22]}
    >
    </group>
  );
});

export default Ball;
