import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "../context/AudioContext";
import { FaMusic } from "react-icons/fa";

const SongInfoContainer = styled.div`
  text-align: center;
  margin: 16px 0;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Title = styled(motion.h2)`
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #fff;
  padding: 0 10px;

  /* Gradient text effect */
  background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Artist = styled(motion.p)`
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
`;

const Album = styled(motion.p)`
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
`;

const NoSongSelected = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 10px;

  svg {
    margin-bottom: 8px;
    opacity: 0.7;
  }
`;

const SongInfo: React.FC = () => {
  const { currentSong } = useAudio();

  const titleVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const artistVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: 0.05,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const albumVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: 0.1,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  return (
    <SongInfoContainer>
      <AnimatePresence mode="wait">
        {currentSong ? (
          <React.Fragment key={currentSong.id}>
            <Title
              initial="initial"
              animate="animate"
              exit="exit"
              variants={titleVariants}
            >
              {currentSong.title}
            </Title>
            <Artist
              initial="initial"
              animate="animate"
              exit="exit"
              variants={artistVariants}
            >
              {currentSong.artist}
            </Artist>
            <Album
              initial="initial"
              animate="animate"
              exit="exit"
              variants={albumVariants}
            >
              {currentSong.album}
            </Album>
          </React.Fragment>
        ) : (
          <NoSongSelected key="no-song">
            <FaMusic size={24} />
            <span>No song selected</span>
          </NoSongSelected>
        )}
      </AnimatePresence>
    </SongInfoContainer>
  );
};

export default SongInfo;
