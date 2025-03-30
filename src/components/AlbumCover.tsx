import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useAudio } from "../context/AudioContext";

const AlbumCoverContainer = styled(motion.div)`
  width: 250px;
  height: 250px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.heavy};
  margin: 0 auto 20px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    pointer-events: none;
  }

  @media (max-height: 640px) {
    width: 180px;
    height: 180px;
  }
`;

const AlbumImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const AlbumGradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0.2) 70%,
    rgba(0, 0, 0, 0.5)
  );
  opacity: 0;
  transition: opacity 0.3s ease;

  ${AlbumCoverContainer}:active & {
    opacity: 1;
  }
`;

const VinylRecord = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    #222 10%,
    #111 30%,
    #000 60%,
    #333 61%,
    #000 65%,
    #333 66%,
    #000 67%,
    #333 68%,
    #000 69%,
    #333 70%,
    #000 75%
  );
  border-radius: 50%;
  z-index: -1;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);

  &::after {
    content: "";
    position: absolute;
    width: 15%;
    height: 15%;
    background: radial-gradient(
      circle at center,
      #555 0%,
      #333 60%,
      #555 70%,
      #333 100%
    );
    border-radius: 50%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
`;

const AlbumCover: React.FC = () => {
  const { currentSong, isPlaying } = useAudio();
  const [, setImageLoaded] = useState(false);
  const [, setImageFailed] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [currentSong]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageFailed(true);
  };

  const albumVariants = {
    playing: {
      scale: 0.85,
      x: "-5%",
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    paused: {
      scale: 1,
      x: "0%",
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const vinylVariants = {
    playing: {
      scale: 0.9,
      x: "40%",
      rotate: 360,
      transition: {
        rotate: {
          repeat: Infinity,
          duration: 20,
          ease: "linear",
        },
        scale: {
          duration: 0.5,
          ease: "easeOut",
        },
        x: {
          duration: 0.5,
          ease: "easeOut",
        },
      },
    },
    paused: {
      scale: 0.8,
      x: "0%",
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div
      style={{
        position: "relative",
        width: "250px",
        height: "250px",
        margin: "0 auto",
        maxWidth: "100%",
      }}
      className="album-cover-wrapper"
    >
      <VinylRecord
        animate={isPlaying ? "playing" : "paused"}
        variants={vinylVariants}
        initial="paused"
      />

      <AlbumCoverContainer
        animate={isPlaying ? "playing" : "paused"}
        variants={albumVariants}
        initial="paused"
      >
        <AlbumImage
          src={currentSong?.coverUrl || "/default-album.jpg"}
          alt={`${currentSong?.album || "Album"} cover`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        <AlbumGradientOverlay />
      </AlbumCoverContainer>
    </div>
  );
};

export default AlbumCover;
