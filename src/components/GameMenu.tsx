import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './GameMenu.css';

interface GameMenuProps {
  onClose: () => void;
  onStartGame: () => void;
  onSettings: () => void;
  onOpenCameraSettings: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ 
  onClose, 
  onStartGame, 
  onSettings, 
  onOpenCameraSettings 
}) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showInstructions, setShowInstructions] = useState(false);

  const handleDifficultyChange = (level: 'easy' | 'medium' | 'hard') => {
    setDifficulty(level);
  };

  const levelLabels = {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor'
  };

  const instructions = [
    'Güç ayarla',
    'Açı seç',
    'Şut çek'
  ];

  const renderDifficultyButton = (level: 'easy' | 'medium' | 'hard') => {
    return (
      <button 
        key={level}
        onClick={() => handleDifficultyChange(level)}
        className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
        style={{ 
          backgroundColor: difficulty === level ? '#2ecc71' : 'rgba(255, 255, 255, 0.2)',
          color: difficulty === level ? 'white' : 'black',
          padding: '10px 20px',
          margin: '0 10px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        {levelLabels[level]}
      </button>
    );
  };

  const renderInstructions = () => {
    return (
      <div 
        className="instructions-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          textAlign: 'center',
          zIndex: 100
        }}
      >
        <h2>Oyun Talimatları</h2>
        <p>Kalecinin yanından gol atmaya çalış!</p>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ul>
        <button 
          onClick={() => setShowInstructions(false)}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            marginTop: '20px',
            cursor: 'pointer'
          }}
        >
          Anladım
        </button>
      </div>
    );
  };

  return (
    <div 
      className="game-menu"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        color: 'white'
      }}
    >
      <div className="logo-container">
        <img src="/textures/logo.png" alt="PenaltyNow Logo" className="logo" />
        <h1>Penalty<span>Now</span></h1>
      </div>

      <div 
        className="menu-buttons"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}
      >
        <button 
          onClick={onStartGame}
          style={{
            backgroundColor: '#2ecc71',
            color: 'white',
            padding: '15px 50px',
            fontSize: '1.2rem',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          Oyuna Başla
        </button>

        <div className="difficulty-selector">
          <h3>Zorluk Seviyesi</h3>
          <div>
            {renderDifficultyButton('easy')}
            {renderDifficultyButton('medium')}
            {renderDifficultyButton('hard')}
          </div>
        </div>

        <button 
          onClick={() => setShowInstructions(true)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '10px 30px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Nasıl Oynanır?
        </button>

        <button 
          onClick={onSettings}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '10px 30px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Ayarlar
        </button>
      
      </div>

      {showInstructions && renderInstructions()}

      <div className="background-ball">
        <img src="/textures/ball.png" alt="Football" />
      </div>
    </div>
  );
};

GameMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
  onStartGame: PropTypes.func.isRequired,
  onSettings: PropTypes.func.isRequired,
  onOpenCameraSettings: PropTypes.func.isRequired,
};

export default GameMenu;
