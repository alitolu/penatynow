import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ArrowProps {
  position: THREE.Vector3;
  direction: { horizontal: number; vertical: number };
  arrowColor?: number; // Özelleştirilebilir renk
  arrowOpacity?: number; // Özelleştirilebilir opaklık
  arrowLength?: number; // Özelleştirilebilir uzunluk
  pulseIntensity?: number; // Özelleştirilebilir pulse yoğunluğu
}

const Arrow: React.FC<ArrowProps> = ({
  position,
  direction,
  arrowColor = 0x00ffff, // Varsayılan mavi renk
  arrowOpacity = 0.7, // Varsayılan opaklık
  arrowLength = 2, // Varsayılan uzunluk
  pulseIntensity = 0.1, // Varsayılan pulse yoğunluğu
}) => {

  const meshRef = useRef<THREE.Mesh>(null);
  const horizontalAngle = THREE.MathUtils.degToRad(direction.horizontal);
  const verticalAngle = THREE.MathUtils.degToRad(direction.vertical);
  const rotation = new THREE.Euler(verticalAngle, horizontalAngle, 0);

  useFrame(() => {
    if (meshRef.current) {
      const scale = 1 + pulseIntensity * Math.sin(Date.now() * 0.005); // Pulse efekti yoğunluğu ayarlanabilir
      meshRef.current.scale.set(scale, scale, arrowLength); // Okun uzunluğu ayarlanabilir
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <meshStandardMaterial color={arrowColor} transparent opacity={arrowOpacity} /> {/* Renk ve opaklık ayarlanabilir */}
          <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial color={arrowColor} transparent opacity={arrowOpacity} /> {/* Renk ve opaklık ayarlanabilir */}
      </mesh>
    </mesh>
  );
};

export default Arrow;
