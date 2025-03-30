import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FaMusic, FaList, FaFire } from "react-icons/fa";
import SwipeDeck from "./SwipeDeck";
import Playlist from "./Playlist";
import { AudioProvider, useAudio } from "../context/AudioContext";
import MiniPlayer from "./MiniPlayer";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  background: ${({ theme }) => theme.colors.backgroundGradient};
`;

const StatusBar = styled.div`
  height: 44px;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  position: relative;
  z-index: 10;
`;

const AppTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 8px;

  span.highlight {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Screen = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const NavBar = styled.div`
  height: 60px;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom, 0);
`;

const NavButton = styled.button<{ active?: boolean }>`
  background: none;
  border: none;
  color: ${(props) =>
    props.active ? props.theme.colors.primary : "rgba(255, 255, 255, 0.7)"};
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  gap: 4px;
  cursor: pointer;

  &:active {
    opacity: 0.7;
  }
`;

enum AppScreen {
  DISCOVER = "discover",
  PLAYLIST = "playlist",
}

const MusTinAppWrapper: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(
    AppScreen.DISCOVER
  );
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);

  // Use the audio context to manage playlist and playback
  const {
    currentSong,
    loadSongs,
    playlistSongs,
    addToPlaylist,
    removeFromPlaylist,
    playSong,
    getSongById,
  } = useAudio();

  // Initialize app on mount
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Show mini player when a song is selected
  useEffect(() => {
    if (currentSong) {
      setMiniPlayerVisible(true);
    }
  }, [currentSong]);

  // Handle playing a song
  const handlePlaySong = (songId: number) => {
    const song = getSongById(songId);
    if (song) {
      playSong(song);
    }
  };

  // Animation variants for screen transitions
  const variants = {
    enter: (direction: string) => ({
      x: direction === "right" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: direction === "right" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <AppContainer>
      <StatusBar>
        <AppTitle>
          <FaMusic /> Mus<span className="highlight">Tin</span>
        </AppTitle>
      </StatusBar>

      <ContentContainer>
        <AnimatePresence mode="wait" initial={false}>
          {activeScreen === AppScreen.DISCOVER && (
            <Screen
              key="discover"
              initial="enter"
              animate="center"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.3 }}
              custom="right"
            >
              <SwipeDeck
                playlistSongIds={playlistSongs}
                onAdd={addToPlaylist}
                onPlay={handlePlaySong}
              />
            </Screen>
          )}

          {activeScreen === AppScreen.PLAYLIST && (
            <Screen
              key="playlist"
              initial="enter"
              animate="center"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.3 }}
              custom="left"
            >
              <Playlist
                playlistSongIds={playlistSongs}
                onRemove={removeFromPlaylist}
                onPlay={handlePlaySong}
              />
            </Screen>
          )}
        </AnimatePresence>

        {miniPlayerVisible && currentSong && (
          <MiniPlayer onClose={() => setMiniPlayerVisible(false)} />
        )}
      </ContentContainer>

      <NavBar>
        <NavButton
          active={activeScreen === AppScreen.DISCOVER}
          onClick={() => setActiveScreen(AppScreen.DISCOVER)}
        >
          <FaFire size={22} />
          <span>Discover</span>
        </NavButton>
        <NavButton
          active={activeScreen === AppScreen.PLAYLIST}
          onClick={() => setActiveScreen(AppScreen.PLAYLIST)}
        >
          <FaList size={22} />
          <span>Playlist</span>
        </NavButton>
      </NavBar>
    </AppContainer>
  );
};

const MusTinApp: React.FC = () => {
  return (
    <AudioProvider>
      <MusTinAppWrapper />
    </AudioProvider>
  );
};

export default MusTinApp;
