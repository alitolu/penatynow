import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Difficulty } from '../constants/gameConstants';

const BackgroundAnimation = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/textures/stadium.webp') no-repeat center center fixed;
  background-size: cover;
  z-index: -1;
  filter: brightness(0.7) blur(2px);
`;

const MenuContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  backdrop-filter: blur(10px);
  background: rgba(18, 18, 18, 0.6);
  color: var(--text-primary);
  text-align: center;
`;

const difficulties = [
  { 
    level: 'easy', 
    label: 'Kolay Mod', 
    description: 'Başlangıç seviyesi',
    color: 'var(--primary-light)',
    icon: '⚽️'
  },
  { 
    level: 'medium', 
    label: 'Orta Mod', 
    description: 'Dengeli zorluk',
    color: 'var(--secondary-color)',
    icon: '🥅'
  },
  { 
    level: 'hard', 
    label: 'Zor Mod', 
    description: 'Profesyonel seviye',
    color: 'var(--secondary-dark)',
    icon: '🏆'
  }
];

const Title = styled(motion.h1)`
  font-size: var(--font-size-huge);
  margin-bottom: var(--spacing-xl);
  text-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const MenuButton = styled(motion.button)<{ $color?: string, $selected?: boolean }>`
  background-color: ${props => props.$selected 
    ? props.$color 
    : 'var(--background-layer-1)'};
  border: 2px solid ${props => props.$color || 'var(--border-light)'};
  color: ${props => props.$selected ? 'var(--text-dark)' : 'var(--text-light)'};
  padding: var(--spacing-lg) var(--spacing-xxl);
  margin: var(--spacing-md);
  font-size: var(--font-size-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '${props => props.$selected ? '✓' : ''}';
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    font-size: var(--font-size-md);
    opacity: ${props => props.$selected ? 1 : 0};
    transition: opacity var(--transition-base);
  }

  &:hover {
    background-color: ${props => props.$color || 'var(--background-hover)'};
    color: var(--text-dark);
    transform: scale(1.05);
  }
`;

interface MainMenuProps {
  onStartGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onSettings: () => void;
  onClose?: () => void;
  onOpenCameraSettings?: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartGame, 
  onSettings, 
  onClose,
  onOpenCameraSettings 
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty>('medium');

  const buttonVariants = {
    initial: { opacity: 0, y: 50, scale: 0.8 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
    },
    tap: { scale: 0.95 }
  };

  return (
    <>
      <BackgroundAnimation 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <MenuContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Title
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Penaltı Oyunu 🥏
        </Title>

        <motion.div>
          {difficulties.map((diff) => (
            <MenuButton
              key={diff.level}
              $color={diff.color}
              $selected={selectedDifficulty === diff.level}
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              onClick={() => {
                setSelectedDifficulty(diff.level as 'easy' | 'medium' | 'hard');
                onStartGame(diff.level as 'easy' | 'medium' | 'hard');
              }}
            >
              <div style={{ 
                fontSize: '2rem', 
                marginBottom: 'var(--spacing-sm)' 
              }}>
                {diff.icon}
              </div>
              {diff.label}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                style={{ 
                  fontSize: 'var(--font-size-xs)', 
                  marginTop: 'var(--spacing-xs)' 
                }}
              >
                {diff.description}
              </motion.div>
            </MenuButton>
          ))}

          <MenuButton
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            onClick={onSettings}
          >
            ⚙️ Ayarlar
          </MenuButton>

          {onClose && (
            <MenuButton
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              onClick={onClose}
            >
              Kapat
            </MenuButton>
          )}

          {onOpenCameraSettings && (
            <MenuButton
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              onClick={onOpenCameraSettings}
            >
              Kamera Ayarları
            </MenuButton>
          )}
        </motion.div>
      </MenuContainer>
    </>
  );
};

export default MainMenu;