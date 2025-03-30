import React, { useState } from "react";
import styled from "styled-components";
import { FaVolumeUp, FaVolumeDown, FaVolumeMute } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAudio } from "../context/AudioContext";

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 160px;
  position: relative;
  padding: 8px;
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.2);
`;

const VolumeIcon = styled(motion.div)`
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 50%;

  &:active {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const VolumeBarWrapper = styled.div`
  flex: 1;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  overflow: visible;
`;

const VolumeBar = styled.div<{ width: string }>`
  height: 100%;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.primaryLight}
  );
  border-radius: 2px;
  width: ${(props) => props.width};
  transition: width 0.1s linear;
`;

const VolumeHandle = styled(motion.div)<{ active: boolean }>`
  width: 14px;
  height: 14px;
  background-color: #fff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  right: -7px;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  opacity: ${(props) => (props.active ? 1 : 0)};
  transition: opacity 0.2s, background-color 0.2s;

  &:active {
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

const VolumeLabel = styled.div<{ visible: boolean }>`
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  transition: opacity 0.2s;
`;

const VolumeControl: React.FC = () => {
  const { volume, setVolume } = useAudio();
  const [isActive, setIsActive] = useState(false);
  const [showVolumeLabel, setShowVolumeLabel] = useState(false);

  const volumeBarRef = React.useRef<HTMLDivElement>(null);

  const handleVolumeIconClick = () => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(0.7);
    }
  };

  // Handle touch and mouse events for volume control
  const handleInteractionStart = (clientX: number) => {
    setIsActive(true);
    handleVolumeChange(clientX);
  };

  const handleInteractionMove = (clientX: number) => {
    if (isActive && volumeBarRef.current) {
      handleVolumeChange(clientX);
    }
  };

  const handleInteractionEnd = () => {
    setIsActive(false);
    setTimeout(() => setShowVolumeLabel(false), 1000);
  };

  const handleVolumeChange = (clientX: number) => {
    if (!volumeBarRef.current) return;

    const rect = volumeBarRef.current.getBoundingClientRect();
    const clickPositionX = clientX - rect.left;
    const volumeBarWidth = rect.width;
    const percentage = Math.max(
      0,
      Math.min(1, clickPositionX / volumeBarWidth)
    );

    setVolume(percentage);
    setShowVolumeLabel(true);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleInteractionStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleInteractionMove(e.touches[0].clientX);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteractionStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleInteractionMove(e.clientX);
  };

  React.useEffect(() => {
    // Add global event listeners for mouse up to ensure proper behavior
    const handleGlobalMouseUp = () => {
      handleInteractionEnd();
    };

    // Add global event listeners for touch end to ensure proper behavior
    const handleGlobalTouchEnd = () => {
      handleInteractionEnd();
    };

    if (isActive) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("touchend", handleGlobalTouchEnd);
    }

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isActive]);

  const getVolumeIcon = () => {
    if (volume === 0) return <FaVolumeMute size={16} />;
    if (volume < 0.5) return <FaVolumeDown size={16} />;
    return <FaVolumeUp size={16} />;
  };

  return (
    <VolumeContainer>
      <VolumeIcon onClick={handleVolumeIconClick} whileTap={{ scale: 0.9 }}>
        {getVolumeIcon()}
      </VolumeIcon>

      <VolumeBarWrapper
        ref={volumeBarRef}
        onMouseDown={handleMouseDown}
        onMouseMove={isActive ? handleMouseMove : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <VolumeLabel visible={showVolumeLabel}>
          {Math.round(volume * 100)}%
        </VolumeLabel>
        <VolumeBar width={`${volume * 100}%`}>
          <VolumeHandle
            active={isActive || showVolumeLabel}
            whileTap={{ scale: 0.9 }}
          />
        </VolumeBar>
      </VolumeBarWrapper>
    </VolumeContainer>
  );
};

export default VolumeControl;
