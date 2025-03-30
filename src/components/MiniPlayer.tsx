import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaChevronUp,
  FaChevronDown,
  FaForward,
  FaBackward,
  FaTimes,
} from "react-icons/fa";
import { useAudio } from "../context/AudioContext";

const PlayerContainer = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 100;
`;

const MiniPlayerBar = styled.div`
  height: 65px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
`;

const MiniAlbumArt = styled.div<{ imageUrl: string }>`
  width: 45px;
  height: 45px;
  border-radius: 8px;
  background-image: url(${(props) => props.imageUrl});
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const MiniSongInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MiniTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MiniArtist = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ControlButton = styled(motion.button)`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:active {
    color: #fff;
  }
`;

const PlayPauseButton = styled(ControlButton)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;

  &:active {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ProgressBar = styled.div`
  height: 3px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  overflow: hidden;
`;

const Progress = styled.div<{ width: string }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  width: ${(props) => props.width};
  transition: width 0.2s linear;
`;

const PlayerHandle = styled.div`
  width: 36px;
  height: 5px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin: 10px auto 5px;
`;

const CloseButton = styled(ControlButton)`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
`;

interface MiniPlayerProps {
  onClose: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onClose }) => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    playNext,
    playPrevious,
  } = useAudio();
  const [expanded, setExpanded] = useState(false);

  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <PlayerContainer
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CloseButton onClick={onClose}>
              <FaTimes size={16} />
            </CloseButton>

            <div style={{ width: 200, height: 200, margin: "20px 0" }}>
              <MiniAlbumArt
                imageUrl={currentSong.coverUrl}
                style={{ width: "100%", height: "100%", borderRadius: 12 }}
              />
            </div>

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <MiniTitle style={{ fontSize: 20, marginBottom: 8 }}>
                {currentSong.title}
              </MiniTitle>
              <MiniArtist style={{ fontSize: 16 }}>
                {currentSong.artist}
              </MiniArtist>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                marginBottom: 20,
                width: "100%",
              }}
            >
              <ControlButton onClick={playPrevious} whileTap={{ scale: 0.9 }}>
                <FaBackward size={20} />
              </ControlButton>

              <PlayPauseButton
                onClick={togglePlay}
                whileTap={{ scale: 0.9 }}
                style={{ width: 50, height: 50 }}
              >
                {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
              </PlayPauseButton>

              <ControlButton onClick={playNext} whileTap={{ scale: 0.9 }}>
                <FaForward size={20} />
              </ControlButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div onClick={handleExpandClick}>
        <PlayerHandle />
      </div>

      <ProgressBar>
        <Progress width={`${progressPercentage}%`} />
      </ProgressBar>

      <MiniPlayerBar>
        <MiniAlbumArt imageUrl={currentSong.coverUrl} />

        <MiniSongInfo>
          <MiniTitle>{currentSong.title}</MiniTitle>
          <MiniArtist>{currentSong.artist}</MiniArtist>
        </MiniSongInfo>

        <ControlButton onClick={playPrevious} whileTap={{ scale: 0.9 }}>
          <FaBackward size={16} />
        </ControlButton>

        <PlayPauseButton onClick={togglePlay} whileTap={{ scale: 0.9 }}>
          {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
        </PlayPauseButton>

        <ControlButton onClick={playNext} whileTap={{ scale: 0.9 }}>
          <FaForward size={16} />
        </ControlButton>

        <ControlButton onClick={handleExpandClick} whileTap={{ scale: 0.9 }}>
          {expanded ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
        </ControlButton>
      </MiniPlayerBar>
    </PlayerContainer>
  );
};

export default MiniPlayer;
