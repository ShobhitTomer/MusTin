import React, { useState } from "react";
import styled from "styled-components";
import { motion, PanInfo, AnimatePresence } from "framer-motion";
import { FaMusic, FaPlay, FaTrash } from "react-icons/fa";
import { useAudio } from "../context/AudioContext";
import { Song } from "../types/types";

const PlayListInstruction = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 20px;
  font-size: 14px;
`;

const PlaylistContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;
  overflow: hidden;
  touch-action: manipulation;
`;

const PlaylistHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const EmptyPlaylist = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  padding: 20px;
  gap: 16px;

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

const PlaylistItems = styled.div`
  flex: 1;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;

  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const PlaylistItemCard = styled(motion.div)`
  background: rgba(20, 20, 20, 0.6);
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  height: 90px;
  position: relative;
  touch-action: pan-y;
`;

const ItemImage = styled.div<{ imageUrl: string }>`
  width: 90px;
  height: 90px;
  background-image: url(${(props) => props.imageUrl});
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
`;

const ItemInfo = styled.div`
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
`;

const ItemTitle = styled.h3`
  font-size: 16px;
  color: #fff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemArtist = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemPlayButton = styled(motion.button)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 2;
`;

const DeleteOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(239, 68, 68, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 0 20px;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  font-weight: bold;
  z-index: 1;
`;

interface PlaylistProps {
  playlistSongIds: number[];
  onRemove: (songId: number) => void;
  onPlay: (songId: number) => void;
}

const Playlist: React.FC<PlaylistProps> = ({
  playlistSongIds,
  onRemove,
  onPlay,
}) => {
  const { playSong, getSongById } = useAudio();
  const [, setSwipingItemId] = useState<number | null>(null);
  const [showDeleteOverlay, setShowDeleteOverlay] = useState<number | null>(
    null
  );

  // Get the full song details for songs in the playlist
  const playlistSongs = playlistSongIds
    .map((id) => getSongById(id))
    .filter(Boolean) as Song[];

  // Handle playing a song
  const handlePlay = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering swipe when clicking play
    playSong(song);
    onPlay(song.id);
  };

  // Handle drag movements for visual cues
  const handleDrag = (info: PanInfo, songId: number) => {
    if (info.offset.x < -40) {
      setShowDeleteOverlay(songId);
    } else {
      setShowDeleteOverlay(null);
    }
  };

  // Handle drag end for swipe-to-delete
  const handleDragEnd = (songId: number, info: PanInfo) => {
    if (info.offset.x < -100) {
      // Swipe left far enough to delete
      onRemove(songId);
      setSwipingItemId(null);
      setShowDeleteOverlay(null);
    } else {
      // Reset to original position
      setSwipingItemId(null);
      setShowDeleteOverlay(null);
    }
  };

  return (
    <PlaylistContainer>
      <PlaylistHeader>
        <h2>
          <FaMusic /> Your Playlist ({playlistSongs.length})
        </h2>
      </PlaylistHeader>

      {playlistSongs.length > 0 ? (
        <>
          <PlayListInstruction>
            Swipe left to remove songs from your playlist
          </PlayListInstruction>

          <PlaylistItems>
            <AnimatePresence>
              {playlistSongs.map((song) => (
                <PlaylistItemCard
                  key={song.id}
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0.5, right: 0 }} // Only elastic when swiping left
                  onDragStart={() => setSwipingItemId(song.id)}
                  onDrag={(_, info) => handleDrag(info, song.id)}
                  onDragEnd={(_, info) => handleDragEnd(song.id, info)}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <ItemImage imageUrl={song.coverUrl} />
                  <ItemInfo>
                    <ItemTitle>{song.title}</ItemTitle>
                    <ItemArtist>{song.artist}</ItemArtist>
                  </ItemInfo>

                  <ItemPlayButton
                    onClick={(e) => handlePlay(song, e)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaPlay size={14} />
                  </ItemPlayButton>

                  <DeleteOverlay
                    initial={{ width: 0 }}
                    animate={{
                      width: showDeleteOverlay === song.id ? 100 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaTrash size={20} />
                    <span style={{ marginLeft: 8 }}>Delete</span>
                  </DeleteOverlay>
                </PlaylistItemCard>
              ))}
            </AnimatePresence>
          </PlaylistItems>
        </>
      ) : (
        <EmptyPlaylist>
          <FaMusic />
          <h3>Your Playlist is Empty</h3>
          <p>
            Swipe right on songs you like in the Discover tab to add them to
            your playlist.
          </p>
        </EmptyPlaylist>
      )}
    </PlaylistContainer>
  );
};

export default Playlist;
