"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CrtContextValue {
  isCrtEnabled: boolean;
  toggleCrt: () => void;
}

const CrtContext = createContext<CrtContextValue | null>(null);

export function CrtProvider({ children }: { children: ReactNode }) {
  const [isCrtEnabled, setIsCrtEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("shador_crt_hud") || localStorage.getItem("shadowtrace_crt_hud");
      setIsCrtEnabled(stored === "true");
    }
  }, []);

  const toggleCrt = () => {
    setIsCrtEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("shador_crt_hud", next ? "true" : "false");
      }
      return next;
    });
  };

  return (
    <CrtContext.Provider value={{ isCrtEnabled, toggleCrt }}>
      {children}
    </CrtContext.Provider>
  );
}

export function useCrtHud(): CrtContextValue {
  const context = useContext(CrtContext);
  if (!context) {
    return {
      isCrtEnabled: false,
      toggleCrt: () => {},
    };
  }
  return context;
}
