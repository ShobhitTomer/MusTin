import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Song } from "../types/types";
import songsData from "../songs.json";

interface AudioContextProps {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  repeat: "none" | "one" | "all";
  isShuffling: boolean;
  songsList: Song[];
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  playSong: (song: Song) => void;
  loadSongs: () => Promise<void>;
  getSongById: (id: number) => Song | undefined;
  playlistSongs: number[];
  addToPlaylist: (songId: number) => void;
  removeFromPlaylist: (songId: number) => void;
  isInPlaylist: (songId: number) => boolean;
}

const AudioContext = createContext<AudioContextProps | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState<"none" | "one" | "all">("none");
  const [isShuffling, setIsShuffling] = useState(false);
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [playbackOrder, setPlaybackOrder] = useState<number[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  // Add playlist functionality
  const [playlistSongs, setPlaylistSongs] = useState<number[]>([]);

  // Add this to track if songs have been loaded
  const songsLoadedRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add to playlist
  const addToPlaylist = (songId: number) => {
    if (!playlistSongs.includes(songId)) {
      setPlaylistSongs((prev) => [...prev, songId]);
    }
  };

  // Remove from playlist
  const removeFromPlaylist = (songId: number) => {
    setPlaylistSongs((prev) => prev.filter((id) => id !== songId));
  };

  // Check if song is in playlist
  const isInPlaylist = (songId: number) => {
    return playlistSongs.includes(songId);
  };

  // Get song by ID
  const getSongById = (id: number) => {
    return songsList.find((song) => song.id === id);
  };

  // Load songs from JSON data - make this a useCallback to avoid recreation on each render
  const loadSongs = useCallback(async (): Promise<void> => {
    if (songsLoadedRef.current) return; // Skip if already loaded

    try {
      // In a real application, you might fetch this from an API
      const songs = songsData.songs as Song[];
      setSongsList(songs);
      if (songs.length > 0 && !currentSong) {
        setCurrentSong(songs[0]);
      }
      // Mark as loaded to prevent future calls
      songsLoadedRef.current = true;

      // Update playback order after loading songs
      updatePlaybackOrder(songs, isShuffling);
    } catch (error) {
      console.error("Failed to load songs:", error);
    }
  }, [currentSong, isShuffling]);

  // Update playback order function that doesn't depend on state
  const updatePlaybackOrder = useCallback(
    (songs: Song[], shuffle: boolean) => {
      const indices = Array.from(Array(songs.length).keys());
      if (shuffle) {
        // Fisher-Yates shuffle algorithm
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
      }
      setPlaybackOrder(indices);

      if (currentSong) {
        const currentIdIndex = indices.findIndex(
          (i) => songs[i]?.id === currentSong.id
        );
        if (currentIdIndex !== -1) {
          setCurrentSongIndex(currentIdIndex);
        }
      }
    },
    [currentSong]
  );

  useEffect(() => {
    // Load songs on initial mount only
    loadSongs();

    audioRef.current = new Audio();
    const audio = audioRef.current;

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleMetadataLoaded);
    audio.addEventListener("ended", handleSongEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleMetadataLoaded);
      audio.removeEventListener("ended", handleSongEnd);
    };
  }, [loadSongs]);

  useEffect(() => {
    if (currentSong) {
      const audio = audioRef.current!;
      audio.src = currentSong.audioUrl;
      audio.volume = volume;

      if (isPlaying) {
        audio.play().catch((error) => console.error("Playback error:", error));
      }
    }
  }, [currentSong]);

  useEffect(() => {
    // Update playback order when shuffling changes or songsList changes
    if (songsList.length > 0) {
      updatePlaybackOrder(songsList, isShuffling);
    }
  }, [isShuffling, songsList, updatePlaybackOrder]);

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current?.currentTime || 0);
  };

  const handleMetadataLoaded = () => {
    setDuration(audioRef.current?.duration || 0);
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

  const play = () => {
    if (!currentSong) return;

    audioRef.current
      ?.play()
      .catch((err) => console.error("Failed to play:", err));
    setIsPlaying(true);
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setAudioVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    setVolume(clampedVolume);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const playNext = () => {
    if (songsList.length === 0) return;

    const nextIndex = (currentSongIndex + 1) % playbackOrder.length;
    setCurrentSongIndex(nextIndex);
    setCurrentSong(songsList[playbackOrder[nextIndex]]);
  };

  const playPrevious = () => {
    if (songsList.length === 0) return;

    // If we're more than 3 seconds into the song, restart the current song
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = playbackOrder.length - 1;

    setCurrentSongIndex(prevIndex);
    setCurrentSong(songsList[playbackOrder[prevIndex]]);
  };

  const toggleRepeat = () => {
    const modes: ("none" | "one" | "all")[] = ["none", "one", "all"];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  const toggleShuffle = () => {
    setIsShuffling(!isShuffling);
  };

  const playSong = (song: Song) => {
    const songIndex = songsList.findIndex((s) => s.id === song.id);
    if (songIndex !== -1) {
      const playbackOrderIndex = playbackOrder.findIndex(
        (i) => i === songIndex
      );
      setCurrentSongIndex(playbackOrderIndex !== -1 ? playbackOrderIndex : 0);
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const contextValue = {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    repeat,
    isShuffling,
    songsList,
    play,
    pause,
    togglePlay,
    setVolume: setAudioVolume,
    seekTo,
    playNext,
    playPrevious,
    toggleRepeat,
    toggleShuffle,
    playSong,
    loadSongs,
    getSongById,
    playlistSongs,
    addToPlaylist,
    removeFromPlaylist,
    isInPlaylist,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextProps => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
