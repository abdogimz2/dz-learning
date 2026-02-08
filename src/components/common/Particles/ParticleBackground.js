import React, { useEffect, useState } from 'react';
import './ParticleBackground.css';

const ParticleBackground = () => {
  const [particles, setParticles] = useState([]);

  // Initialize particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 25 + 5,
      delay: Math.random() * 8,
      duration: Math.random() * 10 + 10,
      opacity: Math.random() * 0.4 + 0.1,
      colorType: Math.floor(Math.random() * 3), // 0: primary, 1: secondary, 2: mix
    }));
    setParticles(newParticles);
  }, []);

  // Color variations based on your brand
  const getParticleColor = (colorType, opacity) => {
    switch(colorType) {
      case 0: // Primary color variations
        return `rgba(58, 38, 168, ${opacity})`; // #3a26a8
      case 1: // Secondary color variations
        return `rgba(3, 107, 237, ${opacity})`; // #036bed
      case 2: // Gradient/mixed colors
        return Math.random() > 0.5 
          ? `rgba(58, 38, 168, ${opacity * 0.8})` 
          : `rgba(3, 107, 237, ${opacity})`;
      default:
        return `rgba(58, 38, 168, ${opacity})`;
    }
  };

  return (
    <div className="particles-container">
      {particles.map((particle) => (
        <div 
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            background: getParticleColor(particle.colorType, particle.opacity),
            boxShadow: `0 0 ${particle.size / 2}px ${particle.size / 4}px ${getParticleColor(particle.colorType, particle.opacity * 0.5)}`,
            filter: `blur(${Math.random() * 2}px)`,
            borderRadius: Math.random() > 0.7 ? '50%' : `${Math.random() * 20}%`,
          }}
        />
      ))}
      
      {/* Large animated background circles */}
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>
      <div className="bg-circle bg-circle-3"></div>
    </div>
  );
};

export default ParticleBackground;