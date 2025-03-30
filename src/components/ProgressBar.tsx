import React, { useState } from "react";
import styled from "styled-components";
import { useAudio } from "../context/AudioContext";

const ProgressContainer = styled.div`
  width: 100%;
  margin: 20px 0;
`;

const ProgressBarWrapper = styled.div`
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  transition: height 0.2s ease;

  &:hover {
    height: 8px;
  }
`;

const Progress = styled.div<{ width: string }>`
  height: 100%;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.primaryLight}
  );
  border-radius: 3px;
  position: relative;
  width: ${(props) => props.width};
  transition: width 0.1s linear;
`;

const BufferedProgress = styled.div<{ width: string }>`
  height: 100%;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => props.width};
  z-index: -1;
`;

const ProgressHandle = styled.div<{ active: boolean }>`
  width: 12px;
  height: 12px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  right: -6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: ${(props) => (props.active ? 1 : 0)};
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }
`;

const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 8px;
`;

// Helper function to format time (seconds to mm:ss)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const ProgressBar: React.FC = () => {
  const { currentTime, duration, seekTo } = useAudio();
  const [isDragging, setIsDragging] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  const progressRef = React.useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickPositionX = e.clientX - rect.left;
    const progressBarWidth = rect.width;
    const clickPercentage = clickPositionX / progressBarWidth;
    const newTime = duration * clickPercentage;

    seekTo(newTime);
  };

  // Simulate buffering progress (in a real app this would come from the audio element)
  React.useEffect(() => {
    // Use a higher buffer percentage when further into the song
    const simulatedBufferPercentage = Math.min(
      100,
      (currentTime / duration) * 100 + 20
    );
    setBufferedPercent(simulatedBufferPercentage);
  }, [currentTime, duration]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <ProgressContainer>
      <ProgressBarWrapper
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseEnter={() => setIsDragging(true)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <BufferedProgress width={`${bufferedPercent}%`} />
        <Progress width={`${progressPercentage}%`}>
          <ProgressHandle active={isDragging} />
        </Progress>
      </ProgressBarWrapper>
      <TimeInfo>
        <span>{formatTime(currentTime)}</span>
        <span>-{formatTime(duration - currentTime)}</span>
      </TimeInfo>
    </ProgressContainer>
  );
};

export default ProgressBar;
