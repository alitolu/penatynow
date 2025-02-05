import React from 'react';
import * as THREE from 'three';

interface CircleProps {
  position: THREE.Vector3;
  radius: number;
}

const Circle: React.FC<CircleProps> = ({ position, radius }) => {
  const circleGeometry = new THREE.CircleGeometry(radius, 64); // 64 kenarlı çember
  const circleMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff, // Mavi ton
    transparent: true,
    opacity: 0.5, // Şeffaflık
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial attach="material" {...circleMaterial} />
      <circleGeometry attach="geometry" args={[radius, 64]} />
    </mesh>
  );
};

export default Circle; 