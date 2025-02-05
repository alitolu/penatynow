import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line, Box } from '@react-three/drei';
import { SCENE_DIMENSIONS, GOAL_FRAME, isInGoal } from '../constants/gameConstants';
import { Difficulty } from '../constants/gameConstants';

interface GoalPlaneProps {
  ballPosition: THREE.Vector3;
  onGoal: (goalDetails: GoalDetails) => void;
  onMiss: (missDetails: MissDetails) => void;
  difficulty?: Difficulty;
}

interface GoalDetails {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angle: number;
  power: number;
}

interface MissDetails {
  position: THREE.Vector3;
  reason: 'out_left' | 'out_right' | 'over' | 'under';
}

const GoalPlane: React.FC<GoalPlaneProps> = ({ 
  ballPosition, 
  onGoal, 
  onMiss,
  difficulty = 'medium' as Difficulty
}) => {
  const goalPlaneRef = useRef<THREE.Mesh>(null);
  const [goalTrackingEnabled, setGoalTrackingEnabled] = useState(true);

  useFrame(() => {
    if (!goalTrackingEnabled) return;

    const isGoalScored = isInGoal(ballPosition);
    
    if (isGoalScored) {
      const goalDetails: GoalDetails = {
        position: ballPosition.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        angle: Math.atan2(ballPosition.x, -ballPosition.z) * (180 / Math.PI),
        power: ballPosition.length()
      };

      onGoal(goalDetails);
      setGoalTrackingEnabled(false);
      setTimeout(() => setGoalTrackingEnabled(true), 2000);
    }
  });

  return (
    <group>
      <mesh 
        ref={goalPlaneRef}
        position={[0, SCENE_DIMENSIONS.GOAL_HEIGHT/2, SCENE_DIMENSIONS.GOAL_POSITION_Z]}
      >
        <planeGeometry args={[SCENE_DIMENSIONS.GOAL_WIDTH, SCENE_DIMENSIONS.GOAL_HEIGHT]} />
        <meshBasicMaterial transparent opacity={0.2} wireframe />
      </mesh>

      {/* Kale çerçevesi */}
      <Line 
        points={[
          GOAL_FRAME.bottomLeft,
          GOAL_FRAME.topLeft,
          GOAL_FRAME.topRight,
          GOAL_FRAME.bottomRight,
          GOAL_FRAME.bottomLeft
        ]} 
        color="white" 
        lineWidth={2}
      />
    </group>
  );
};

export default GoalPlane;
