import { useState, useRef, useEffect } from "react";
import { Song } from "../types/types";

interface UseAudioPlayerProps {
  initialSongs?: Song[];
  initialVolume?: number;
  autoPlay?: boolean;
}

interface UseAudioPlayerReturn {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  bufferedPercentage: number;
  repeat: "none" | "one" | "all";
  isShuffling: boolean;
  songsList: Song[];
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  playSong: (song: Song) => Promise<void>;
  addSong: (song: Song) => void;
  removeSong: (songId: number) => void;
  clearPlaylist: () => void;
  setPlaylist: (songs: Song[]) => void;
  mute: () => void;
  unmute: () => void;
  isMuted: boolean;
}

const useAudioPlayer = ({
  initialSongs = [],
  initialVolume = 0.7,
  autoPlay = false,
}: UseAudioPlayerProps = {}): UseAudioPlayerReturn => {
  // State for the audio player
  const [currentSong, setCurrentSong] = useState<Song | null>(
    initialSongs.length > 0 ? initialSongs[0] : null
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [volume, setVolume] = useState<number>(initialVolume);
  const [previousVolume, setPreviousVolume] = useState<number>(initialVolume);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedPercentage, setBufferedPercentage] = useState<number>(0);
  const [repeat, setRepeat] = useState<"none" | "one" | "all">("none");
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [songsList, setSongsList] = useState<Song[]>(initialSongs);
  const [playbackOrder, setPlaybackOrder] = useState<number[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element and event listeners
  useEffect(() => {
    audioRef.current = new Audio();

    const audio = audioRef.current;

    // Set initial volume
    audio.volume = volume;

    // Event listeners
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleMetadataLoaded);
    audio.addEventListener("ended", handleSongEnd);
    audio.addEventListener("progress", handleProgress);
    audio.addEventListener("error", handleError);

    // Initialize playback order
    updatePlaybackOrder();

    // Play the first song if autoPlay is true
    if (autoPlay && currentSong) {
      audio.src = currentSong.audioUrl;
      audio.play().catch((error) => console.error("Auto-play error:", error));
    }

    // Cleanup function
    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleMetadataLoaded);
      audio.removeEventListener("ended", handleSongEnd);
      audio.removeEventListener("progress", handleProgress);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  // Update audio source when current song changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audio = audioRef.current;
      audio.src = currentSong.audioUrl;
      audio.volume = volume;

      if (isPlaying) {
        audio.play().catch((error) => console.error("Playback error:", error));
      }
    }
  }, [currentSong]);

  // Update playback order when shuffling state or songs list changes
  useEffect(() => {
    updatePlaybackOrder();
  }, [isShuffling, songsList]);

  // Handler functions
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSongEnd = () => {
    if (repeat === "one") {
      seekTo(0);
      audioRef.current?.play();
    } else if (
      repeat === "all" ||
      currentSongIndex < playbackOrder.length - 1
    ) {
      playNext();
    } else {
      // Last song and not repeating all
      setIsPlaying(false);
    }
  };

  const handleProgress = () => {
    if (audioRef.current && audioRef.current.buffered.length > 0) {
      const bufferedEnd = audioRef.current.buffered.end(
        audioRef.current.buffered.length - 1
      );
      const duration = audioRef.current.duration;

      if (duration > 0) {
        const percentage = (bufferedEnd / duration) * 100;
        setBufferedPercentage(percentage);
      }
    }
  };

  const handleError = (e: Event) => {
    console.error("Audio playback error:", e);
    // Handle error - you might want to skip to the next song or show an error message
  };

  // Playback order management
  const updatePlaybackOrder = () => {
    const indices = Array.from(Array(songsList.length).keys());
    if (isShuffling) {
      // Fisher-Yates shuffle algorithm
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }
    setPlaybackOrder(indices);

    if (currentSong) {
      const currentIdIndex = indices.findIndex(
        (i) => songsList[i]?.id === currentSong.id
      );
      if (currentIdIndex !== -1) {
        setCurrentSongIndex(currentIdIndex);
      }
    }
  };

  // Player control functions
  const play = async (): Promise<void> => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Play error:", error);
    }
  };

  const pause = (): void => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlay = async (): Promise<void> => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const setAudioVolume = (newVolume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    setVolume(clampedVolume);

    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (clampedVolume === 0) {
      setIsMuted(true);
    }
  };

  const mute = (): void => {
    if (!isMuted) {
      setPreviousVolume(volume);
      setAudioVolume(0);
      setIsMuted(true);
    }
  };

  const unmute = (): void => {
    if (isMuted) {
      setAudioVolume(previousVolume > 0 ? previousVolume : 0.5);
      setIsMuted(false);
    }
  };

  const seekTo = (time: number): void => {
    if (!audioRef.current) return;

    const clampedTime = Math.max(0, Math.min(time, audioRef.current.duration));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const playNext = async (): Promise<void> => {
    if (songsList.length === 0) return;

    const nextIndex = (currentSongIndex + 1) % playbackOrder.length;
    setCurrentSongIndex(nextIndex);

    const nextSong = songsList[playbackOrder[nextIndex]];
    if (nextSong) {
      setCurrentSong(nextSong);

      if (isPlaying) {
        // Small timeout to allow the song to change before playing
        setTimeout(() => {
          audioRef.current
            ?.play()
            .catch((err) => console.error("Error playing next song:", err));
        }, 100);
      }
    }
  };

  const playPrevious = async (): Promise<void> => {
    if (songsList.length === 0) return;

    // If we're more than 3 seconds into the song, go to the beginning instead of previous song
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = playbackOrder.length - 1;
    setCurrentSongIndex(prevIndex);

    const prevSong = songsList[playbackOrder[prevIndex]];
    if (prevSong) {
      setCurrentSong(prevSong);

      if (isPlaying) {
        // Small timeout to allow the song to change before playing
        setTimeout(() => {
          audioRef.current
            ?.play()
            .catch((err) => console.error("Error playing previous song:", err));
        }, 100);
      }
    }
  };

  const toggleRepeat = (): void => {
    const modes: ("none" | "one" | "all")[] = ["none", "one", "all"];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  const toggleShuffle = (): void => {
    setIsShuffling(!isShuffling);
  };

  const playSong = async (song: Song): Promise<void> => {
    const songIndex = songsList.findIndex((s) => s.id === song.id);
    if (songIndex !== -1) {
      const playbackOrderIndex = playbackOrder.findIndex(
        (i) => i === songIndex
      );
      if (playbackOrderIndex !== -1) {
        setCurrentSongIndex(playbackOrderIndex);
      } else {
        // If not found in the current playback order, update it
        updatePlaybackOrder();
      }

      setCurrentSong(song);
      setIsPlaying(true);

      // Small timeout to allow the song to change before playing
      setTimeout(() => {
        audioRef.current
          ?.play()
          .catch((err) => console.error("Error playing selected song:", err));
      }, 100);
    }
  };

  // Playlist management functions
  const addSong = (song: Song): void => {
    setSongsList((prev) => {
      // Check if song already exists in playlist
      const exists = prev.some((s) => s.id === song.id);
      if (exists) return prev;

      const newList = [...prev, song];
      if (newList.length === 1) {
        // If this is the first song, set it as current
        setCurrentSong(song);
      }
      return newList;
    });
  };

  const removeSong = (songId: number): void => {
    setSongsList((prev) => {
      const index = prev.findIndex((s) => s.id === songId);
      if (index === -1) return prev;

      const newList = [...prev];
      newList.splice(index, 1);

      // If the current song is removed, set a new current song
      if (currentSong && currentSong.id === songId) {
        if (newList.length > 0) {
          const nextSong = newList[Math.min(index, newList.length - 1)];
          setCurrentSong(nextSong);
        } else {
          setCurrentSong(null);
          setIsPlaying(false);
        }
      }

      return newList;
    });
  };

  const clearPlaylist = (): void => {
    setSongsList([]);
    setCurrentSong(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  };

  const setPlaylist = (songs: Song[]): void => {
    setSongsList(songs);
    if (songs.length > 0) {
      if (!currentSong) {
        setCurrentSong(songs[0]);
      }
    } else {
      setCurrentSong(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    }
  };

  return {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    bufferedPercentage,
    repeat,
    isShuffling,
    songsList,
    play,
    pause,
    togglePlay,
    setVolume,
    seekTo,
    playNext,
    playPrevious,
    toggleRepeat,
    toggleShuffle,
    playSong,
    addSong,
    removeSong,
    clearPlaylist,
    setPlaylist,
    mute,
    unmute,
    isMuted,
  };
};

export default useAudioPlayer;
