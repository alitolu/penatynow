import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { 
  SCENE_DIMENSIONS, 
  GAME_PHYSICS, 
  calculateDragForce,
  isInGoal  
} from '../constants/gameConstants';

interface BallPhysicsParams {
  gravity: number;
  airResistance: number;
  spinFactor: number;
  bounceFactor: number;
  windFactor: number;
  frictionCoefficient: number;
  mass: number;  // Yeni kütle parametresi
}

interface BallProps {
  initialPosition?: THREE.Vector3;
  difficulty?: 'easy' | 'medium' | 'hard';
  power?: number;
  onPositionUpdate: (position: THREE.Vector3) => void;
  onGoal?: () => void;
  shoot?: (horizontalAngle: number, verticalAngle: number, power: number) => void;
}

const Ball = React.forwardRef<THREE.Mesh, BallProps>(({ 
  initialPosition = new THREE.Vector3(
    0,
    0.2,
    SCENE_DIMENSIONS.BALL_START_Z
  ),
  difficulty = 'medium',
  power = 1,
  onPositionUpdate,
  onGoal,
  shoot
}, ref) => {
  const ballRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/ball.glb');
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const spinRef = useRef(new THREE.Vector3(0, 0, 0));
  const [physicsParams, setPhysicsParams] = useState<BallPhysicsParams>({
    gravity: 9.81,           // Yerçekimi
    airResistance: 0.2,     // Hava direnci
    spinFactor: 0.5,         // Daha yüksek spin etkisi
    bounceFactor: 0.2,       // Zıplama faktörü
    windFactor: 0.2,        // Rüzgar etkisi
    frictionCoefficient: 0.02, // Sürtünme katsayısı
    mass: 0.45               // Standart futbol topu kütlesi (kg)
  });

  // Top hareket ve çarpışma durumunu izleyen yeni state
  const [ballState, setBallState] = useState({
    isMoving: false,
    trajectory: [] as THREE.Vector3[],
    lastPosition: initialPosition.clone()
  });

  const updateBallTrajectory = useCallback((currentPosition: THREE.Vector3) => {
    setBallState(prev => {
      const newTrajectory = [...prev.trajectory, currentPosition.clone()];
      
      // Maksimum 50 nokta sakla
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
    // Gol kontrolü
    if (isInGoal(position)) {
      onGoal?.();
      
      // Debug bilgisi
      console.log('⚽ GOL! Top kale içinde:', {
        position: position.toArray(),
        trajectory: ballState.trajectory.map(p => p.toArray())
      });

    }

  }, [onGoal, ballState.trajectory]);

  // Kütle etkisini hesaplama fonksiyonu
  const applyMassEffect = useCallback((velocity: THREE.Vector3) => {
    // Kütle arttıkça ivmelenme azalır, ancak çok az bir oranda
    const massReductionFactor = 1 / (1 + physicsParams.mass * 0.05);
    return velocity.multiplyScalar(massReductionFactor);
  }, [physicsParams.mass]);

  // Gelişmiş hava direnci hesaplaması
  const applyAirResistance = useCallback((velocity: THREE.Vector3) => {
    const speedSquared = velocity.lengthSq();
    const dragCoefficient = 0.47; // Küresel cisimler için tipik sürükleme katsayısı
    const airDensity = 1.225; // Deniz seviyesinde hava yoğunluğu
    const referenceArea = Math.PI * Math.pow(SCENE_DIMENSIONS.BALL_RADIUS, 2);

    const dragMagnitude = 
      0.5 * dragCoefficient * airDensity * referenceArea * speedSquared * physicsParams.airResistance;
    
    const dragDirection = velocity.clone().negate().normalize();
    const dragForce = dragDirection.multiplyScalar(dragMagnitude);

    return velocity.add(dragForce.multiplyScalar(0.05)); // Daha az yavaşlama
  }, [physicsParams]);

  // Top dönüş fiziği (spin)
  const applySpin = useCallback((velocity: THREE.Vector3, spin: THREE.Vector3) => {
    // Magnus etkisi - daha belirgin spin
    const magnusForce = new THREE.Vector3(
      spin.y * physicsParams.spinFactor * 1.5,
      -spin.x * physicsParams.spinFactor * 1.5,
      spin.z * physicsParams.spinFactor * 1.5
    );

    return velocity.add(magnusForce);
  }, [physicsParams]);

  // Rüzgar etkisi
  const applyWind = useCallback((velocity: THREE.Vector3) => {
    const windDirection = new THREE.Vector3(
      Math.sin(Date.now() * 0.001) * physicsParams.windFactor,
      0,
      Math.cos(Date.now() * 0.001) * physicsParams.windFactor
    );

    return velocity.add(windDirection);
  }, [physicsParams]);

  // Çevresel faktör simülasyonu
  const simulateEnvironmentalEffects = useCallback((velocity: THREE.Vector3) => {
    const temperatureEffect = Math.sin(Date.now() * 0.0001) * 0.008;  // Biraz daha fazla sıcaklık değişimi
    const humidityEffect = Math.cos(Date.now() * 0.0002) * 0.005;   // Hafif nem etkisi
    
    velocity.x += temperatureEffect;
    velocity.z += humidityEffect;

    return velocity;
  }, []);

  // Çarpışma türü için tür tanımı
  type CollisionType = 'ground' | 'wall' | 'goalkeeper' | 'default';

  // Gelişmiş enerji kaybı hesaplaması
  const calculateEnergyLoss = useCallback((velocity: THREE.Vector3, collisionType: CollisionType) => {
    const energyLossFactors: Record<CollisionType, number> = {
      ground: 0.6,     // Zemin çarpışmasında enerji kaybı
      wall: 0.7,       // Duvar çarpışmasında enerji kaybı
      goalkeeper: 0.5, // Kaleci çarpışmasında enerji kaybı
      default: 0.8     // Diğer çarpışmalarda enerji kaybı
    };

    const lossRate = energyLossFactors[collisionType];
    return velocity.multiplyScalar(lossRate);
  }, []);

  // Gelişmiş çarpışma fiziği
  const advancedCollisionPhysics = useCallback((
    position: THREE.Vector3, 
    velocity: THREE.Vector3, 
    collisionType: CollisionType
  ) => {
    // Çarpışma sonrası hız ve konum düzeltmeleri
    const correctedVelocity = calculateEnergyLoss(velocity, collisionType);
    
    switch(collisionType) {
      case 'ground':
        position.y = SCENE_DIMENSIONS.BALL_RADIUS;  // Zeminden çıkma
        correctedVelocity.y *= -1;  // Zıplama
        break;
      case 'wall':
        correctedVelocity.x *= -1;  // Yön değişimi
        break;
      case 'goalkeeper':
        // Kaleciden sekme açısı
        const randomDeflection = new THREE.Vector3(
          Math.random() * 0.5 - 0.25,
          Math.random() * 0.5,
          Math.random() * 0.5 - 0.25
        );
        correctedVelocity.add(randomDeflection);
        break;
      case 'default':
        // Varsayılan durumda herhangi bir özel işlem yapma
        break;
    }

    return { 
      position, 
      velocity: correctedVelocity 
    };
  }, [calculateEnergyLoss]);

  // Gelişmiş çarpışma kontrolü
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
      // Daha kesin zemin sınırı kontrolü
      const groundLevel = SCENE_DIMENSIONS.BALL_RADIUS;
      
      // Topun zeminin içine girmesini kesin olarak engelle
      position.y = groundLevel;
      
      // Daha yumuşak ve kontrollü sekme fiziği
      velocityRef.current.y = Math.abs(velocityRef.current.y) * physicsParams.bounceFactor * 0.8;
      
      // Ek güvenlik: Minimum hız sınırı
      if (Math.abs(velocityRef.current.y) < 0.1) {
        velocityRef.current.y = 0;
      }
      
      collisionResults.push({
        type: collisionTypes.GROUND,
        point: new THREE.Vector3(position.x, groundLevel, position.z),
        normal: new THREE.Vector3(0, 1, 0),
        impulse: Math.abs(velocityRef.current.y)
      });
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
      new THREE.Vector3(-SCENE_DIMENSIONS.GOAL_WIDTH/2, SCENE_DIMENSIONS.GOAL_HEIGHT/2, SCENE_DIMENSIONS.GOAL_POSITION_Z),
      new THREE.Vector3(SCENE_DIMENSIONS.GOAL_WIDTH/2, SCENE_DIMENSIONS.GOAL_HEIGHT/2, SCENE_DIMENSIONS.GOAL_POSITION_Z)
    ];

    goalPostPositions.forEach(postPosition => {
      const distanceToPost = position.distanceTo(postPosition);
      if (distanceToPost < (SCENE_DIMENSIONS.BALL_RADIUS + 0.1)) {  // 10cm tolerans
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

// 4. Kaleci çarpışması 
const keeperPosition = new THREE.Vector3(
  0, 
  SCENE_DIMENSIONS.GOALKEEPER_HEIGHT, 
  SCENE_DIMENSIONS.GOALKEEPER_START_Z
);
const distanceToKeeper = position.distanceTo(keeperPosition);

if (distanceToKeeper < (SCENE_DIMENSIONS.BALL_RADIUS + SCENE_DIMENSIONS.GOALKEEPER_WIDTH)) {
  // Çarpışma detayları
  const collisionNormal = position.clone().sub(keeperPosition).normalize();
  const currentVelocity = velocityRef.current.clone();
  
  // Direkt çarpma etkisi
  const impactFactor = 1.2; // Çarpma şiddetini artır
  const directImpact = collisionNormal.multiplyScalar(
    currentVelocity.length() * impactFactor
  );

  // Hızı ve yönü güncelle
  velocityRef.current.copy(
    currentVelocity
      .multiplyScalar(-0.7)  // Ters yöne hız
      .add(directImpact)     // Direkt çarpma etkisi
  );

  // Çarpışma sonrası pozisyon düzeltmesi
  position.add(
    collisionNormal.multiplyScalar(SCENE_DIMENSIONS.BALL_RADIUS * 1.5)
  );

  // Çarpışma sonucu log
  collisionResults.push({
    type: collisionTypes.GOALKEEPER,
    point: keeperPosition,
    normal: collisionNormal,
    impulse: directImpact.length()
  });

  // Detaylı konsol çıktısı
  console.log('🥅 Kaleci Çarpma Detayları:', {
    impactVelocity: directImpact.length(),
    direction: collisionNormal.toArray(),
    finalVelocity: velocityRef.current.toArray()
  });
}

    return collisionResults.length > 0;
  }, [physicsParams, velocityRef]);

  // Fizik parametrelerini ayarlayalım
  useEffect(() => {
    switch(difficulty) {
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

  // Şut durumu için state
  const [isShot, setIsShot] = useState(false);

  // Başlangıç hızını ve enerji parametrelerini saklayacak ref
  const initialVelocityRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const initialSpinRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Şut anında başlangıç hızını ve spin parametrelerini kaydet
  const prepareShot = useCallback((shotVelocity: THREE.Vector3, shotSpin: THREE.Vector3) => {
    initialVelocityRef.current.copy(shotVelocity);
    initialSpinRef.current.copy(shotSpin);
  }, []);

  // Enerji ve hız sabitleyici fonksiyon
  const maintainInitialEnergy = useCallback((currentVelocity: THREE.Vector3) => {
    // Başlangıç hızının büyüklüğünü korumak için normalize et
    const initialSpeed = initialVelocityRef.current.length();
    const currentSpeed = currentVelocity.length();
    
    // Hız oranını hesapla
    const speedRatio = initialSpeed / (currentSpeed || 1);
    
    // Hızı başlangıç hızına normalize et
    return currentVelocity.multiplyScalar(speedRatio);
  }, []);

  const trajectoryLineRef = useRef<THREE.Line | null>(null);

// Yörüngeyi güncelleme fonksiyonu
const updateTrajectoryLine = useCallback(() => {
  if (trajectoryLineRef.current) {
    const points = ballState.trajectory.map(p => p.clone());
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    trajectoryLineRef.current.geometry.dispose();
    trajectoryLineRef.current.geometry = geometry;
  }
}, [ballState.trajectory]);

useEffect(() => {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000,linewidth: 2 });
  const lineGeometry = new THREE.BufferGeometry();
  const line = new THREE.Line(lineGeometry, lineMaterial);
  trajectoryLineRef.current = line;
  ballRef.current?.add(line);
  console.log('Yörünge Noktaları:', ballState.trajectory);
}, []);

  // Ref'e shoot fonksiyonunu ekle
  useEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.userData.shoot = (horizontalAngle: number, verticalAngle: number, power: number) => {
        const normalizedPower = THREE.MathUtils.clamp(
          power * GAME_PHYSICS.MAX_SHOT_POWER,
          GAME_PHYSICS.MIN_SHOT_POWER,
          GAME_PHYSICS.MAX_SHOT_POWER
        );
        
        const hRad = (horizontalAngle * Math.PI) / 180;
        const vRad = (verticalAngle * Math.PI) / 180;
        
        const kickVelocity = new THREE.Vector3(
          Math.sin(hRad) * normalizedPower,
          Math.sin(vRad) * normalizedPower,
          -Math.cos(hRad) * normalizedPower
        );

        // Spin vektörünü hesapla
        const spinVector = new THREE.Vector3(
          (Math.random() * 2 - 1) * 1,
          (Math.random() * 2 - 1) * 1,
          (Math.random() * 2 - 1) * 1
        );
        
        // Başlangıç parametrelerini kaydet
        prepareShot(kickVelocity, spinVector);

        // Hızı ve spin'i ayarla
        velocityRef.current.copy(kickVelocity);
        spinRef.current.copy(spinVector);

        setIsShot(true);  // Şut bayrağını aç
      };
    }
  }, [ref, prepareShot]);


  useFrame((state, delta) => {
    if (!ballRef.current || !isShot) return;

    const currentPosition = ballRef.current.position;
    const position = ballRef.current.position;
    const scaledDelta = delta * 0.3;

    // Daha dinamik ve hızlı spin hesaplaması
    const spinVector = new THREE.Vector3(
      (Math.random() * 2 - 1) * 1,  // Daha geniş spin aralığı
      (Math.random() * 2 - 1) * 1,
      (Math.random() * 2 - 1) * 1
    );

    // Fizik hesaplamaları
    velocityRef.current = applyMassEffect(velocityRef.current);
    velocityRef.current = maintainInitialEnergy(velocityRef.current);
    velocityRef.current = applySpin(velocityRef.current, spinVector);

    // Hareket
    position.add(velocityRef.current.clone().multiplyScalar(scaledDelta * 3)); // Daha hızlı hareket

    // Pozisyon güncellemeleri
    onPositionUpdate(currentPosition);
    updateBallTrajectory(currentPosition);
    checkGoalInteraction(currentPosition);

    // Çarpışma kontrolü
    const hasCollision = checkCollisions(position);

    // Şutu durdurma koşulları
    if (hasCollision || Math.abs(position.z) > 30) {
      setIsShot(false);
      velocityRef.current.set(0, 0, 0);
     //ballRef.current.position.copy(initialPosition);
    }

    // Top dönüş animasyonu - daha hızlı ve dinamik
    ballRef.current.rotation.x += velocityRef.current.z * scaledDelta * 0.8;
    ballRef.current.rotation.z -= velocityRef.current.x * scaledDelta * 0.9;

    updateTrajectoryLine();
    
  });

  
  // Scene'i klonla ve hazırla
  useEffect(() => {
    if (ballRef.current) {
      // Mevcut scene'i temizle
      while (ballRef.current.children.length) {
        ballRef.current.remove(ballRef.current.children[0]);
      }
      
      // Scene'i klonla ve ekle
      const clonedScene = scene.clone();
      ballRef.current.add(clonedScene);
      
      // Başlangıç pozisyonunu ayarla
      ballRef.current.position.copy(initialPosition);
    }
  }, [scene, initialPosition]);

  return (
    <group 
      ref={(group) => {
        if (group) {
          // ballRef için özel bir işleyici kullan
          const mutableRef = ballRef as { current: THREE.Group | null };
          mutableRef.current = group;

          // Dış ref için tip dönüşümü
          const meshGroup = group as unknown as THREE.Mesh;
          if (typeof ref === 'function') {
            ref(meshGroup);
          } else if (ref) {
            // Dış ref için de özel işleyici
            const mutableExtRef = ref as { current: THREE.Mesh | null };
            mutableExtRef.current = meshGroup;
          }
        }
      }}
      position={initialPosition}
      scale={[0.22,0.22,0.22]}
    >
      {/* Boş group - scene useEffect'te eklenecek */}
    </group>
  );
});

export default Ball;
