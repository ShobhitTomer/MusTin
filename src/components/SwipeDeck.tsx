import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { FaPlay, FaPause, FaHeart, FaTimes, FaMusic } from "react-icons/fa";
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
  margin-bottom: 80px;
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

// Simple component to isolate re-renders for the play button
const PlayPauseButton = ({
  song,
  isPlaying,
  currentSongId,
  activePlayer,
  onToggle,
}: {
  song: Song;
  isPlaying: boolean;
  currentSongId: number | undefined;
  activePlayer: string;
  onToggle: (e: React.MouseEvent) => void;
}) => {
  // Direct check if this song is the one playing
  const isCurrentSongPlaying =
    isPlaying && currentSongId === song.id && activePlayer === "discover";

  return (
    <PlayButton onClick={onToggle} whileTap={{ scale: 0.9 }}>
      {isCurrentSongPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
    </PlayButton>
  );
};

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
  const {
    songsList,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    songChangeSource,
    setSongChangeSource,
    activePlayer,
    setActivePlayer,
  } = useAudio();

  // State to hold all songs not in playlist
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [currentStack, setCurrentStack] = useState<Song[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Force component re-render when playback state changes
  const [, setRenderToggle] = useState(false);

  // Animation reference for cleanup
  const animationRef = useRef<Animation | null>(null);

  // For tracking swipe direction
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

  // Swipe indicators
  const swipeLeftOpacity = useTransform(x, [-100, -20, 0], [1, 0, 0]);
  const swipeRightOpacity = useTransform(x, [0, 20, 100], [0, 0, 1]);

  // Force re-render when playback state changes
  useEffect(() => {
    setRenderToggle((prev) => !prev);
  }, [isPlaying, currentSong, activePlayer]);

  // Cleanup any running animations on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, []);

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

  // Listen for changes to current song from miniplayer
  useEffect(() => {
    // Only respond to changes from miniplayer and if not already animating
    if (
      songChangeSource === "miniplayer" &&
      currentSong &&
      activePlayer === "discover" &&
      !isAnimating
    ) {
      // Find the song in available songs
      const songIndex = availableSongs.findIndex(
        (song) => song.id === currentSong.id
      );

      if (songIndex !== -1) {
        // Only animate if the current top card is different
        if (currentStack.length > 0 && currentStack[0].id !== currentSong.id) {
          setIsAnimating(true);

          // Animate the current card swiping left (passing)
          const card = document.getElementById(`card-${currentStack[0].id}`);
          if (card) {
            // Cancel any existing animation
            if (animationRef.current) {
              animationRef.current.cancel();
            }

            // Start new animation
            animationRef.current = card.animate(
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
            animationRef.current.onfinish = () => {
              // Create new stack with the current song at the top
              const newStack = [
                availableSongs[songIndex],
                ...availableSongs
                  .filter((song) => song.id !== availableSongs[songIndex].id)
                  .slice(0, 2),
              ].slice(0, 3);

              setCurrentStack(newStack);
              x.set(0); // Reset position
              setIsAnimating(false);
              animationRef.current = null;
            };

            // Backup in case animation finish event doesn't fire
            setTimeout(() => {
              if (isAnimating) {
                // Create new stack with the current song at the top
                const newStack = [
                  availableSongs[songIndex],
                  ...availableSongs
                    .filter((song) => song.id !== availableSongs[songIndex].id)
                    .slice(0, 2),
                ].slice(0, 3);

                setCurrentStack(newStack);
                x.set(0); // Reset position
                setIsAnimating(false);
              }
            }, 450);
          }
        }
      }
    }
  }, [
    songChangeSource,
    currentSong,
    availableSongs,
    currentStack,
    activePlayer,
    isAnimating,
    x,
  ]);

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

    const currentCardSong = currentStack[0];
    setIsAnimating(true);

    // Make swiping more responsive with faster velocity detection
    const swipeThreshold = 80;
    const velocityThreshold = 0.5;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swipe right - add to playlist with quicker animation
      onAdd(currentCardSong.id);

      // Update miniplayer - set source to card so miniplayer knows where the change came from
      setSongChangeSource("card");

      // If this is the active miniplayer, play the next song
      if (
        activePlayer === "discover" &&
        currentSong?.id === currentCardSong.id
      ) {
        playNext();
      }

      // Animate card swipe right
      const card = document.getElementById(`card-${currentCardSong.id}`);
      if (card) {
        // Cancel any existing animation
        if (animationRef.current) {
          animationRef.current.cancel();
        }

        // Start new animation
        animationRef.current = card.animate(
          [
            {
              transform: `translateX(${info.offset.x}px) rotate(${
                info.offset.x * 0.1
              }deg)`,
            },
            { transform: "translateX(400px) rotate(40deg)" },
          ],
          {
            duration: 300,
            easing: "ease-out",
            fill: "forwards",
          }
        );

        // When animation completes
        animationRef.current.onfinish = () => {
          handleNextCard(true, currentCardSong.id);
          x.set(0); // Reset position
          setIsAnimating(false);
          animationRef.current = null;
        };

        // Backup in case animation finish event doesn't fire
        setTimeout(() => {
          if (isAnimating) {
            handleNextCard(true, currentCardSong.id);
            x.set(0); // Reset position
            setIsAnimating(false);
          }
        }, 350);
      }
    } else if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      // Swipe left - discard with quicker animation
      // Update miniplayer - set source to card so miniplayer knows where the change came from
      setSongChangeSource("card");

      // If this is the active miniplayer, play the next song
      if (
        activePlayer === "discover" &&
        currentSong?.id === currentCardSong.id
      ) {
        playNext();
      }

      // Animate card swipe left
      const card = document.getElementById(`card-${currentCardSong.id}`);
      if (card) {
        // Cancel any existing animation
        if (animationRef.current) {
          animationRef.current.cancel();
        }

        // Start new animation
        animationRef.current = card.animate(
          [
            {
              transform: `translateX(${info.offset.x}px) rotate(${
                info.offset.x * 0.1
              }deg)`,
            },
            { transform: "translateX(-400px) rotate(-40deg)" },
          ],
          {
            duration: 300,
            easing: "ease-out",
            fill: "forwards",
          }
        );

        // When animation completes
        animationRef.current.onfinish = () => {
          handleNextCard(false, currentCardSong.id);
          x.set(0); // Reset position
          setIsAnimating(false);
          animationRef.current = null;
        };

        // Backup in case animation finish event doesn't fire
        setTimeout(() => {
          if (isAnimating) {
            handleNextCard(false, currentCardSong.id);
            x.set(0); // Reset position
            setIsAnimating(false);
          }
        }, 350);
      }
    } else {
      // Return to center if not swiped far enough - quick spring
      x.set(0);
      setIsAnimating(false);
    }
  };

  // Handle play/pause button click for a specific song
  const handlePlayPauseToggle = (song: Song) => (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card swipe when clicking play

    // Make sure discover player is active when interacting with card
    setActivePlayer("discover");

    if (currentSong?.id === song.id && activePlayer === "discover") {
      // If this is already the current song, just toggle play/pause
      togglePlay();
    } else {
      // Otherwise play the new song
      setSongChangeSource("card");
      playSong(song, "discover");
      onPlay(song.id);
    }
  };

  // Handle discard button click
  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStack.length || isAnimating) return;

    const currentCardSong = currentStack[0];
    setIsAnimating(true);

    // Set source to card so miniplayer knows where the change came from
    setSongChangeSource("card");

    // If this card is the active song in miniplayer, play the next song
    if (activePlayer === "discover" && currentSong?.id === currentCardSong.id) {
      playNext();
    }

    // Animate card swipe left
    const card = document.getElementById(`card-${currentCardSong.id}`);
    if (card) {
      // Cancel any existing animation
      if (animationRef.current) {
        animationRef.current.cancel();
      }

      // Start new animation
      animationRef.current = card.animate(
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

      // When animation completes
      animationRef.current.onfinish = () => {
        handleNextCard(false, currentCardSong.id);
        x.set(0); // Reset position
        setIsAnimating(false);
        animationRef.current = null;
      };

      // Backup in case animation finish event doesn't fire
      setTimeout(() => {
        if (isAnimating) {
          handleNextCard(false, currentCardSong.id);
          x.set(0); // Reset position
          setIsAnimating(false);
        }
      }, 450);
    }
  };

  // Handle add to playlist button click
  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStack.length || isAnimating) return;

    const currentCardSong = currentStack[0];
    setIsAnimating(true);

    // Set source to card so miniplayer knows where the change came from
    setSongChangeSource("card");

    // If this card is the active song in miniplayer, play the next song
    if (activePlayer === "discover" && currentSong?.id === currentCardSong.id) {
      playNext();
    }

    onAdd(currentCardSong.id);

    // Animate card swipe right
    const card = document.getElementById(`card-${currentCardSong.id}`);
    if (card) {
      // Cancel any existing animation
      if (animationRef.current) {
        animationRef.current.cancel();
      }

      // Start new animation
      animationRef.current = card.animate(
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

      // When animation completes
      animationRef.current.onfinish = () => {
        handleNextCard(true, currentCardSong.id);
        x.set(0); // Reset position
        setIsAnimating(false);
        animationRef.current = null;
      };

      // Backup in case animation finish event doesn't fire
      setTimeout(() => {
        if (isAnimating) {
          handleNextCard(true, currentCardSong.id);
          x.set(0); // Reset position
          setIsAnimating(false);
        }
      }, 450);
    }
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
                id={`card-${song.id}`}
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

                    <PlayPauseButton
                      song={song}
                      isPlaying={isPlaying}
                      currentSongId={currentSong?.id}
                      activePlayer={activePlayer}
                      onToggle={handlePlayPauseToggle(song)}
                    />

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
    </SwipeDeckContainer>
  );
};

export default SwipeDeck;
