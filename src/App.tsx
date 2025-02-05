import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Game from './components/Game';
import MainMenu from './components/MainMenu';
import SettingsMenu from './components/SettingsMenu';
import GameMenu from './components/GameMenu';

type GameState = 'menu' | 'game' | 'settings';
type Difficulty = 'easy' | 'medium' | 'hard';

const AnimatedWrapper: React.FC<{ children: React.ReactNode, key: string }> = ({ children, key }) => (
  <motion.div
    key={key}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isCameraConfigVisible, setIsCameraConfigVisible] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    sound: 50,
    music: 50,
    graphics: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleStartGame = useCallback((selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState('game');
  }, []);

  const handleGameOver = useCallback((winner: 'player' | 'goalkeeper') => {
    setGameState('menu');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setGameState('settings');
  }, []);

  const handleCloseSettings = useCallback(() => {
    setGameState('menu');
  }, []);

  const handleSettingsChange = useCallback((settings: {
    sound: number;
    music: number;
    graphics: 'low' | 'medium' | 'high';
  }) => {
    setGameSettings(settings);
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      overflow: 'hidden' 
    }}>
      {gameState === 'menu' && (
        <AnimatedWrapper key="main-menu">
          <MainMenu 
            onStartGame={(difficulty: Difficulty) => {
              handleStartGame(difficulty);
            }}
            onSettings={handleOpenSettings}
            onClose={() => {}}
          />
        </AnimatedWrapper>
      )}

      {isGameMenuOpen && (
        <AnimatedWrapper key="game-menu">
          <GameMenu 
            onClose={() => setIsGameMenuOpen(false)}
            onStartGame={() => {
              setIsGameMenuOpen(false);
              handleStartGame('medium'); // Varsayılan zorluk seviyesi
            }}
            onSettings={handleOpenSettings}
            onOpenCameraSettings={() => {
              setIsGameMenuOpen(false);
              setIsCameraConfigVisible(true);
            }}
          />
        </AnimatedWrapper>
      )}
      
      {gameState === 'game' && (
        <AnimatedWrapper key="game">
          <Game />
        </AnimatedWrapper>
      )}
      
      {isCameraConfigVisible && (
        <AnimatedWrapper key="camera-config">
          <SettingsMenu 
            onClose={() => setIsCameraConfigVisible(false)}
            initialSettings={gameSettings}
            onSettingsChange={handleSettingsChange}
          />
        </AnimatedWrapper>
      )}

      {gameState === 'settings' && (
        <AnimatedWrapper key="settings-menu">
          <SettingsMenu 
            onClose={handleCloseSettings}
            initialSettings={gameSettings}
            onSettingsChange={handleSettingsChange}
          />
        </AnimatedWrapper>
      )}
    </div>
  );
};

export default App;
