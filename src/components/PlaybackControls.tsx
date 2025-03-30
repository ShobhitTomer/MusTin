import React from "react";
import styled from "styled-components";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaRandom,
  FaRedo,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useAudio } from "../context/AudioContext";

const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
`;

const ControlButton = styled(motion.button)`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;

  &:active {
    transform: scale(0.9);
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
  }
`;

const PlayButton = styled(ControlButton)`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  box-shadow: 0 4px 10px rgba(250, 88, 106, 0.3);

  &:active {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: scale(0.95);
    box-shadow: 0 2px 5px rgba(250, 88, 106, 0.2);
  }
`;

const ActiveIndicator = styled.div<{ active: boolean }>`
  color: ${(props) =>
    props.active ? props.theme.colors.primary : "rgba(255, 255, 255, 0.8)"};
  position: relative;
`;

const PlaybackControls: React.FC = () => {
  const {
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    isShuffling,
    toggleShuffle,
    repeat,
    toggleRepeat,
  } = useAudio();

  const getRepeatIcon = () => {
    switch (repeat) {
      case "one":
        return (
          <ActiveIndicator active={true}>
            <FaRedo size={18} />
            <span
              style={{
                fontSize: "10px",
                position: "absolute",
                margin: "-5px 0 0 3px",
              }}
            >
              1
            </span>
          </ActiveIndicator>
        );
      case "all":
        return (
          <ActiveIndicator active={true}>
            <FaRedo size={18} />
          </ActiveIndicator>
        );
      default:
        return (
          <ActiveIndicator active={false}>
            <FaRedo size={18} />
          </ActiveIndicator>
        );
    }
  };

  return (
    <ControlsContainer>
      <ControlButton onClick={toggleShuffle} whileTap={{ scale: 0.9 }}>
        <ActiveIndicator active={isShuffling}>
          <FaRandom size={18} />
        </ActiveIndicator>
      </ControlButton>

      <ControlButton onClick={playPrevious} whileTap={{ scale: 0.9 }}>
        <FaStepBackward size={22} />
      </ControlButton>

      <PlayButton onClick={togglePlay} whileTap={{ scale: 0.95 }}>
        {isPlaying ? <FaPause size={28} /> : <FaPlay size={28} />}
      </PlayButton>

      <ControlButton onClick={playNext} whileTap={{ scale: 0.9 }}>
        <FaStepForward size={22} />
      </ControlButton>

      <ControlButton onClick={toggleRepeat} whileTap={{ scale: 0.9 }}>
        {getRepeatIcon()}
      </ControlButton>
    </ControlsContainer>
  );
};

export default PlaybackControls;
