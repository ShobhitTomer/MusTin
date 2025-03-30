// Song type definition
export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
}

// Repeat mode type
export type RepeatMode = "none" | "one" | "all";

// Playlist type
export interface Playlist {
  id: number;
  name: string;
  songs: Song[];
}

// Audio player state type
export interface AudioPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  repeat: RepeatMode;
  isShuffling: boolean;
  isMuted: boolean;
}

// Theme colors interface
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  backgroundGradient: string;
  backgroundLight: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
}

// Theme interface
export interface Theme {
  colors: ThemeColors;
  shadows: {
    light: string;
    medium: string;
    heavy: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}
