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

type AudioPlayerType = "main" | "discover" | "playlist";

interface AudioContextProps {
  // General state
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  repeat: "none" | "one" | "all";
  isShuffling: boolean;
  songsList: Song[];

  // Playlist state
  playlistSongs: number[];

  // Player type functionality
  activePlayer: AudioPlayerType;
  setActivePlayer: (player: AudioPlayerType) => void;
  getActiveAudio: () => HTMLAudioElement | null;

  // Basic playback controls
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;

  // Song and playlist management
  playSong: (song: Song, playerType?: AudioPlayerType) => void;
  loadSongs: () => Promise<void>;
  getSongById: (id: number) => Song | undefined;
  addToPlaylist: (songId: number) => void;
  removeFromPlaylist: (songId: number) => void;
  isInPlaylist: (songId: number) => boolean;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Asset preloading
  preloadAssets: (songIds: number[]) => Promise<void>;
}

const AudioContext = createContext<AudioContextProps | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Basic player state
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
  const [playlistSongs, setPlaylistSongs] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePlayer, setActivePlayer] = useState<AudioPlayerType>("discover");

  // Audio element references for different players
  const audioRefs = useRef<Record<AudioPlayerType, HTMLAudioElement | null>>({
    main: null,
    discover: null,
    playlist: null,
  });

  // Track if songs have been loaded
  const songsLoadedRef = useRef(false);

  // Track if event listeners are set up
  const eventListenersSetupRef = useRef<Record<AudioPlayerType, boolean>>({
    main: false,
    discover: false,
    playlist: false,
  });

  // Get the current active audio element
  const getActiveAudio = useCallback(() => {
    return audioRefs.current[activePlayer];
  }, [activePlayer]);

  // Initialize audio elements
  useEffect(() => {
    const playerTypes: AudioPlayerType[] = ["main", "discover", "playlist"];

    playerTypes.forEach((type) => {
      if (!audioRefs.current[type]) {
        audioRefs.current[type] = new Audio();
        setupEventListeners(type);
      }
    });

    return () => {
      // Cleanup audio elements
      playerTypes.forEach((type) => {
        if (audioRefs.current[type]) {
          audioRefs.current[type]?.pause();
          cleanupEventListeners(type);
        }
      });
    };
  }, []);

  // Set up event listeners for an audio element
  const setupEventListeners = (playerType: AudioPlayerType) => {
    if (eventListenersSetupRef.current[playerType]) return;

    const audio = audioRefs.current[playerType];
    if (!audio) return;

    audio.addEventListener("timeupdate", () => handleTimeUpdate(playerType));
    audio.addEventListener("loadedmetadata", () =>
      handleMetadataLoaded(playerType)
    );
    audio.addEventListener("ended", () => handleSongEnd(playerType));
    audio.addEventListener("error", (e) =>
      console.error(`Audio error (${playerType}):`, e)
    );

    eventListenersSetupRef.current[playerType] = true;
  };

  // Clean up event listeners for an audio element
  const cleanupEventListeners = (playerType: AudioPlayerType) => {
    const audio = audioRefs.current[playerType];
    if (!audio) return;

    audio.removeEventListener("timeupdate", () => handleTimeUpdate(playerType));
    audio.removeEventListener("loadedmetadata", () =>
      handleMetadataLoaded(playerType)
    );
    audio.removeEventListener("ended", () => handleSongEnd(playerType));
    audio.removeEventListener("error", (e) =>
      console.error(`Audio error (${playerType}):`, e)
    );

    eventListenersSetupRef.current[playerType] = false;
  };

  // Event handlers
  const handleTimeUpdate = (playerType: AudioPlayerType) => {
    if (playerType === activePlayer) {
      setCurrentTime(audioRefs.current[playerType]?.currentTime || 0);
    }
  };

  const handleMetadataLoaded = (playerType: AudioPlayerType) => {
    if (playerType === activePlayer) {
      setDuration(audioRefs.current[playerType]?.duration || 0);
    }
  };

  const handleSongEnd = (playerType: AudioPlayerType) => {
    if (playerType !== activePlayer) return;

    if (repeat === "one") {
      seekTo(0);
      audioRefs.current[playerType]
        ?.play()
        .catch((err) => console.error("Replay error:", err));
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

  // Load songs from JSON data
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

      // Preload the first few songs
      if (songs.length > 0) {
        await preloadAssets(
          songs.slice(0, Math.min(3, songs.length)).map((song) => song.id)
        );
      }
    } catch (error) {
      console.error("Failed to load songs:", error);
    }
  }, [currentSong, isShuffling]);

  // Update playback order
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

  // Update playback order when shuffling or songs list changes
  useEffect(() => {
    if (songsList.length > 0) {
      updatePlaybackOrder(songsList, isShuffling);
    }
  }, [isShuffling, songsList, updatePlaybackOrder]);

  // Playlist management
  const addToPlaylist = (songId: number) => {
    if (!playlistSongs.includes(songId)) {
      setPlaylistSongs((prev) => [...prev, songId]);
    }
  };

  const removeFromPlaylist = (songId: number) => {
    setPlaylistSongs((prev) => prev.filter((id) => id !== songId));
  };

  const isInPlaylist = (songId: number) => {
    return playlistSongs.includes(songId);
  };

  // Get song by ID
  const getSongById = (id: number) => {
    return songsList.find((song) => song.id === id);
  };

  // Basic playback controls
  const play = useCallback(() => {
    if (!currentSong) return;

    // When playing, pause all other players
    Object.keys(audioRefs.current).forEach((type) => {
      const playerType = type as AudioPlayerType;
      if (playerType !== activePlayer && audioRefs.current[playerType]) {
        audioRefs.current[playerType]?.pause();
      }
    });

    getActiveAudio()
      ?.play()
      .catch((err) => console.error(`Failed to play (${activePlayer}):`, err));
    setIsPlaying(true);
  }, [activePlayer, currentSong, getActiveAudio]);

  const pause = useCallback(() => {
    getActiveAudio()?.pause();
    setIsPlaying(false);
  }, [getActiveAudio]);

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setAudioVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));

    // Set volume for all audio elements
    Object.keys(audioRefs.current).forEach((type) => {
      const playerType = type as AudioPlayerType;
      if (audioRefs.current[playerType]) {
        audioRefs.current[playerType]!.volume = clampedVolume;
      }
    });

    setVolume(clampedVolume);
  };

  const seekTo = useCallback((time: number) => {
    const audio = getActiveAudio();
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, [getActiveAudio]);

  const playNext = () => {
    if (songsList.length === 0) return;

    const nextIndex = (currentSongIndex + 1) % playbackOrder.length;
    setCurrentSongIndex(nextIndex);

    const nextSong = songsList[playbackOrder[nextIndex]];
    if (nextSong) {
      playSong(nextSong);
    }
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
    const prevSong = songsList[playbackOrder[prevIndex]];
    if (prevSong) {
      playSong(prevSong);
    }
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

  // Play a specific song using the appropriate player
  const playSong = useCallback((song: Song, playerType?: AudioPlayerType) => {
    const targetPlayer = playerType || activePlayer;

    // If we're switching player types, pause the current one
    if (targetPlayer !== activePlayer) {
      // Pause the audio element for the current player
      if (audioRefs.current[activePlayer]) {
        audioRefs.current[activePlayer]?.pause();
      }
      setActivePlayer(targetPlayer);
    }

    // Update song index in playback order
    const songIndex = songsList.findIndex((s) => s.id === song.id);
    if (songIndex !== -1) {
      const playbackOrderIndex = playbackOrder.findIndex(
        (i) => i === songIndex
      );
      if (playbackOrderIndex !== -1) {
        setCurrentSongIndex(playbackOrderIndex);
      }
    }

    // Set the current song
    setCurrentSong(song);

    // Update audio source and play
    const audio = audioRefs.current[targetPlayer];
    if (audio) {
      audio.src = song.audioUrl;
      audio.volume = volume;

      // Play the song
      audio
        .play()
        .catch((error) =>
          console.error(`Playback error (${targetPlayer}):`, error)
        );

      setIsPlaying(true);
    }
  }, [activePlayer, playbackOrder, songsList, volume]);

  // Preload specific song assets (audio and cover art)
  const preloadAssets = async (songIds: number[]): Promise<void> => {
    if (songIds.length === 0) return;

    // Get the full song objects
    const songsToPreload = songIds
      .map((id) => getSongById(id))
      .filter((song): song is Song => !!song);

    if (songsToPreload.length === 0) return;

    // Preload cover images
    const imagePromises = songsToPreload.map((song) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        img.src = song.coverUrl;
      });
    });

    // Preload audio files
    const audioPromises = songsToPreload.map((song) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio();

        audio.oncanplaythrough = () => {
          audio.pause();
          resolve();
        };

        audio.onerror = () => {
          console.error(`Failed to preload audio: ${song.audioUrl}`);
          resolve(); // Continue even if audio fails
        };

        audio.src = song.audioUrl;
        audio.load();

        // Try to start and immediately pause to ensure it's in the browser cache
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {
            // Continue even if play/pause fails
          });
      });
    });

    // Wait for all preloading to finish
    await Promise.all([...imagePromises, ...audioPromises]);

    // Additional attempt to cache via service worker if available
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_SONGS",
        songUrls: [
          ...songsToPreload.map((song) => song.audioUrl),
          ...songsToPreload.map((song) => song.coverUrl),
        ],
      });
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
    isLoading,
    setIsLoading,
    preloadAssets,
    activePlayer,
    setActivePlayer,
    getActiveAudio,
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