import React, { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import { SCENE_DIMENSIONS } from '../constants/gameConstants';

const Stadium: React.FC = () => {
  // Goal model loading
  const goal = useLoader(GLTFLoader, '/models/goal.glb');
  
  // Çim ve zemin için doku yükleme
  const grassTexture = useLoader(TextureLoader, '/textures/grass.png');
  const lineTexture = useLoader(TextureLoader, '/textures/grass.png');

  // Referanslar
  const stadiumRef = useRef<THREE.Group>(null);

  // Doku tekrarlama ayarları
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10);

  lineTexture.wrapS = lineTexture.wrapT = THREE.RepeatWrapping;
  lineTexture.repeat.set(5, 5);

  return (
    <group ref={stadiumRef}>
      {/* Saha zemini */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, SCENE_DIMENSIONS.FIELD_CENTER_Z]}
        receiveShadow
      >
        <planeGeometry 
          args={[SCENE_DIMENSIONS.FIELD_WIDTH, SCENE_DIMENSIONS.FIELD_LENGTH]} 
        />
        <meshStandardMaterial 
          map={grassTexture}
          roughness={0.8}
          color="#2c7f3c"
        />
      </mesh>

      {/* Saha çizgileri */}
       {/*<mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.01, 0]}
      >
        <planeGeometry args={[50, 80]} />
        <meshBasicMaterial 
          map={lineTexture}
          transparent={false}
          opacity={1}
        />
      </mesh>*/}

      {/* Kale */}
      <primitive 
        object={goal.scene} 
        scale={[
          SCENE_DIMENSIONS.GOAL_WIDTH / 7.32,
          SCENE_DIMENSIONS.GOAL_HEIGHT / 2.44,
          SCENE_DIMENSIONS.GOAL_DEPTH / 2
        ]}  
        position={[0, 0, SCENE_DIMENSIONS.GOAL_POSITION_Z]}
        rotation={[0, Math.PI, 0]}
      />

    </group>
  );
};

export default Stadium;
