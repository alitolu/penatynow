import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { SCENE_DIMENSIONS } from '../constants/gameConstants';

interface DebugGridProps {
  visible?: boolean;
  showMetrics?: boolean;
  onUpdateLabels?: (labels: PointLabel[]) => void;
}

export interface PointLabel {
  position: THREE.Vector3;
  color: string;
  label: string;
}

const DebugGrid: React.FC<DebugGridProps> = ({ 
  visible = true, 
  showMetrics = true,
  onUpdateLabels 
}) => {
  const { scene, camera } = useThree();
  const gridRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    // Ana grid
    const gridHelper = new THREE.GridHelper(
      SCENE_DIMENSIONS.FIELD_WIDTH,
      20,
      'red',
      'rgba(255, 255, 255, 0.2)'
    );
    gridHelper.position.y = 0.01;
    gridRef.current.add(gridHelper);

    // Grid üzerine sayısal etiketler
    const createGridLabel = (x: number, z: number, text: string, color: string = 'white') => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.fillStyle = 'rgba(0,0,0,0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 20px Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      
      sprite.position.set(x, 1, z);
      sprite.scale.set(2, 1, 1);
      
      gridRef.current?.add(sprite);
    };

    // Grid üzerine mesafe etiketleri
    const gridSize = SCENE_DIMENSIONS.FIELD_WIDTH;
    const gridStep = gridSize / 10;

    for (let x = -gridSize/2; x <= gridSize/2; x += gridStep) {
      for (let z = -SCENE_DIMENSIONS.FIELD_LENGTH/2; z <= SCENE_DIMENSIONS.FIELD_LENGTH/2; z += gridStep) {
        //createGridLabel(x, z, `(${x.toFixed(1)}, ${z.toFixed(1)})`, 'cyan');
      }
    }

    // Merkez çizgisi
    const centerLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -SCENE_DIMENSIONS.FIELD_LENGTH/2),
        new THREE.Vector3(0, 0, SCENE_DIMENSIONS.FIELD_LENGTH/2)
      ]),
      new THREE.LineBasicMaterial({ color: 'blue', linewidth: 2 })
    );
    gridRef.current.add(centerLine);

    // Önemli noktalar ve mesafeler
    const points: PointLabel[] = [
      {
        position: new THREE.Vector3(
          SCENE_DIMENSIONS.PENALTY_SPOT_X, 
          0.2, 
          SCENE_DIMENSIONS.PENALTY_SPOT_Z
        ),
        color: 'yellow',
        label: `Penaltı Noktası (${SCENE_DIMENSIONS.PENALTY_SPOT_X}, ${SCENE_DIMENSIONS.PENALTY_SPOT_Z})`
      },
      {
        position: new THREE.Vector3(
          0, 
          SCENE_DIMENSIONS.GOAL_HEIGHT/2, 
          SCENE_DIMENSIONS.GOAL_POSITION_Z
        ),
        color: 'red',
        label: `Kale Merkezi (0, ${SCENE_DIMENSIONS.GOAL_POSITION_Z})`
      },
      {
        position: new THREE.Vector3(
          0, 
          0.2, 
          SCENE_DIMENSIONS.GOALKEEPER_START_Z
        ),
        color: 'blue',
        label: `Kaleci (0, ${SCENE_DIMENSIONS.GOALKEEPER_START_Z})`
      }
    ];

    // Noktaları işaretle ve etiketleri güncelle
    points.forEach(point => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.2),
        new THREE.MeshBasicMaterial({ color: point.color, transparent: true, opacity: 0.7 })
      );
      sphere.position.copy(point.position);
      gridRef.current?.add(sphere);
    });

    // Kale çerçevesi
    const goalFrame = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-SCENE_DIMENSIONS.GOAL_WIDTH/2 - 1.2, 0, SCENE_DIMENSIONS.GOAL_POSITION_Z),
        new THREE.Vector3(-SCENE_DIMENSIONS.GOAL_WIDTH/2 - 1.2, SCENE_DIMENSIONS.GOAL_HEIGHT + 1.5, SCENE_DIMENSIONS.GOAL_POSITION_Z),
        new THREE.Vector3(SCENE_DIMENSIONS.GOAL_WIDTH/2 + 1.4, SCENE_DIMENSIONS.GOAL_HEIGHT + 1.5, SCENE_DIMENSIONS.GOAL_POSITION_Z),
        new THREE.Vector3(SCENE_DIMENSIONS.GOAL_WIDTH/2 + 1.4, 0, SCENE_DIMENSIONS.GOAL_POSITION_Z),
        new THREE.Vector3(-SCENE_DIMENSIONS.GOAL_WIDTH/2 - 1.4, 0, SCENE_DIMENSIONS.GOAL_POSITION_Z)  // Kapatma çizgisi
      ]),
      new THREE.LineBasicMaterial({ color: 'green', linewidth: 2 })
    );
    gridRef.current.add(goalFrame);

    // Kale çerçevesi köşe noktaları
    const goalCorners: PointLabel[] = [
      {
        position: new THREE.Vector3(
          -SCENE_DIMENSIONS.GOAL_WIDTH/2 - 1.2, 
          0, 
          SCENE_DIMENSIONS.GOAL_POSITION_Z
        ),
        color: 'magenta',
        label: 'Sol Alt Direk'
      },
      {
        position: new THREE.Vector3(
          -SCENE_DIMENSIONS.GOAL_WIDTH/2 - 1.2, 
          SCENE_DIMENSIONS.GOAL_HEIGHT + 1.5, 
          SCENE_DIMENSIONS.GOAL_POSITION_Z
        ),
        color: 'magenta',
        label: 'Sol Üst Direk'
      },
      {
        position: new THREE.Vector3(
          SCENE_DIMENSIONS.GOAL_WIDTH/2 + 1.4, 
          0, 
          SCENE_DIMENSIONS.GOAL_POSITION_Z
        ),
        color: 'green',
        label: 'Sağ Alt Direk'
      },
      {
        position: new THREE.Vector3(
          SCENE_DIMENSIONS.GOAL_WIDTH/2 + 1.4, 
          SCENE_DIMENSIONS.GOAL_HEIGHT + 1.5, 
          SCENE_DIMENSIONS.GOAL_POSITION_Z
        ),
        color: 'green',
        label: 'Sağ Üst Direk'
      }
    ];

    // Kale köşe noktalarını işaretle
    goalCorners.forEach(point => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.05),
        new THREE.MeshBasicMaterial({ color: point.color, transparent: true, opacity: 0.8 })
      );
      sphere.position.copy(point.position);
      gridRef.current?.add(sphere);
    });

    // Mevcut points dizisine kale köşe noktalarını ekle
    points.push(...goalCorners);

    if (showMetrics && onUpdateLabels) {
      onUpdateLabels(points);
    }
  }, [showMetrics, onUpdateLabels]);

  if (!visible) return null;

  return <group ref={gridRef} />;
};

// HTML etiketleri için ayrı bir React bileşeni
export const DebugLabelsHTML: React.FC<{ labels: PointLabel[] }> = ({ labels }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
      {labels.map((label, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: '10px',
            top: `${10 + index * 30}px`,
            color: label.color,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '5px',
            borderRadius: '3px',
            fontSize: '12px'
          }}
        >
          {`${label.label}: (${label.position.x.toFixed(1)}, ${label.position.y.toFixed(1)}, ${label.position.z.toFixed(1)})`}
        </div>
      ))}
    </div>
  );
};

export default DebugGrid;