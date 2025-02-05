import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Mesh, Vector3 } from 'three';
import { motion } from 'framer-motion';
import { OrbitControls } from '@react-three/drei';

import Stadium from './Stadium';
import Goalkeeper from './Goalkeeper';
import  Ball  from './Ball';
import CameraConfigFooter, { CameraConfig } from './CameraConfigFooter';
import { Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { GAME_SETTINGS, DIFFICULTY_LEVELS, Score, SCENE_DIMENSIONS, GAME_PHYSICS, GOAL_FRAME } from '../constants/gameConstants';
import DebugGrid, { PointLabel, DebugLabelsHTML } from './DebugGrid';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import Arrow from './Arrow';
import Circle from './Circle';

type Difficulty = 'easy' | 'medium' | 'hard';

const Game: React.FC = () => {
  const [score, setScore] = useState<Score>({ player: 0, goalkeeper: 0 });
  const [difficultyLevel, setDifficultyLevel] = useState<Difficulty>(DIFFICULTY_LEVELS.MEDIUM);
  const [ballPower, setBallPower] = useState(GAME_SETTINGS.SHOT.DEFAULT_POWER);
  const [goalkeeperReactionTime, setGoalkeeperReactionTime] = useState(GAME_SETTINGS.GOALKEEPER.DEFAULT_REACTION_TIME);
  const [isChargingShot, setIsChargingShot] = useState(false);
  const [shotPower, setShotPower] = useState(GAME_SETTINGS.SHOT.MIN_POWER);
  const [isBallActive, setIsBallActive] = useState(false);
  const [shotDirection, setShotDirection] = useState({ horizontal: 0, vertical: 0 });
  const [showArrow, setShowArrow] = useState(false);
  const chargeIntervalRef = useRef<NodeJS.Timeout>();
  const [gameResult, setGameResult] = useState<string | null>(null);
  const ballRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
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
    return new THREE.Vector3(0, 0, -1);
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
          handleShoot(shotPower);
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

    // Oyun sonucunu ayarlayın
    handleGameEnd(isGoal ? 'GOL! 🥅' : 'Kurtarma! 🧤');
  }, []);
  const handleShoot = useCallback((power: number) => {
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
  }, [shotDirection]);
  const handleBallPositionUpdate = useCallback((position: THREE.Vector3) => {
    // Gerekirse top pozisyonu güncellemesi için kod eklenebilir
  }, []);
  const resetBall = () => {
    if (ballRef.current) {
      ballRef.current.position.copy(initialBallPosition);
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
  const handleGameEnd = (result: string) => {
    if (result) {
      setGameResult(result); // Sadece geçerli bir sonuç ayarlayın
    }
  };
  const showGameResultAlert = (result: string) => {
    Swal.fire({
      title: 'Oyun Sonucu',
      text: result,
      icon: 'info',
      confirmButtonText: 'Tamam'
    });
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
         // clearInterval(shakeInterval);
        };
      }
    }, [camera, cameraConfig, cameraShake]);

    return null;
  };

  const logSceneMetrics = () => {
    // Konsol tabanlı detaylı metrik bilgileri
    console.group('%c Sahne Metrikleri Detayları', 'color: green; font-weight: bold');

    console.log('%c Saha Boyutları', 'color: blue;', {
      genişlik: SCENE_DIMENSIONS.FIELD_WIDTH,
      uzunluk: SCENE_DIMENSIONS.FIELD_LENGTH,
      merkezNoktası: SCENE_DIMENSIONS.FIELD_CENTER_Z
    });

    console.log('%c Top Özellikleri', 'color: orange;', {
      yarıçap: SCENE_DIMENSIONS.BALL_RADIUS,
      başlangıçYüksekliği: SCENE_DIMENSIONS.BALL_START_HEIGHT,
      başlangıçPozisyonu: SCENE_DIMENSIONS.BALL_START_Z,
      kütle: GAME_PHYSICS.BALL_MASS
    });

    console.log('%c Kale Metrikleri', 'color: red;', {
      genişlik: SCENE_DIMENSIONS.GOAL_WIDTH,
      yükseklik: SCENE_DIMENSIONS.GOAL_HEIGHT,
      derinlik: SCENE_DIMENSIONS.GOAL_DEPTH,
      pozisyon: SCENE_DIMENSIONS.GOAL_POSITION_Z,
      kenarNoktaları: GOAL_FRAME
    });

    console.log('%c Kaleci Parametreleri', 'color: purple;', {
      genişlik: SCENE_DIMENSIONS.GOALKEEPER_WIDTH,
      yükseklik: SCENE_DIMENSIONS.GOALKEEPER_HEIGHT,
      derinlik: SCENE_DIMENSIONS.GOALKEEPER_DEPTH,
      başlangıçPozisyonu: SCENE_DIMENSIONS.GOALKEEPER_START_Z,
      hareketAlanı: {
        yatay: SCENE_DIMENSIONS.GOALKEEPER_MOVE_RANGE_X,
        dikey: SCENE_DIMENSIONS.GOALKEEPER_MOVE_RANGE_Y
      }
    });

    console.log('%c Fiziksel Parametreler', 'color: teal;', {
      yerçekimi: GAME_PHYSICS.GRAVITY,
      havaDansitesi: GAME_PHYSICS.AIR_DENSITY,
      sürüklenmeKatsayısı: GAME_PHYSICS.DRAG_COEFFICIENT
    });

    console.log('%c Çarpışma Toleransları', 'color: brown;', {
      golTespiti: SCENE_DIMENSIONS.GOAL_DETECTION_TOLERANCE,
      çarpışma: SCENE_DIMENSIONS.COLLISION_TOLERANCE
    });

    console.groupEnd();

    // Performans ve sahne analizi için ek bilgiler
    const performanceMetrics = {
      topluAlanHacmi:
        SCENE_DIMENSIONS.FIELD_WIDTH *
        SCENE_DIMENSIONS.FIELD_LENGTH *
        Math.abs(SCENE_DIMENSIONS.FIELD_CENTER_Z),
      kaleSahneDağılımOranı:
        (SCENE_DIMENSIONS.GOAL_WIDTH * SCENE_DIMENSIONS.GOAL_HEIGHT) /
        (SCENE_DIMENSIONS.FIELD_WIDTH * SCENE_DIMENSIONS.FIELD_LENGTH)
    };

    console.table(performanceMetrics);
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
          target={[0, 0.2, -15]}
        />
        <CameraSetup />
        <DebugGrid
          visible={true}
          showMetrics={true}
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
          ballPosition={ballRef.current?.position || new THREE.Vector3(0, 0, 0)}
          difficulty={difficultyLevel}
          reactionTime={goalkeeperReactionTime}
          onGoal={() => handleGoalOutcome(true)}
          className="goalkeeper"
          ballRef={ballRef} // Pass ballRef to Goalkeeper
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
            <Circle position={ballRef.current?.position || new THREE.Vector3(0, 0.2, 0)} radius={0.5} />
            <Arrow
              position={new THREE.Vector3(0, 0.2, 0)} // Topun pozisyonu
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
