import { useEffect, useRef, useCallback } from "react";

const MUSIC_PATH = "/audios/xmas.mp3";
const VOLUME_NORMAL = 0.5;
const VOLUME_GAME = 0.25;
const FADE_IN_DURATION_MS = 4000;
const FADE_STEP_MS = 50;

/**
 * Hook to manage background music playback.
 * Starts playing looped music with fade-in on first play,
 * and adjusts volume based on game state.
 *
 * @param {boolean} gameReady - Whether the game has started (lowers volume)
 * @returns {{ play: () => void, pause: () => void, isPlaying: boolean }}
 */
export function useBackgroundMusic(gameReady = false) {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const hasPlayedOnceRef = useRef(false);
  const fadeIntervalRef = useRef(null);

  const getTargetVolume = useCallback(() => {
    return gameReady ? VOLUME_GAME : VOLUME_NORMAL;
  }, [gameReady]);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio(MUSIC_PATH);
    audio.loop = true;
    audio.volume = VOLUME_NORMAL;
    audioRef.current = audio;

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Adjust volume based on game state (only if not currently fading in)
  useEffect(() => {
    if (
      audioRef.current &&
      hasPlayedOnceRef.current &&
      !fadeIntervalRef.current
    ) {
      audioRef.current.volume = gameReady ? VOLUME_GAME : VOLUME_NORMAL;
    }
  }, [gameReady]);

  const fadeIn = useCallback((targetVolume) => {
    if (!audioRef.current) return;

    // Clear any existing fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const steps = FADE_IN_DURATION_MS / FADE_STEP_MS;
    const volumeIncrement = targetVolume / steps;
    let currentStep = 0;

    audioRef.current.volume = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps || !audioRef.current) {
        if (audioRef.current) {
          audioRef.current.volume = targetVolume;
        }
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      } else {
        audioRef.current.volume = Math.min(
          volumeIncrement * currentStep,
          targetVolume,
        );
      }
    }, FADE_STEP_MS);
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && !isPlayingRef.current) {
      const targetVolume = getTargetVolume();
      const isFirstPlay = !hasPlayedOnceRef.current;

      if (isFirstPlay) {
        audioRef.current.volume = 0;
      }

      audioRef.current.play().catch((err) => {
        // Browser may block autoplay until user interaction
        console.warn("Background music play blocked:", err.message);
      });

      isPlayingRef.current = true;

      if (isFirstPlay) {
        hasPlayedOnceRef.current = true;
        fadeIn(targetVolume);
      }
    }
  }, [fadeIn, getTargetVolume]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      // Clear any ongoing fade
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  }, []);

  return { play, pause, isPlaying: isPlayingRef.current };
}
