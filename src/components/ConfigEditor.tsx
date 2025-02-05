import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ConfigEditor.css';

export interface GameConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  soundVolume: number;
  graphicsQuality: string;
  controlSensitivity: number;
}

interface ConfigEditorProps {
  initialConfig: GameConfig;
  onConfigUpdate: (config: GameConfig) => void;
  onClose: () => void;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ 
  initialConfig, 
  onConfigUpdate, 
  onClose 
}) => {
  const [config, setConfig] = useState<GameConfig>(initialConfig);

  const handleSave = () => {
    onConfigUpdate(config);
    onClose();
  };

  const updateConfig = (key: keyof GameConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="config-editor">
      <div className="config-container">
        <h2>Oyun Ayarları</h2>
        
        <div className="config-section">
          <label>Zorluk Seviyesi</label>
          <div className="difficulty-buttons">
            {(['easy', 'medium', 'hard'] as const).map(level => (
              <button 
                key={level}
                className={config.difficulty === level ? 'active' : ''}
                onClick={() => updateConfig('difficulty', level)}
              >
                {level === 'easy' ? 'Kolay' : 
                 level === 'medium' ? 'Orta' : 'Zor'}
              </button>
            ))}
          </div>
        </div>

        <div className="config-section">
          <label>Ses Seviyesi</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={config.soundVolume}
            onChange={(e) => updateConfig('soundVolume', Number(e.target.value))}
          />
          <span>{config.soundVolume}%</span>
        </div>

        <div className="config-section">
          <label>Grafik Kalitesi</label>
          <div className="graphics-buttons">
            {(['low', 'medium', 'high'] as const).map(quality => (
              <button 
                key={quality}
                className={config.graphicsQuality === quality ? 'active' : ''}
                onClick={() => updateConfig('graphicsQuality', quality)}
              >
                {quality === 'low' ? 'Düşük' : 
                 quality === 'medium' ? 'Orta' : 'Yüksek'}
              </button>
            ))}
          </div>
        </div>

        <div className="config-section">
          <label>Kontrol Hassasiyeti</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={config.controlSensitivity}
            onChange={(e) => updateConfig('controlSensitivity', Number(e.target.value))}
          />
          <span>{config.controlSensitivity}%</span>
        </div>

        <div className="config-actions">
          <button 
            className="save-button" 
            onClick={handleSave}
          >
            Ayarları Kaydet
          </button>
          <button 
            className="cancel-button" 
            onClick={onClose}
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
};

ConfigEditor.propTypes = {
  initialConfig: PropTypes.shape({
    difficulty: PropTypes.oneOf(['easy', 'medium', 'hard'] as const).isRequired,
    soundVolume: PropTypes.number.isRequired,
    graphicsQuality: PropTypes.oneOf(['low', 'medium', 'high']).isRequired,
    controlSensitivity: PropTypes.number.isRequired
  }).isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ConfigEditor;
