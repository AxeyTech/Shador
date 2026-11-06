"use client";

import React, { useEffect, useState, useRef } from "react";

interface TextScrambleProps {
  text: string;
  speed?: number;
  className?: string;
  enabled?: boolean;
}

const GLYPHS = "!<>-_\\/[]{}—=+*^?#________0101XYZΔΩ§λ";

export function TextScramble({
  text,
  speed = 12,
  className = "",
  enabled = true,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isMounted, setIsMounted] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !enabled) {
      setDisplayText(text);
      return;
    }

    let frame = 0;
    const length = text.length;
    const totalFrames = Math.max(8, Math.min(24, Math.floor(length / 2)));

    const update = () => {
      let output = "";
      const completeCount = Math.floor((frame / totalFrames) * length);

      for (let i = 0; i < length; i++) {
        if (i < completeCount) {
          output += text[i];
        } else if (text[i] === " " || text[i] === "\n") {
          output += text[i];
        } else {
          output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }

      setDisplayText(output);

      if (frame < totalFrames) {
        frame++;
        frameRef.current = setTimeout(update, speed) as unknown as number;
      } else {
        setDisplayText(text);
      }
    };

    update();

    return () => {
      if (frameRef.current) {
        clearTimeout(frameRef.current);
      }
    };
  }, [text, isMounted, enabled, speed]);

  return <span className={className}>{displayText}</span>;
}
