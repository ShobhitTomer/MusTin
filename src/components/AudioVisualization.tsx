import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { useAudio } from "../context/AudioContext";

const VisualizationContainer = styled.div`
  width: 100%;
  height: 50px;
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background-color: rgba(0, 0, 0, 0.2);
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

interface AudioVisualizationProps {
  barCount?: number;
  barColor?: string;
  barWidth?: number;
  barSpacing?: number;
  showFalloff?: boolean;
}

const AudioVisualization: React.FC<AudioVisualizationProps> = ({
  barCount = 48, // Reduced for mobile
  barColor = "#FA586A", // Apple Music red
  barWidth = 3,
  barSpacing = 1,
  showFalloff = true,
}) => {
  const { isPlaying, currentSong } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isSetup, setIsSetup] = useState(false);

  // Audio context states
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // For smoother visuals - store these in refs instead of state to avoid re-renders
  const smoothedDataRef = useRef<number[]>([]);
  const falloffDataRef = useRef<number[]>([]);

  // Initialize audio analysis
  useEffect(() => {
    if (!audioContextRef.current) {
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();

        analyser.fftSize = 512; // Lower for better performance on mobile
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        // Initialize smoothed and falloff data arrays
        smoothedDataRef.current = Array(barCount).fill(0);
        falloffDataRef.current = Array(barCount).fill(0);

        setIsSetup(true);
      } catch (error) {
        console.error("Web Audio API is not supported", error);
      }
    }

    return () => {
      cancelAnimationFrame(animationRef.current!);
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
    };
  }, [barCount]);

  // Connect audio element to analyser when song changes
  useEffect(() => {
    if (!currentSong || !audioContextRef.current || !analyserRef.current)
      return;

    const connectAudio = () => {
      const audio = document.querySelector("audio");
      if (!audio) {
        // Try to find the audio element created by the Audio API
        const audioElements = document.getElementsByTagName("audio");
        if (audioElements.length === 0) {
          // If no audio element found, retry after a short delay
          setTimeout(connectAudio, 500);
          return;
        }
      }

      // Use the first audio element found if not found by querySelector
      const audioElement = audio || document.getElementsByTagName("audio")[0];

      // Resume audio context if suspended (needed for autoplay policies)
      if (audioContextRef.current!.state === "suspended") {
        audioContextRef.current!.resume();
      }

      try {
        // Disconnect previous source if exists
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }

        // Create new source and connect to analyser
        sourceRef.current =
          audioContextRef.current!.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current!);
        analyserRef.current!.connect(audioContextRef.current!.destination);
      } catch (error) {
        console.error("Error connecting audio source:", error);

        // If MediaElementSource already connected error occurs, try a different approach
        if (
          error instanceof DOMException &&
          error.message.includes("already connected")
        ) {
          console.log(
            "Audio source already connected, using existing connections"
          );
        }
      }
    };

    // Try to connect audio after a short delay to ensure the audio element exists
    setTimeout(connectAudio, 500);
  }, [currentSong]);

  // Animation and rendering
  useEffect(() => {
    if (
      !canvasRef.current ||
      !analyserRef.current ||
      !dataArrayRef.current ||
      !isSetup
    )
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    // Set canvas dimensions with higher resolution
    const setCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    // Initial dimensions
    setCanvasDimensions();

    // Handle resize
    const handleResize = () => {
      setCanvasDimensions();
    };

    window.addEventListener("resize", handleResize);

    // Calculate a value based on the frequency data that looks good visually
    const getBarHeight = (index: number, frequencyData: Uint8Array) => {
      // Map the bar index to the frequency data range
      // Focus more on mid-range frequencies which are more present in music
      const frequencyIndex = Math.floor(
        (index / barCount) * (frequencyData.length * 0.75)
      );

      // Use a log scale to make visualization more dynamic
      const rawValue = frequencyData[frequencyIndex] || 0;

      // Apply smoothing - approach the target value gradually
      const smoothingFactor = 0.3; // Higher value = less smoothing for faster response on mobile
      smoothedDataRef.current[index] =
        smoothedDataRef.current[index] * (1 - smoothingFactor) +
        rawValue * smoothingFactor;

      // Apply falloff effect
      if (showFalloff) {
        const falloffSpeed = 1.5; // Higher = faster falloff for mobile

        if (smoothedDataRef.current[index] > falloffDataRef.current[index]) {
          falloffDataRef.current[index] = smoothedDataRef.current[index];
        } else {
          falloffDataRef.current[index] = Math.max(
            0,
            falloffDataRef.current[index] - falloffSpeed
          );
        }
      }

      // Convert to a height value
      return canvas.height * 0.8 * (smoothedDataRef.current[index] / 255);
    };

    // Animation function
    const animate = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const totalBarWidth = barWidth + barSpacing;
      const startX = (canvas.width - totalBarWidth * barCount) / 2;

      // Draw visualization
      for (let i = 0; i < barCount; i++) {
        const barHeight = isPlaying ? getBarHeight(i, dataArray) : 2;

        // Calculate x position with spacing
        const x = startX + i * totalBarWidth;

        // Draw main bar
        const centerY = canvas.height / 2;
        const y = centerY - barHeight / 2;

        // Gradient effect for bars
        const gradient = ctx.createLinearGradient(
          x,
          centerY - barHeight / 2,
          x,
          centerY + barHeight / 2
        );
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, `${barColor}99`); // Semi-transparent

        ctx.fillStyle = gradient;

        // Draw a rounded rectangle for each bar
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight - radius);
        ctx.quadraticCurveTo(
          x + barWidth,
          y + barHeight,
          x + barWidth - radius,
          y + barHeight
        );
        ctx.lineTo(x + radius, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Draw falloff indicator
        if (showFalloff && isPlaying) {
          const falloffHeight = 2;
          const falloffY =
            centerY -
            ((falloffDataRef.current[i] / 255) * (canvas.height * 0.8)) / 2;

          ctx.fillStyle = `${barColor}cc`;
          ctx.fillRect(x, falloffY, barWidth, falloffHeight);
        }
      }

      // Request the next frame
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    isPlaying,
    barCount,
    barColor,
    currentSong,
    barWidth,
    barSpacing,
    showFalloff,
    isSetup,
  ]);

  return (
    <VisualizationContainer>
      <Canvas ref={canvasRef} />
    </VisualizationContainer>
  );
};

export default AudioVisualization;
