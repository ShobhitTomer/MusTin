import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { FaPlay, FaHeart, FaTimes, FaMusic } from "react-icons/fa";
import { useAudio } from "../context/AudioContext";
import { Song } from "../types/types";

const SwipeDeckContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  position: relative;
  touch-action: manipulation;
`;

const CardStack = styled.div`
  position: relative;
  width: 100%;
  max-width: 320px;
  height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SwipeInstructions = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 5;
  pointer-events: none;
  display: none; /* Hide instructions to save space */
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
  height: 320px;
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
    height: 120px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  }
`;

const SongInfo = styled.div`
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const SongTitle = styled.h2`
  font-size: 20px;
  margin-bottom: 4px;
  color: #fff;
`;

const SongArtist = styled.h3`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
`;

const SongAlbum = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px;
`;

const ActionButton = styled(motion.button)<{ color?: string }>`
  width: 60px;
  height: 60px;
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
  width: 50px;
  height: 50px;
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
  font-size: 18px;
  transform: rotate(
    ${(props) => (props.direction === "left" ? "-12deg" : "12deg")}
  );
  pointer-events: none;
  z-index: 20;
`;

interface SwipeDeckProps {
  playlistSongIds: number[];
  onAdd: (songId: number) => void;
  onPlay: (songId: number) => void;
}

const SwipeDeck: React.FC<SwipeDeckProps> = ({
  playlistSongIds,
  onAdd,
  onPlay,
}) => {
  const { songsList, playSong } = useAudio();

  // State to hold all songs not in playlist
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);

  // State to track current set of cards (showing 3 at a time for stack effect)
  const [currentStack, setCurrentStack] = useState<Song[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

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
    setAvailableSongs(filteredSongs);
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

  // Handle swipe end
  const handleDragEnd = (info: PanInfo) => {
    if (!currentStack.length || isAnimating) return;

    const currentSong = currentStack[0];
    setIsAnimating(true);

    // Make swiping more responsive with faster velocity detection
    const swipeThreshold = 80; // Reduced threshold for more responsiveness
    const velocityThreshold = 0.5; // Detect flick gestures

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swipe right - add to playlist with quicker animation
      onAdd(currentSong.id);
      handleNextCard(true, currentSong.id);

      // Faster animation reset
      setTimeout(() => {
        x.set(0);
        setIsAnimating(false);
      }, 200); // Reduced from 300ms
    } else if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      // Swipe left - discard with quicker animation
      handleNextCard(false, currentSong.id);

      // Faster animation reset
      setTimeout(() => {
        x.set(0);
        setIsAnimating(false);
      }, 200); // Reduced from 300ms
    } else {
      // Return to center if not swiped far enough - quick spring
      x.set(0);
      setTimeout(() => {
        setIsAnimating(false);
      }, 150);
    }
  };

  // Handle play button click
  const handlePlay = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card swipe when clicking play
    playSong(song);
    onPlay(song.id);
  };

  // Handle swipe action buttons
  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStack.length || isAnimating) return;

    setIsAnimating(true);
    handleNextCard(false, currentStack[0].id);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStack.length || isAnimating) return;

    const currentSong = currentStack[0];
    setIsAnimating(true);
    onAdd(currentSong.id);
    handleNextCard(true, currentSong.id);
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <SwipeDeckContainer>
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
                style={{
                  zIndex: currentStack.length - index,
                  scale: 1 - index * 0.05, // Stack effect - cards get slightly smaller
                  y: index * 10, // Stack effect - cards are slightly offset
                  ...(isDraggable ? { x, rotate } : {}),
                }}
                drag={isDraggable && !isAnimating ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.9} /* More elastic for smoother feel */
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
                      <FaTimes size={24} />
                    </ActionButton>

                    <PlayButton
                      onClick={(e) => handlePlay(song, e)}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaPlay size={20} />
                    </PlayButton>

                    <ActionButton
                      onClick={handleAddToPlaylist}
                      color="#22C55E"
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaHeart size={24} />
                    </ActionButton>
                  </ActionButtons>
                )}
              </Card>
            );
          })
        )}
      </CardStack>

      <SwipeInstructions>
        <div>Swipe left to pass, right to add</div>
      </SwipeInstructions>
    </SwipeDeckContainer>
  );
};

export default SwipeDeck;
