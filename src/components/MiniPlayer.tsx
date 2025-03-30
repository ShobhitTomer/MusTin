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
  position: fixed;
  /* Position it above the navbar, leaving the navbar visible at the bottom */
  bottom: 60px;
  left: 0;
  right: 0;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 95;
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

const MinimizeButton = styled(ControlButton)`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;

  &:before {
    content: "Minimize";
    position: absolute;
    font-size: 10px;
    bottom: -15px;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }
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

const PlayerTypeIndicator = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  font-size: 12px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  opacity: 0.8;
`;

interface MiniPlayerProps {
  playerType: "discover" | "playlist";
  onClose: () => void;
  onMinimize: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ playerType }) => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    playNext,
    playPrevious,
    seekTo,
    activePlayer,
    setActivePlayer,
    setSongChangeSource,
  } = useAudio();

  const [expanded, setExpanded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // Check if this player is the active one
  const isActivePlayer = activePlayer === playerType;
  const relevantSong = currentSong && isActivePlayer ? currentSong : null;

  if (!relevantSong) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  //   const handleMinimizeClick = () => {
  //     // Make X button shrink the player - both X and chevron do the same thing now
  //     setExpanded(false);
  //     onMinimize();
  //   };

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

  // Handle playNext with flag to indicate it came from the miniplayer
  const handlePlayNext = () => {
    // Set the source of song change to miniplayer so cards can sync
    setSongChangeSource("miniplayer");
    playNext();
  };

  // Handle playPrevious with flag to indicate it came from the miniplayer
  const handlePlayPrevious = () => {
    // Set the source of song change to miniplayer so cards can sync
    setSongChangeSource("miniplayer");
    playPrevious();
  };

  const playerTypeLabel = playerType === "discover" ? "Discover" : "Playlist";

  // Set the active player when user interacts with this miniplayer
  const handlePlayerInteraction = () => {
    setActivePlayer(playerType);
  };

  return (
    <PlayerContainer
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onClick={handlePlayerInteraction}
    >
      <AnimatePresence>
        {expanded && (
          <ExpandedPlayer
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PlayerTypeIndicator>{playerTypeLabel}</PlayerTypeIndicator>

            <MinimizeButton onClick={handleExpandClick}>
              <FaTimes size={16} />
            </MinimizeButton>

            <ExpandedAlbumArt imageUrl={relevantSong.coverUrl} />

            <ExpandedInfo>
              <ExpandedTitle>{relevantSong.title}</ExpandedTitle>
              <ExpandedArtist>{relevantSong.artist}</ExpandedArtist>
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
              <ControlButton
                onClick={handlePlayPrevious}
                whileTap={{ scale: 0.9 }}
              >
                <FaBackward size={24} />
              </ControlButton>

              <PlayPauseButton
                onClick={togglePlay}
                whileTap={{ scale: 0.9 }}
                style={{ width: 60, height: 60 }}
              >
                {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
              </PlayPauseButton>

              <ControlButton onClick={handlePlayNext} whileTap={{ scale: 0.9 }}>
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
        <MiniAlbumArt imageUrl={relevantSong.coverUrl} />

        <MiniSongInfo>
          <MiniTitle>{relevantSong.title}</MiniTitle>
          <MiniArtist>{relevantSong.artist}</MiniArtist>
        </MiniSongInfo>

        <ControlButton onClick={handlePlayPrevious} whileTap={{ scale: 0.9 }}>
          <FaBackward size={16} />
        </ControlButton>

        <PlayPauseButton onClick={togglePlay} whileTap={{ scale: 0.9 }}>
          {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
        </PlayPauseButton>

        <ControlButton onClick={handlePlayNext} whileTap={{ scale: 0.9 }}>
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
