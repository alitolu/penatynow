import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SettingsMenuProps {
  onClose: () => void;
  initialSettings?: {
    sound: number;
    music: number;
    graphics: 'low' | 'medium' | 'high';
  };
  onSettingsChange?: (settings: {
    sound: number;
    music: number;
    graphics: 'low' | 'medium' | 'high';
  }) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
  onClose, 
  initialSettings = {
    sound: 50,
    music: 50,
    graphics: 'medium'
  },
  onSettingsChange 
}) => {
  const [settings, setSettings] = useState({
    sound: initialSettings.sound,
    music: initialSettings.music,
    graphics: initialSettings.graphics
  });

  const handleSettingChange = (key: keyof typeof settings, value: number | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const menuVariants = {
    hidden: { opacity: 0, x: '-100%' },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: 'spring',
        stiffness: 120,
        damping: 15
      }
    },
    exit: { 
      opacity: 0, 
      x: '100%',
      transition: { duration: 0.3 }
    }
  };

  const renderSlider = (
    label: string, 
    value: number, 
    onChange: (val: number) => void
  ) => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      marginBottom: '1rem',
      width: '100%'
    }}>
      <label style={{ 
        flex: 1, 
        marginRight: '1rem',
        fontSize: '1.1rem'
      }}>
        {label}
      </label>
      <input 
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          flex: 2,
          accentColor: '#3498db'
        }}
      />
      <span style={{ 
        marginLeft: '1rem',
        width: '50px',
        textAlign: 'right'
      }}>
        {value}%
      </span>
    </div>
  );

  return (
    <motion.div 
      className="settings-menu"
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        zIndex: 1000,
        padding: '2rem'
      }}
    >
      <h1 style={{ 
        fontSize: '3rem', 
        marginBottom: '2rem',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        Oyun Ayarları
      </h1>

      <div style={{ 
        width: '80%', 
        maxWidth: '600px' 
      }}>
        {renderSlider(
          'Ses Efektleri', 
          settings.sound, 
          (val) => handleSettingChange('sound', val)
        )}

        {renderSlider(
          'Müzik', 
          settings.music, 
          (val) => handleSettingChange('music', val)
        )}

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '1rem',
          width: '100%'
        }}>
          <label style={{ 
            flex: 1, 
            marginRight: '1rem',
            fontSize: '1.1rem'
          }}>
            Grafik Kalitesi
          </label>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            flex: 2 
          }}>
            {(['low', 'medium', 'high'] as const).map((quality) => (
              <motion.button
                key={quality}
                onClick={() => handleSettingChange('graphics', quality)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: settings.graphics === quality 
                    ? '#3498db' 
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {quality === 'low' ? 'Düşük' : 
                 quality === 'medium' ? 'Orta' : 'Yüksek'}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '2rem' 
      }}>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '15px 50px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Kaydet
        </motion.button>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '15px 50px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '10px',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          İptal
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SettingsMenu;
