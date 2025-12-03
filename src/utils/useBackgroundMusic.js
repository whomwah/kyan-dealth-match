import { useEffect, useRef, useCallback } from "react";

const MUSIC_PATH = "/audios/xmas.mp3";
const VOLUME_NORMAL = 0.5;
const VOLUME_GAME = 0.25;

/**
 * Hook to manage background music playback.
 * Starts playing looped music and adjusts volume based on game state.
 *
 * @param {boolean} gameReady - Whether the game has started (lowers volume)
 * @returns {{ play: () => void, pause: () => void, isPlaying: boolean }}
 */
export function useBackgroundMusic(gameReady = false) {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio(MUSIC_PATH);
    audio.loop = true;
    audio.volume = VOLUME_NORMAL;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Adjust volume based on game state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = gameReady ? VOLUME_GAME : VOLUME_NORMAL;
    }
  }, [gameReady]);

  const play = useCallback(() => {
    if (audioRef.current && !isPlayingRef.current) {
      audioRef.current.play().catch((err) => {
        // Browser may block autoplay until user interaction
        console.warn("Background music play blocked:", err.message);
      });
      isPlayingRef.current = true;
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  }, []);

  return { play, pause, isPlaying: isPlayingRef.current };
}
