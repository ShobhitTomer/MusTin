import { Song } from "../types/types";

// Helper function to fetch songs from a JSON file
export const loadSongsFromJson = async (
  jsonPath: string = "/songs.json"
): Promise<Song[]> => {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error(`Failed to load songs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.songs as Song[];
  } catch (error) {
    console.error("Error loading songs:", error);
    return [];
  }
};

// Helper function to validate song data
export const validateSong = (song: any): song is Song => {
  return (
    typeof song.id === "number" &&
    typeof song.title === "string" &&
    typeof song.artist === "string" &&
    typeof song.album === "string" &&
    typeof song.duration === "number" &&
    typeof song.coverUrl === "string" &&
    typeof song.audioUrl === "string"
  );
};

// Helper function to check if audio file exists
export const checkAudioFile = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

// Helper function to format song duration
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Helper function to generate a placeholder cover art if image is missing
export const getPlaceholderCoverArt = (
  title: string,
  artist: string,
  size: number = 300
): string => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Generate a gradient background based on the title
  const hue = (title.charCodeAt(0) || 0) % 360;
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, `hsl(${hue}, 80%, 30%)`);
  gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 80%, 15%)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add title and artist text
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "center";
  ctx.font = `bold ${size / 10}px sans-serif`;
  ctx.fillText(title, size / 2, size / 2);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = `${size / 15}px sans-serif`;
  ctx.fillText(artist, size / 2, size / 2 + size / 10);

  return canvas.toDataURL();
};
