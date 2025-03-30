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
  padding-bottom: env(safe-area-inset-bottom, 0);
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
  -webkit-tap-highlight-color: transparent;

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

const ExpandedPlayer = styled(motion.div)`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
`;

const ExpandedAlbumArt = styled.div<{ imageUrl: string }>`
  width: 220px;
  height: 220px;
  border-radius: 12px;
  background-image: url(${(props) => props.imageUrl});
  background-size: cover;
  background-position: center;
  margin: 20px 0;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const ExpandedInfo = styled.div`
  text-align: center;
  margin-bottom: 20px;
  width: 100%;
`;

const ExpandedTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
`;

const ExpandedArtist = styled.h3`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;
  width: 100%;
`;

const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
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
    seekTo,
  } = useAudio();

  const [expanded, setExpanded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Format time display (mm:ss)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle seeking on the progress bar in expanded view
  const handleSeek = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isSeeking) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();

    // Get the x position from either mouse or touch event
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;

    const clickPosition = clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = duration * percentage;

    seekTo(Math.max(0, Math.min(newTime, duration)));
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
          <ExpandedPlayer
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CloseButton onClick={onClose}>
              <FaTimes size={16} />
            </CloseButton>

            <ExpandedAlbumArt imageUrl={currentSong.coverUrl} />

            <ExpandedInfo>
              <ExpandedTitle>{currentSong.title}</ExpandedTitle>
              <ExpandedArtist>{currentSong.artist}</ExpandedArtist>
            </ExpandedInfo>

            <div
              style={{ width: "100%", padding: "0 10px", marginBottom: "10px" }}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              onMouseLeave={() => setIsSeeking(false)}
              onMouseMove={handleSeek}
              onTouchStart={() => setIsSeeking(true)}
              onTouchEnd={() => setIsSeeking(false)}
              onTouchMove={handleSeek}
            >
              <ProgressBar style={{ height: "6px", borderRadius: "3px" }}>
                <Progress width={`${progressPercentage}%`} />
              </ProgressBar>
              <TimeInfo>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </TimeInfo>
            </div>

            <ControlsRow>
              <ControlButton onClick={playPrevious} whileTap={{ scale: 0.9 }}>
                <FaBackward size={24} />
              </ControlButton>

              <PlayPauseButton
                onClick={togglePlay}
                whileTap={{ scale: 0.9 }}
                style={{ width: 60, height: 60 }}
              >
                {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
              </PlayPauseButton>

              <ControlButton onClick={playNext} whileTap={{ scale: 0.9 }}>
                <FaForward size={24} />
              </ControlButton>
            </ControlsRow>
          </ExpandedPlayer>
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
