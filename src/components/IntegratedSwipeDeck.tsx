import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaTimes,
  FaMusic,
  FaForward,
  FaBackward,
} from "react-icons/fa";
import { useAudio } from "../context/AudioContext";
import { Song } from "../types/types";

// Styled components remain the same...
const IntegratedContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  touch-action: manipulation;
  padding: 0 20px;
  overflow: hidden;
`;

const CardStack = styled.div`
  position: relative;
  width: 100%;
  max-width: 320px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  margin-top: 20px;
`;

const MiniPlayerContainer = styled.div`
  width: 100%;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin: 20px auto 0;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  max-width: 320px;
`;

const Card = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background-color: #222222;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  touch-action: none;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const AlbumImage = styled.div<{ imageUrl: string }>`
  width: 100%;
  height: 280px;
  background-image: url(${(props) => props.imageUrl});
  background-size: cover;
  background-position: center;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  }
`;

const SongInfo = styled.div`
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const SongTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 4px;
  color: #fff;
`;

const SongArtist = styled.h3`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
`;

const SongAlbum = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 16px 16px;
`;

const ActionButton = styled(motion.button)<{ color?: string }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${(props) => props.color || "rgba(255, 255, 255, 0.1)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  &:active {
    transform: scale(0.95);
  }
`;

const PlayButton = styled(ActionButton)`
  background-color: #fa586a;
  width: 40px;
  height: 40px;
`;

const SwipeIndicator = styled(motion.div)<{ direction: "left" | "right" }>`
  position: absolute;
  top: 20px;
  ${(props) => (props.direction === "left" ? "left: 20px" : "right: 20px")};
  background-color: ${(props) =>
    props.direction === "left"
      ? "rgba(239, 68, 68, 0.9)"
      : "rgba(34, 197, 94, 0.9)"};
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  transform: rotate(
    ${(props) => (props.direction === "left" ? "-12deg" : "12deg")}
  );
  pointer-events: none;
  z-index: 20;
`;

const EmptyDeck = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  height: 100%;
  text-align: center;
  gap: 16px;
  padding: 20px;

  svg {
    font-size: 48px;
    opacity: 0.6;
  }

  h3 {
    font-size: 20px;
    margin-bottom: 8px;
  }

  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.5);
  }
`;

// MiniPlayer Components
const MiniPlayerControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
`;

const MiniAlbumArt = styled.div<{ imageUrl: string }>`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background-image: url(${(props) => props.imageUrl});
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const MiniSongInfo = styled.div`
  flex: 1;
  padding: 0 12px;
  overflow: hidden;
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

const MiniProgressBar = styled.div`
  height: 4px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 10px;
`;

const MiniProgress = styled.div<{ width: string }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  width: ${(props) => props.width};
  transition: width 0.2s linear;
`;

const MiniControlButton = styled.button`
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

const MiniPlayPauseButton = styled(MiniControlButton)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;

  &:active {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

interface IntegratedSwipeDeckProps {
  playlistSongIds: number[];
  onAdd: (songId: number) => void;
  onPlay: (songId: number) => void;
}

const IntegratedSwipeDeck: React.FC<IntegratedSwipeDeckProps> = ({
  playlistSongIds,
  onAdd,
  onPlay,
}) => {
  const {
    songsList,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    currentTime,
    duration,
    activePlayer,
    setActivePlayer,
  } = useAudio();

  // State to hold all songs not in playlist
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);

  // State to track current set of cards (showing 3 at a time for stack effect)
  const [currentStack, setCurrentStack] = useState<Song[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Flag to track if the song change came from the miniplayer
  const miniplayerChangedSong = useRef(false);

  // For tracking swipe direction
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

  // Swipe indicators
  const swipeLeftOpacity = useTransform(x, [-100, -20, 0], [1, 0, 0]);
  const swipeRightOpacity = useTransform(x, [0, 20, 100], [0, 0, 1]);

  // Whenever playlist changes, update available songs
  useEffect(() => {
    // Filter out songs that are already in the playlist
    const filteredSongs = songsList.filter(
      (song) => !playlistSongIds.includes(song.id)
    );

    // Preserve the current order when updating available songs
    if (availableSongs.length > 0) {
      // Create a map of the current order
      const currentOrder = new Map();
      availableSongs.forEach((song, index) => {
        currentOrder.set(song.id, index);
      });

      // Sort the filtered songs to preserve the current order
      const newAvailableSongs = [...filteredSongs].sort((a, b) => {
        const aIndex = currentOrder.has(a.id)
          ? currentOrder.get(a.id)
          : Infinity;
        const bIndex = currentOrder.has(b.id)
          ? currentOrder.get(b.id)
          : Infinity;

        if (aIndex === Infinity && bIndex === Infinity) {
          // Both are new songs, keep them in their original order
          return 0;
        }

        return aIndex - bIndex;
      });

      setAvailableSongs(newAvailableSongs);
    } else {
      // Initial load
      setAvailableSongs(filteredSongs);
    }
  }, [songsList, playlistSongIds]);

  // Initialize the stack whenever available songs change
  useEffect(() => {
    if (availableSongs.length > 0) {
      // Take first 3 songs (or fewer if less available) for initial stack
      setCurrentStack(
        availableSongs.slice(0, Math.min(3, availableSongs.length))
      );
    } else {
      setCurrentStack([]);
    }
  }, [availableSongs]);

  // Sync the current song with the top card when playNext/playPrevious is called
  useEffect(() => {
    if (!currentSong || activePlayer !== "discover" || isAnimating) return;

    // If the current playing song doesn't match the top card, update the stack
    if (currentStack.length > 0 && currentStack[0].id !== currentSong.id) {
      // Find the song in the available songs
      const songIndex = availableSongs.findIndex(
        (song) => song.id === currentSong.id
      );

      if (songIndex !== -1) {
        // Only animate the card change if it was triggered by the miniplayer
        if (miniplayerChangedSong.current) {
          // If we're moving to the next song, animate the current card swiping left
          const currentCard = document.getElementById(
            `card-${currentStack[0].id}`
          );
          if (currentCard) {
            currentCard.animate(
              [
                { transform: "translateX(0) rotate(0deg)" },
                { transform: "translateX(-400px) rotate(-5deg)" },
              ],
              {
                duration: 400,
                easing: "ease-out",
                fill: "forwards",
              }
            );

            // Wait for animation to complete
            setTimeout(() => {
              // Create a new stack with the current song at the top
              const newStack = [
                availableSongs[songIndex],
                ...availableSongs.slice(songIndex + 1, songIndex + 3),
              ].slice(0, 3);

              setCurrentStack(newStack);
              miniplayerChangedSong.current = false;
            }, 400);
          }
        } else {
          // If not triggered by miniplayer, just update the stack without animation
          // Create a new stack with the current song at the top
          const newStack = [
            availableSongs[songIndex],
            ...availableSongs.slice(songIndex + 1, songIndex + 3),
          ].slice(0, 3);

          setCurrentStack(newStack);
        }
      }
    }
  }, [currentSong, activePlayer, availableSongs, currentStack, isAnimating]);

  // Pass on a song (move to end of queue) implementation
  const passSong = useCallback((songId: number) => {
    setAvailableSongs((prev) => {
      // Find the index of the song to move
      const songIndex = prev.findIndex((song) => song.id === songId);
      if (songIndex === -1) return prev; // Song not found

      // Create a new array with the song moved to the end
      const newAvailableSongs = [...prev];
      const [songToMove] = newAvailableSongs.splice(songIndex, 1);
      newAvailableSongs.push(songToMove);

      return newAvailableSongs;
    });
  }, []);

  // Move to next card - now uses passSong for left swipe
  const handleNextCard = (isAddToPlaylist: boolean, currentSongId: number) => {
    if (currentStack.length === 0) return;

    // If not adding to playlist, move to end of available songs
    if (!isAddToPlaylist) {
      passSong(currentSongId);
    }

    // Update current stack by removing the top card
    setCurrentStack((prev) => {
      if (prev.length <= 1) return []; // No more cards

      // Remove the top card and find next card not in stack
      const nextStack = prev.slice(1);

      // If we need to add another card to keep 3 in stack
      if (nextStack.length < 3) {
        // Find a song that's not already in the stack
        const nextSong = availableSongs.find(
          (song) => !nextStack.some((stackSong) => stackSong.id === song.id)
        );

        if (nextSong) {
          return [...nextStack, nextSong];
        }
      }

      return nextStack;
    });
  };

  // Simple, smooth animation for button actions
  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStack.length || isAnimating) return;

    const currentSong = currentStack[0];
    setIsAnimating(true);

    // Use Web Animation API
    const card = document.getElementById(`card-${currentSong.id}`);
    if (card) {
      card.animate(
        [
          { transform: "translateX(0) rotate(0deg)" },
          { transform: "translateX(-400px) rotate(-5deg)" },
        ],
        {
          duration: 400,
          easing: "ease-out",
          fill: "forwards",
        }
      );
    }

    // Change song in miniplayer if this is the active player
    if (activePlayer === "discover") {
      playNext();
    }

    // Wait for animation to complete
    setTimeout(() => {
      handleNextCard(false, currentSong.id);
      setIsAnimating(false);
    }, 400);
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStack.length || isAnimating) return;

    const currentSong = currentStack[0];
    setIsAnimating(true);

    // Use Web Animation API
    const card = document.getElementById(`card-${currentSong.id}`);
    if (card) {
      card.animate(
        [
          { transform: "translateX(0) rotate(0deg)" },
          { transform: "translateX(400px) rotate(5deg)" },
        ],
        {
          duration: 400,
          easing: "ease-out",
          fill: "forwards",
        }
      );
    }

    // Change song in miniplayer if this is the active player
    if (activePlayer === "discover") {
      playNext();
    }

    // Wait for animation to complete
    setTimeout(() => {
      onAdd(currentSong.id);
      handleNextCard(true, currentSong.id);
      setIsAnimating(false);
    }, 400);
  };

  // Handle swipe end
  const handleDragEnd = (info: PanInfo) => {
    if (!currentStack.length || isAnimating) return;

    const currentSong = currentStack[0];
    setIsAnimating(true);

    // Make swiping more responsive with faster velocity detection
    const swipeThreshold = 80;
    const velocityThreshold = 0.5;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swipe right - add to playlist
      // Also change song in miniplayer if this is the active player
      if (activePlayer === "discover") {
        playNext();
      }

      onAdd(currentSong.id);
      handleNextCard(true, currentSong.id);
    } else if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      // Swipe left - discard
      // Also change song in miniplayer if this is the active player
      if (activePlayer === "discover") {
        playNext();
      }

      handleNextCard(false, currentSong.id);
    } else {
      // Return to center if not swiped far enough
      x.set(0);
    }

    // Reset after animation
    setTimeout(() => {
      x.set(0);
      setIsAnimating(false);
    }, 200);
  };

  // Handle play button click
  const handlePlay = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card swipe when clicking play
    setActivePlayer("discover");
    playSong(song);
    onPlay(song.id);
  };

  const handleMiniPlayerPlayNext = () => {
    // Set the flag to indicate the change is coming from the miniplayer
    miniplayerChangedSong.current = true;
    playNext();
    // The UI will sync automatically with the currentSong via the useEffect above
  };

  const handleMiniPlayerPlayPrevious = () => {
    // Set the flag to indicate the change is coming from the miniplayer
    miniplayerChangedSong.current = true;
    playPrevious();
    // The UI will sync automatically with the currentSong via the useEffect above
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <IntegratedContainer>
      <CardStack>
        {currentStack.length === 0 ? (
          <EmptyDeck>
            <FaMusic />
            <h3>No More Songs</h3>
            <p>
              You've gone through all available songs. Check out your playlist
              or come back later for more.
            </p>
          </EmptyDeck>
        ) : (
          currentStack.map((song, index) => {
            // Only make the top card draggable
            const isDraggable = index === 0;

            return (
              <Card
                key={song.id}
                id={`card-${song.id}`}
                style={{
                  zIndex: currentStack.length - index,
                  scale: 1 - index * 0.05, // Stack effect
                  y: index * 10, // Stack effect
                  ...(isDraggable ? { x, rotate } : {}),
                }}
                drag={isDraggable && !isAnimating ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.9}
                onDragEnd={(_, info) => isDraggable && handleDragEnd(info)}
                initial={index === 0 ? { scale: 0.8, opacity: 0 } : false}
                animate={index === 0 ? { scale: 1, opacity: 1 } : {}}
                exit={index === 0 ? { x: -300, opacity: 0 } : {}}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {isDraggable && (
                  <>
                    <SwipeIndicator
                      direction="left"
                      style={{ opacity: swipeLeftOpacity }}
                    >
                      PASS
                    </SwipeIndicator>
                    <SwipeIndicator
                      direction="right"
                      style={{ opacity: swipeRightOpacity }}
                    >
                      ADD
                    </SwipeIndicator>
                  </>
                )}

                <AlbumImage imageUrl={song.coverUrl} />
                <SongInfo>
                  <SongTitle>{song.title}</SongTitle>
                  <SongArtist>{song.artist}</SongArtist>
                  <SongAlbum>Album: {song.album}</SongAlbum>
                </SongInfo>

                {isDraggable && (
                  <ActionButtons>
                    <ActionButton
                      onClick={handleDiscard}
                      color="#EF4444"
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTimes size={20} />
                    </ActionButton>

                    <PlayButton
                      onClick={(e) => handlePlay(song, e)}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaPlay size={18} />
                    </PlayButton>

                    <ActionButton
                      onClick={handleAddToPlaylist}
                      color="#22C55E"
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaHeart size={20} />
                    </ActionButton>
                  </ActionButtons>
                )}
              </Card>
            );
          })
        )}
      </CardStack>

      {/* Always visible MiniPlayer */}
      <MiniPlayerContainer>
        <MiniPlayerControls>
          <MiniAlbumArt
            imageUrl={currentSong?.coverUrl || "/default-album.jpg"}
          />
          <MiniSongInfo>
            <MiniTitle>{currentSong?.title || "No song playing"}</MiniTitle>
            <MiniArtist>{currentSong?.artist || ""}</MiniArtist>
          </MiniSongInfo>
          <MiniControlButton
            onClick={() => {
              setActivePlayer("discover");
              handleMiniPlayerPlayPrevious();
            }}
          >
            <FaBackward size={16} />
          </MiniControlButton>
          <MiniPlayPauseButton
            onClick={() => {
              setActivePlayer("discover");
              togglePlay();
            }}
          >
            {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
          </MiniPlayPauseButton>
          <MiniControlButton
            onClick={() => {
              setActivePlayer("discover");
              handleMiniPlayerPlayNext();
            }}
          >
            <FaForward size={16} />
          </MiniControlButton>
        </MiniPlayerControls>
        <MiniProgressBar>
          <MiniProgress width={`${progressPercentage}%`} />
        </MiniProgressBar>
      </MiniPlayerContainer>
    </IntegratedContainer>
  );
};

export default IntegratedSwipeDeck;
