import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FaList, FaHome } from "react-icons/fa";
import AlbumCover from "./AlbumCover";
import SongInfo from "./SongInfo";
import PlaybackControls from "./PlaybackControls";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import Playlist from "./Playlist";
import AudioVisualization from "./AudioVisualization";
import { AudioProvider, useAudio } from "../context/AudioContext";

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
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  position: relative;
  z-index: 10;
`;

const AppTitle = styled.h1`
  font-size: 17px;
  font-weight: 600;
  color: white;
  text-align: center;
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
`;

const PlayerWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const PlayerContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  justify-content: space-between;
  overflow: hidden;
`;

const NavBar = styled.div`
  height: 50px;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-around;
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

const PlayerScreen = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PlaylistScreen = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.backgroundGradient};
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PlaylistHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const PlaylistTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: white;
`;

const sections = {
  player: "player",
  playlist: "playlist",
};

const MobilePlayerWrapper: React.FC = () => {
  const [activeSection, setActiveSection] = useState(sections.player);
  const { loadSongs } = useAudio();
  const initialLoadCompleted = React.useRef(false);

  useEffect(() => {
    if (!initialLoadCompleted.current) {
      loadSongs();
      initialLoadCompleted.current = true;
    }
  }, [loadSongs]);

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
        <AppTitle>Music Player</AppTitle>
      </StatusBar>

      <ContentContainer>
        <PlayerWrapper>
          <AnimatePresence mode="wait" initial={false}>
            {activeSection === sections.player && (
              <PlayerScreen
                key="player"
                initial="enter"
                animate="center"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.3 }}
                custom="right"
              >
                <PlayerContent>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <AlbumCover />
                    <SongInfo />
                  </div>

                  <div>
                    <AudioVisualization />
                    <ProgressBar />
                    <PlaybackControls />
                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <VolumeControl />
                    </div>
                  </div>
                </PlayerContent>
              </PlayerScreen>
            )}

            {activeSection === sections.playlist && (
              <PlaylistScreen
                key="playlist"
                initial="enter"
                animate="center"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.3 }}
                custom="left"
              >
                <PlaylistHeader>
                  <PlaylistTitle>Your Library</PlaylistTitle>
                </PlaylistHeader>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <Playlist
                    playlistSongIds={[]}
                    onRemove={function (): void {
                      throw new Error("Function not implemented.");
                    }}
                    onPlay={function (): void {
                      throw new Error("Function not implemented.");
                    }}
                  />
                </div>
              </PlaylistScreen>
            )}
          </AnimatePresence>
        </PlayerWrapper>
      </ContentContainer>

      <NavBar>
        <NavButton
          active={activeSection === sections.player}
          onClick={() => setActiveSection(sections.player)}
        >
          <FaHome size={20} />
          <span>Player</span>
        </NavButton>
        <NavButton
          active={activeSection === sections.playlist}
          onClick={() => setActiveSection(sections.playlist)}
        >
          <FaList size={20} />
          <span>Playlist</span>
        </NavButton>
      </NavBar>
    </AppContainer>
  );
};

const MusicPlayer: React.FC = () => {
  return (
    <AudioProvider>
      <MobilePlayerWrapper />
    </AudioProvider>
  );
};

export default MusicPlayer;
