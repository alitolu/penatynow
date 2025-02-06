import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Mesh, Vector3 } from 'three';
import { motion } from 'framer-motion';
import { AxesHelper } from 'three';
import { OrbitControls } from '@react-three/drei';

import Stadium from './Stadium';
import Goalkeeper from './Goalkeeper';
import  Ball  from './Ball';
import CameraConfigFooter, { CameraConfig } from './CameraConfigFooter';
import { Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { GAME_SETTINGS, GAME_STATES, DIFFICULTY_LEVELS, Score, SCENE_DIMENSIONS, GAME_PHYSICS, GOAL_FRAME } from '../constants/gameConstants';
import DebugGrid, { PointLabel, DebugLabelsHTML } from './DebugGrid';
import 'sweetalert2/dist/sweetalert2.min.css';
import Arrow from './Arrow';
import Circle from './Circle'

type Difficulty = 'easy' | 'medium' | 'hard';

const Game: React.FC = () => {
  const [score, setScore] = useState<Score>({ player: 0, goalkeeper: 0 });
  const [difficultyLevel, setDifficultyLevel] = useState(GAME_SETTINGS.GOALKEEPER.DEFAULT_DIFFICULTY);
  const [ballPower, setBallPower] = useState(GAME_SETTINGS.SHOT.DEFAULT_POWER);
  const [goalkeeperReactionTime, setGoalkeeperReactionTime] = useState(GAME_SETTINGS.GOALKEEPER.DEFAULT_REACTION_TIME);
  const [isChargingShot, setIsChargingShot] = useState(false);
  const [shotPower, setShotPower] = useState(GAME_SETTINGS.SHOT.MIN_POWER);
  const [isBallActive, setIsBallActive] = useState(false);
  const [shotDirection, setShotDirection] = useState({ horizontal: 7, vertical: 7 });
  const chargeIntervalRef = useRef<NodeJS.Timeout>();

  const ballRef = useRef<THREE.Mesh>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
    const [showArrow, setShowArrow] = useState(false);
    const [showCircle, setShowCircle] = useState(false);

  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    distance: GAME_SETTINGS.CAMERA.DEFAULT.DISTANCE,
    height: GAME_SETTINGS.CAMERA.DEFAULT.HEIGHT,
    angle: GAME_SETTINGS.CAMERA.DEFAULT.ANGLE,
    posX: GAME_SETTINGS.CAMERA.DEFAULT.POS_X,
    posY: GAME_SETTINGS.CAMERA.DEFAULT.POS_Y,
    posZ: GAME_SETTINGS.CAMERA.DEFAULT.POS_Z,
    rotX: GAME_SETTINGS.CAMERA.DEFAULT.ROT_X,
    rotY: GAME_SETTINGS.CAMERA.DEFAULT.ROT_Y,
    rotZ: GAME_SETTINGS.CAMERA.DEFAULT.ROT_Z,
    fov: GAME_SETTINGS.CAMERA.DEFAULT.FOV,
    zoom: GAME_SETTINGS.CAMERA.DEFAULT.ZOOM,
    perspective: GAME_SETTINGS.CAMERA.DEFAULT.PERSPECTIVE
  });

  const initialBallPosition = useMemo(() => {
    return new THREE.Vector3(0, 0.1, -1);
  }, []);

  const [debugLabels, setDebugLabels] = useState<PointLabel[]>([]);

  useEffect(() => {

      const handleKeyDown = (event: KeyboardEvent) => {
          if (event.code === 'Space' && !isChargingShot && !isBallActive) {
              event.preventDefault();
              setIsChargingShot(true);
              setShotPower(GAME_SETTINGS.SHOT.MIN_POWER);

              chargeIntervalRef.current = setInterval(() => {
                  setShotPower(prev => Math.min(prev + GAME_SETTINGS.SHOT.POWER_INCREASE_RATE, GAME_SETTINGS.SHOT.MAX_POWER));
              }, GAME_SETTINGS.SHOT.POWER_INCREASE_INTERVAL);
          } else if (event.code === 'ArrowLeft') {
              setShotDirection(prev => ({ ...prev, horizontal: prev.horizontal - 5 })); // Sol yön
              setShowArrow(true);
          } else if (event.code === 'ArrowRight') {
              setShotDirection(prev => ({ ...prev, horizontal: prev.horizontal + 5 })); // Sağ yön
              setShowArrow(true);
          } else if (event.code === 'ArrowUp') {
              setShotDirection(prev => ({ ...prev, vertical: Math.min(prev.vertical + 5, 90) })); // Yukarı yön
              setShowArrow(true);
          } else if (event.code === 'ArrowDown') {
              setShotDirection(prev => ({ ...prev, vertical: Math.max(prev.vertical - 5, 0) })); // Aşağı yön
              setShowArrow(true);
          }
      };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && isChargingShot) {
        event.preventDefault();
        clearInterval(chargeIntervalRef.current);
        setIsChargingShot(false);
        
        if (ballRef.current) {
          setIsBallActive(true);
          handleShoot(shotPower, shotDirection.horizontal);
        }
        
        setTimeout(() => {
          resetBall();
          setIsBallActive(false);
        }, GAME_SETTINGS.SHOT.RESET_DELAY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isChargingShot, shotPower, isBallActive, shotDirection]);

  const handleGoalOutcome = useCallback((isGoal: boolean) => {
    setScore(prev => ({
      ...prev,
      [isGoal ? 'player' : 'goalkeeper']: prev[isGoal ? 'player' : 'goalkeeper'] + 1
    }));
  }, []);

  const handleShoot = useCallback((power: number, angle: number) => {
    if (!ballRef.current) return;

    const ball = ballRef.current;
    const normalizedPower = (power / 100) * 10;
    const horizontalAngle = shotDirection.horizontal;
      const verticalAngle = shotDirection.vertical;

    if (ball.userData.shoot) {
      ball.userData.shoot(
        horizontalAngle, 
        verticalAngle, 
        normalizedPower
      );
    }

    setIsBallActive(true);

    const resetTimer = setTimeout(() => {
      resetBall();
      setIsBallActive(false);
      clearTimeout(resetTimer);
    }, GAME_SETTINGS.SHOT.RESET_DELAY);
  }, [shotDirection]);

  const handleBallPositionUpdate = useCallback((position: THREE.Vector3) => {
      // Gerekirse top pozisyonu güncellemesi için kod eklenebilir

  }, []);

  const resetBall = () => {
    if (ballRef.current) {

      ballRef.current.position.set(
        SCENE_DIMENSIONS.PENALTY_SPOT_X,
        SCENE_DIMENSIONS.BALL_START_HEIGHT,
        SCENE_DIMENSIONS.BALL_START_Z
      );
  
      if (ballRef.current.userData.resetVelocity) {
        ballRef.current.userData.resetVelocity();
      }
  
      if (ballRef.current.userData.resetSpin) {
        ballRef.current.userData.resetSpin();
      }
    }
  };

  const handleCameraConfigChange = (newConfig: CameraConfig) => {
    // Kamera pozisyonunu dinamik olarak güncelle
    const updatedConfig = {
      ...newConfig,
      // Mesafe ve açıya göre dinamik pozisyon hesaplaması
      posX: newConfig.distance * Math.sin(THREE.MathUtils.degToRad(newConfig.angle)),
      posY: newConfig.height,
      posZ: newConfig.distance * Math.cos(THREE.MathUtils.degToRad(newConfig.angle)) + 7,
      
      // Rotasyonları açıya göre ayarla
      rotX: -newConfig.angle,
      rotY: 0,
      rotZ: 0
    };

    // State'i güncelle
    setCameraConfig(updatedConfig);

    // Konsola debug bilgisi
    //console.log('Kamera Ayarları Güncellendi:', updatedConfig);
  };

  const CameraSetup = () => {
    const { camera } = useThree();
    const ballRef = useRef<THREE.Mesh | null>(null);
    const [cameraShake, setCameraShake] = useState(0);
    
    React.useEffect(() => {
      if (camera instanceof THREE.PerspectiveCamera) {
        // Dinamik kamera ayarları
        const updateCamera = () => {
          // Temel kamera ayarları
          camera.fov = cameraConfig.fov;
          camera.zoom = cameraConfig.zoom;
          camera.updateProjectionMatrix();

          // Dinamik pozisyon ve rotasyon
          const targetPosX = cameraConfig.posX + 
            (cameraConfig.perspective === 'close' ? 
              Math.sin(Date.now() * 0.001) * cameraShake : 0);
          const targetPosY = cameraConfig.posY + 
            (cameraConfig.perspective === 'close' ? 
              Math.cos(Date.now() * 0.001) * cameraShake : 0);
          
          camera.position.set(
            targetPosX, 
            targetPosY, 
            cameraConfig.posZ
          );

          camera.rotation.set(
            THREE.MathUtils.degToRad(cameraConfig.rotX), 
            THREE.MathUtils.degToRad(cameraConfig.rotY), 
            THREE.MathUtils.degToRad(cameraConfig.rotZ)
          );

          // Top takibi
          if (ballRef.current && cameraConfig.perspective === 'close') {
            const ballPosition = ballRef.current.position;
            const distanceToTarget = camera.position.distanceTo(ballPosition);
            
            // Yumuşak takip
            const smoothingFactor = 0.05;
            const newPosition = camera.position.lerp(
              new THREE.Vector3(
                ballPosition.x, 
                ballPosition.y + 2, 
                camera.position.z
              ), 
              smoothingFactor
            );

            camera.lookAt(ballPosition);
          }
        };

        // Kamera güncellemeleri için animasyon çağrısı
        const animationFrame = requestAnimationFrame(updateCamera);

        // Kamera sarsıntısı efekti
        const shakeInterval = setInterval(() => {
          if (cameraConfig.perspective === 'close') {
            setCameraShake(Math.random() * 0.2);
          } else {
            setCameraShake(0);
          }
        }, 100);

        return () => {
          cancelAnimationFrame(animationFrame);
          clearInterval(shakeInterval);
        };
      }
    }, [camera, cameraConfig, cameraShake]);

    return null;
  };

  return (
    <div className="game-container" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Canvas 
        camera={{ 
          position: [
            cameraConfig.posX, 
            cameraConfig.posY, 
            cameraConfig.posZ
          ],
                  fov: 45
              }}
      >
        <OrbitControls 
          enabled={true}  
                  enableZoom={true}
                  enablePan={true}
                  enableRotate={true}
          target={[0, 0, -15]}  
        />
       {/* <CameraSetup />*/}
        <DebugGrid 
          visible={false} 
          showMetrics={false} 
          onUpdateLabels={setDebugLabels}
        />
     {/*    <Stats /> FPS monitörü */}
        <AdaptiveDpr pixelated /> {/* Otomatik performans ayarı */}
        <AdaptiveEvents /> {/* Olay optimizasyonu */}
        <ambientLight intensity={GAME_SETTINGS.LIGHTING.AMBIENT_INTENSITY} />
        <directionalLight 
          position={GAME_SETTINGS.LIGHTING.DIRECTIONAL_LIGHT.POSITION}
          intensity={GAME_SETTINGS.LIGHTING.DIRECTIONAL_LIGHT.INTENSITY} 
          castShadow
        />
        <spotLight
          position={GAME_SETTINGS.LIGHTING.SPOT_LIGHT.POSITION}
          angle={GAME_SETTINGS.LIGHTING.SPOT_LIGHT.ANGLE}
          penumbra={GAME_SETTINGS.LIGHTING.SPOT_LIGHT.PENUMBRA}
          intensity={GAME_SETTINGS.LIGHTING.SPOT_LIGHT.INTENSITY}
          castShadow
        />
        <Stadium />
        <Goalkeeper 
          ballPosition={ballRef.current?.position || new THREE.Vector3(0, 0.2, -1)} 
          difficulty={difficultyLevel}
          reactionTime={goalkeeperReactionTime}
          onGoal={() => handleGoalOutcome(false)}
          className="goalkeeper"
          ballRef={ballRef}
        />
        <Ball 
          ref={ballRef}
          initialPosition={initialBallPosition}
          difficulty={difficultyLevel}
          power={ballPower}
          onPositionUpdate={handleBallPositionUpdate}
          onGoal={() => handleGoalOutcome(true)}
          shoot={(horizontalAngle, verticalAngle, power) => {
            if (ballRef.current) {
              ballRef.current.userData.shoot(horizontalAngle, verticalAngle, power);
            }
          }}
              />
              {showArrow && (
                  <>
                      <Arrow
                          position={initialBallPosition} // Topun pozisyonu
                          direction={shotDirection} // Okun yönü
                      />
                  </>
              )}
      </Canvas>

      {/*<DebugLabelsHTML labels={debugLabels} />*/}
      
      <div className="ui-container">
        <div className="score-board">
          <div>Oyuncu: {score.player}</div>
          <div>Kaleci: {score.goalkeeper}</div>
        </div>

        {isChargingShot && (
          <motion.div 
            className="power-bar"
            initial={{ width: 0 }}
            animate={{ width: `${shotPower}%` }}
            exit={{ width: 0 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </div>

      {/*<CameraConfigFooter 
        initialConfig={cameraConfig}
        onConfigChange={handleCameraConfigChange}
      />*/}
    </div>
  );
};

export default Game;
