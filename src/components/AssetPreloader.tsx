import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useAudio } from "../context/AudioContext";
import { FaMusic } from "react-icons/fa";

// Styled components
const PreloaderOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.backgroundGradient};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const LoadingTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 30px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;

  span.highlight {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const LoadingBar = styled.div`
  width: 80%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-bottom: 20px;
  overflow: hidden;
`;

const Progress = styled.div<{ width: string }>`
  height: 100%;
  width: ${(props) => props.width};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.primaryLight}
  );
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  text-align: center;
`;

const AssetPreloader: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const { songsList } = useAudio();
  const [progress, setProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Initializing...");
  const [totalAssets, setTotalAssets] = useState(0);
  const [loadedAssets, setLoadedAssets] = useState(0);

  useEffect(() => {
    if (songsList.length === 0) {
      return;
    }

    const preloadAssets = async () => {
      // Count total assets to load (cover images + first three songs)
      const assetsToLoad = songsList.length + Math.min(3, songsList.length);
      setTotalAssets(assetsToLoad);

      // Preload all cover images
      await Promise.all(
        songsList.map((song, index) => {
          return new Promise<void>((resolve) => {
            setLoadingStatus(
              `Loading album artwork (${index + 1}/${songsList.length})...`
            );

            const img = new Image();
            img.onload = () => {
              setLoadedAssets((prev) => prev + 1);
              setProgress((prev) => prev + 100 / assetsToLoad);
              resolve();
            };
            img.onerror = () => {
              setLoadedAssets((prev) => prev + 1);
              setProgress((prev) => prev + 100 / assetsToLoad);
              console.error(`Failed to load image: ${song.coverUrl}`);
              resolve();
            };
            img.src = song.coverUrl;
          });
        })
      );

      // Preload the first three songs
      const songsToPreload = songsList.slice(0, 3);

      for (let i = 0; i < songsToPreload.length; i++) {
        const song = songsToPreload[i];
        setLoadingStatus(`Caching song (${i + 1}/3): ${song.title}`);

        await new Promise<void>((resolve) => {
          const audio = new Audio();

          audio.oncanplaythrough = () => {
            setLoadedAssets((prev) => prev + 1);
            setProgress((prev) => prev + 100 / assetsToLoad);
            resolve();
          };

          audio.onerror = () => {
            setLoadedAssets((prev) => prev + 1);
            setProgress((prev) => prev + 100 / assetsToLoad);
            console.error(`Failed to preload audio: ${song.audioUrl}`);
            resolve();
          };

          // Set source to load the audio file
          audio.src = song.audioUrl;
          audio.load();

          // Store in the browser's cache by initiating playback and immediately pausing
          audio
            .play()
            .then(() => {
              audio.pause();
              audio.currentTime = 0;
            })
            .catch((err) => {
              console.warn("Audio preload play/pause failed:", err);
              // Still resolve as we just want to cache it
              resolve();
            });
        });
      }

      setLoadingStatus("Ready to go!");

      // Give a small delay so users can see "Ready to go!" message
      setTimeout(() => {
        onComplete();
      }, 800);
    };

    preloadAssets().catch((error) => {
      console.error("Error during preloading:", error);
      // Continue anyway after a timeout
      setTimeout(() => {
        onComplete();
      }, 1500);
    });
  }, [songsList, onComplete]);

  return (
    <PreloaderOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <LoadingTitle>
        <FaMusic /> Mus<span className="highlight">Tin</span>
      </LoadingTitle>

      <LoadingBar>
        <Progress width={`${progress}%`} />
      </LoadingBar>

      <LoadingText>
        {loadingStatus}
        <br />
        {loadedAssets} / {totalAssets} assets loaded
      </LoadingText>
    </PreloaderOverlay>
  );
};

export default AssetPreloader;
