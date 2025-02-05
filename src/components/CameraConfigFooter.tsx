import React, { useState } from 'react';
import { CAMERA_CONFIG } from '../constants/gameConstants';
import * as THREE from 'three';
import type { CameraPerspective } from '../constants/gameConstants';

export interface CameraConfig {
  distance: number;
  height: number;
  angle: number;
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  fov: number;
  zoom: number;
  perspective: CameraPerspective;
}

interface CameraConfigFooterProps {
  initialConfig?: Partial<CameraConfig>;
  onConfigChange: (config: CameraConfig) => void;
}

const CameraConfigFooter: React.FC<CameraConfigFooterProps> = ({ 
  initialConfig = {}, 
  onConfigChange 
}) => {
  const [config, setConfig] = useState<CameraConfig>({
    distance: CAMERA_CONFIG.DEFAULT.DISTANCE,
    height: CAMERA_CONFIG.DEFAULT.HEIGHT,
    angle: CAMERA_CONFIG.DEFAULT.ANGLE,
    posX: CAMERA_CONFIG.DEFAULT.POS_X,
    posY: CAMERA_CONFIG.DEFAULT.POS_Y,
    posZ: CAMERA_CONFIG.DEFAULT.POS_Z,
    rotX: CAMERA_CONFIG.DEFAULT.ROT_X,
    rotY: CAMERA_CONFIG.DEFAULT.ROT_Y,
    rotZ: CAMERA_CONFIG.DEFAULT.ROT_Z,
    fov: CAMERA_CONFIG.DEFAULT.FOV,
    zoom: CAMERA_CONFIG.DEFAULT.ZOOM,
    perspective: 'default',
    ...initialConfig
  });

  const updateConfig = (updates: Partial<CameraConfig>) => {
    const newConfig = { 
      ...config, 
      ...updates,
      // Dinamik hesaplamalar
      posX: updates.distance !== undefined 
        ? updates.distance * Math.sin(THREE.MathUtils.degToRad(updates.angle ?? config.angle))
        : config.posX,
      posY: updates.height !== undefined ? updates.height : config.posY,
      posZ: updates.distance !== undefined 
        ? updates.distance * Math.cos(THREE.MathUtils.degToRad(updates.angle ?? config.angle)) + 7
        : config.posZ,
      rotX: updates.angle !== undefined ? -updates.angle : config.rotX
    };
    
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handlePerspectiveChange = (perspective: CameraPerspective) => {
    switch(perspective) {
      case 'close':
        updateConfig({
          distance: CAMERA_CONFIG.PERSPECTIVES.CLOSE.DISTANCE,
          height: CAMERA_CONFIG.PERSPECTIVES.CLOSE.HEIGHT,
          angle: CAMERA_CONFIG.PERSPECTIVES.CLOSE.ANGLE,
          fov: CAMERA_CONFIG.PERSPECTIVES.CLOSE.FOV,
          zoom: CAMERA_CONFIG.PERSPECTIVES.CLOSE.ZOOM,
          perspective: 'close'
        });
        break;
      case 'wide':
        updateConfig({
          distance: CAMERA_CONFIG.PERSPECTIVES.WIDE.DISTANCE,
          height: CAMERA_CONFIG.PERSPECTIVES.WIDE.HEIGHT,
          angle: CAMERA_CONFIG.PERSPECTIVES.WIDE.ANGLE,
          fov: CAMERA_CONFIG.PERSPECTIVES.WIDE.FOV,
          zoom: CAMERA_CONFIG.PERSPECTIVES.WIDE.ZOOM,
          perspective: 'wide'
        });
        break;
      default:
        updateConfig({
          distance: CAMERA_CONFIG.DEFAULT.DISTANCE,
          height: CAMERA_CONFIG.DEFAULT.HEIGHT,
          angle: CAMERA_CONFIG.DEFAULT.ANGLE,
          fov: CAMERA_CONFIG.DEFAULT.FOV,
          zoom: CAMERA_CONFIG.DEFAULT.ZOOM,
          perspective: 'default'
        });
    }
  };

  const renderSlider = (
    label: string, 
    value: number, 
    min: number, 
    max: number, 
    step: number, 
    onChange: (val: number) => void
  ) => {
    return (
      <div className="camera-config-slider" style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
        <label style={{ marginRight: '10px' }}>{label}</label>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ marginLeft: '10px' }}>{value.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div 
      className="camera-config-footer" 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <h3>Kamera Ayarları</h3>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
        {(['default', 'close', 'wide'] as const).map((perspective) => (
          <button
            key={perspective}
            onClick={() => handlePerspectiveChange(perspective as CameraPerspective)}
            style={{
              margin: '0 10px',
              padding: '5px 15px',
              backgroundColor: config.perspective === perspective ? '#2ecc71' : 'rgba(255,255,255,0.2)',
              color: config.perspective === perspective ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {perspective === 'default' ? 'Varsayılan' : 
             perspective === 'close' ? 'Yakın' : 'Geniş'}
          </button>
        ))}
      </div>

      <div style={{ width: '80%' }}>
        {renderSlider(
          'Mesafe', 
          config.distance, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.DISTANCE.MIN, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.DISTANCE.MAX, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.DISTANCE.STEP, 
          (val) => updateConfig({ distance: val })
        )}
        
        {renderSlider(
          'Yükseklik', 
          config.height, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.HEIGHT.MIN, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.HEIGHT.MAX, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.HEIGHT.STEP, 
          (val) => updateConfig({ height: val })
        )}
        
        {renderSlider(
          'Açı', 
          config.angle, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.ANGLE.MIN, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.ANGLE.MAX, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.ANGLE.STEP, 
          (val) => updateConfig({ angle: val })
        )}
        
        {renderSlider(
          'FOV', 
          config.fov, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.FOV.MIN, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.FOV.MAX, 
          CAMERA_CONFIG.CONTROLS.SLIDERS.FOV.STEP, 
          (val) => updateConfig({ fov: val })
        )}
      </div>
    </div>
  );
};

export default CameraConfigFooter;
