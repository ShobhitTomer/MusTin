import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
  AnimatePresence,
} from "framer-motion";
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
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
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
  background-color: ${({ theme }) => theme.colors.primary};
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

  // Filter out songs that are already in the playlist
  const availableSongs = songsList.filter(
    (song) => !playlistSongIds.includes(song.id)
  );

  // Current displayed songs (showing 3 for stack effect)
  const [currentStack, setCurrentStack] = useState<Song[]>([]);

  // Setup initial stack
  useEffect(() => {
    if (availableSongs.length > 0) {
      setCurrentStack(
        availableSongs.slice(0, Math.min(3, availableSongs.length))
      );
    } else {
      setCurrentStack([]);
    }
  }, [availableSongs]);

  // Tracking motion values for swipe effect
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

  // Swipe indicators
  const swipeLeftOpacity = useTransform(x, [-100, -20, 0], [1, 0, 0]);
  const swipeRightOpacity = useTransform(x, [0, 20, 100], [0, 0, 1]);

  // Handle end of drag
  const handleDragEnd = (info: PanInfo) => {
    if (!currentStack.length) return;

    const currentSong = currentStack[0];

    if (info.offset.x > 100) {
      // Swipe right - add to playlist
      onAdd(currentSong.id);
      handleNextCard();
    } else if (info.offset.x < -100) {
      // Swipe left - discard
      handleNextCard();
    }
  };

  // Move to next card
  const handleNextCard = () => {
    if (availableSongs.length <= currentStack.length) {
      // No more cards to show
      setCurrentStack((prev) => prev.slice(1));
    } else {
      // Get next card from available songs
      const nextIndex = currentStack.length;
      const nextSong = availableSongs[nextIndex];
      setCurrentStack((prev) => [...prev.slice(1), nextSong]);
    }
  };

  // Handle play button click
  const handlePlay = (song: Song) => {
    playSong(song);
    onPlay(song.id);
  };

  // Handle swipe action buttons
  const handleDiscard = () => {
    if (!currentStack.length) return;
    x.set(-200); // animate card swiping left
    setTimeout(() => {
      handleNextCard();
      x.set(0); // reset position for next card
    }, 300);
  };

  const handleAddToPlaylist = () => {
    if (!currentStack.length) return;
    const currentSong = currentStack[0];
    onAdd(currentSong.id);
    x.set(200); // animate card swiping right
    setTimeout(() => {
      handleNextCard();
      x.set(0); // reset position for next card
    }, 300);
  };

  return (
    <SwipeDeckContainer>
      <CardStack>
        <AnimatePresence>
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
                  drag={isDraggable ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => isDraggable && handleDragEnd(info)}
                  initial={index === 0 ? { x: 300, opacity: 0 } : false}
                  animate={index === 0 ? { x: 0, opacity: 1 } : {}}
                  exit={index === 0 ? { x: -300, opacity: 0 } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
                        onClick={() => handlePlay(song)}
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
        </AnimatePresence>
      </CardStack>
    </SwipeDeckContainer>
  );
};

export default SwipeDeck;
