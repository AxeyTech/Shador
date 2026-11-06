"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { tacticalAudio } from "./sound-synthesizer";

interface AudioContextValue {
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  playClick: () => void;
  playPing: () => void;
  playScanDispatch: () => void;
  playSuccess: () => void;
  playAlert: () => void;
  playDownload: () => void;
  triggerHaptic: (type?: "light" | "medium" | "heavy" | "warning" | "success") => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  useEffect(() => {
    setIsAudioEnabled(tacticalAudio.getStatus());
  }, []);

  const toggleAudio = () => {
    const next = tacticalAudio.toggle();
    setIsAudioEnabled(next);
  };

  const value: AudioContextValue = {
    isAudioEnabled,
    toggleAudio,
    playClick: () => {
      tacticalAudio.triggerHaptic("light");
      tacticalAudio.playClick();
    },
    playPing: () => {
      tacticalAudio.triggerHaptic("medium");
      tacticalAudio.playTacticalPing();
    },
    playScanDispatch: () => {
      tacticalAudio.triggerHaptic("heavy");
      tacticalAudio.playScanDispatch();
    },
    playSuccess: () => {
      tacticalAudio.triggerHaptic("success");
      tacticalAudio.playSuccessChime();
    },
    playAlert: () => {
      tacticalAudio.triggerHaptic("warning");
      tacticalAudio.playAlertSound();
    },
    playDownload: () => {
      tacticalAudio.triggerHaptic("light");
      tacticalAudio.playDownloadChirp();
    },
    triggerHaptic: (type = "light") => tacticalAudio.triggerHaptic(type),
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useTacticalAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    return {
      isAudioEnabled: false,
      toggleAudio: () => {},
      playClick: () => {},
      playPing: () => {},
      playScanDispatch: () => {},
      playSuccess: () => {},
      playAlert: () => {},
      playDownload: () => {},
      triggerHaptic: () => {},
    };
  }
  return context;
}
