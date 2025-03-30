import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FaMusic, FaList, FaFire } from "react-icons/fa";
import SwipeDeck from "./SwipeDeck";
import Playlist from "./Playlist";
import { AudioProvider, useAudio } from "../context/AudioContext";
import MiniPlayer from "./MiniPlayer";
import AssetPreloader from "./AssetPreloader";

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
  overscroll-behavior: none;
  touch-action: manipulation;
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
  overscroll-behavior: none;
  touch-action: manipulation;
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
  z-index: 20;
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
  transition: color 0.2s ease;

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
  const [discoverMiniPlayerVisible, setDiscoverMiniPlayerVisible] =
    useState(false);
  const [playlistMiniPlayerVisible, setPlaylistMiniPlayerVisible] =
    useState(false);
  const [discoverMiniPlayerMinimized, setDiscoverMiniPlayerMinimized] =
    useState(false);
  const [playlistMiniPlayerMinimized, setPlaylistMiniPlayerMinimized] =
    useState(false);
  const [appReady, setAppReady] = useState(false);

  // Use the audio context to manage playlist and playback
  const {
    currentSong,
    loadSongs,
    playlistSongs,
    addToPlaylist,
    removeFromPlaylist,
    playSong,
    getSongById,
    setIsLoading,
    setActivePlayer,
    activePlayer,
  } = useAudio();

  // Initialize app on mount
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/serviceWorker.js")
          .then((registration) => {
            console.log(
              "ServiceWorker registration successful with scope: ",
              registration.scope
            );
          })
          .catch((error) => {
            console.log("ServiceWorker registration failed: ", error);
          });
      });
    }

    // Load songs data
    loadSongs();

    // Reset playlist on app load
    // This could be removed if you want to persist playlist between sessions
    localStorage.removeItem("mustin_playlist");
  }, [loadSongs]);

  // Load playlist from local storage on initial load
  useEffect(() => {
    const savedPlaylist = localStorage.getItem("mustin_playlist");
    if (savedPlaylist) {
      // If you want to implement loading the playlist from localStorage
      // You can parse and set it here
    }
  }, []);

  // Save playlist to local storage when it changes
  useEffect(() => {
    if (playlistSongs.length > 0) {
      localStorage.setItem("mustin_playlist", JSON.stringify(playlistSongs));
    } else {
      localStorage.removeItem("mustin_playlist");
    }
  }, [playlistSongs]);

  // Handle asset preloading completion
  const handlePreloadComplete = () => {
    setAppReady(true);
    setIsLoading(false);
  };

  // Show appropriate mini player when a song is selected
  useEffect(() => {
    if (currentSong) {
      if (activePlayer === "discover") {
        setDiscoverMiniPlayerVisible(true);
        setDiscoverMiniPlayerMinimized(false);
      } else if (activePlayer === "playlist") {
        setPlaylistMiniPlayerVisible(true);
        setPlaylistMiniPlayerMinimized(false);
      }
    }
  }, [currentSong, activePlayer]);

  // Handle playing a song from discover screen
  const handlePlayFromDiscover = (songId: number) => {
    setActivePlayer("discover");
    const song = getSongById(songId);
    if (song) {
      playSong(song, "discover");
    }
  };

  // Handle playing a song from playlist screen
  const handlePlayFromPlaylist = (songId: number) => {
    setActivePlayer("playlist");
    const song = getSongById(songId);
    if (song) {
      playSong(song, "playlist");
    }
  };

  // Update active player based on active screen
  useEffect(() => {
    if (activeScreen === AppScreen.DISCOVER) {
      setActivePlayer("discover");
    } else if (activeScreen === AppScreen.PLAYLIST) {
      setActivePlayer("playlist");
    }
  }, [activeScreen, setActivePlayer]);

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

  if (!appReady) {
    return <AssetPreloader onComplete={handlePreloadComplete} />;
  }

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
                onPlay={handlePlayFromDiscover}
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
                onPlay={handlePlayFromPlaylist}
              />
            </Screen>
          )}
        </AnimatePresence>

        {/* Discover MiniPlayer */}
        <AnimatePresence>
          {discoverMiniPlayerVisible && !discoverMiniPlayerMinimized && (
            <MiniPlayer
              playerType="discover"
              onClose={() => setDiscoverMiniPlayerMinimized(true)}
              onMinimize={() => setDiscoverMiniPlayerMinimized(true)}
            />
          )}
        </AnimatePresence>

        {/* Playlist MiniPlayer */}
        <AnimatePresence>
          {playlistMiniPlayerVisible && !playlistMiniPlayerMinimized && (
            <MiniPlayer
              playerType="playlist"
              onClose={() => setPlaylistMiniPlayerMinimized(true)}
              onMinimize={() => setPlaylistMiniPlayerMinimized(true)}
            />
          )}
        </AnimatePresence>
      </ContentContainer>

      <NavBar>
        <NavButton
          active={activeScreen === AppScreen.DISCOVER}
          onClick={() => {
            setActiveScreen(AppScreen.DISCOVER);
            if (discoverMiniPlayerVisible && discoverMiniPlayerMinimized) {
              setDiscoverMiniPlayerMinimized(false);
            }
          }}
        >
          <FaFire size={22} />
          <span>Discover</span>
        </NavButton>
        <NavButton
          active={activeScreen === AppScreen.PLAYLIST}
          onClick={() => {
            setActiveScreen(AppScreen.PLAYLIST);
            if (playlistMiniPlayerVisible && playlistMiniPlayerMinimized) {
              setPlaylistMiniPlayerMinimized(false);
            }
          }}
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
