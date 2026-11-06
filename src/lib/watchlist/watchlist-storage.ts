/**
 * SHADOR - ShadowWatch Target Asset Inventory & Persistence Helper
 * Standard: IEEE Std 830-1998 Tactical Asset Management
 */

import type { WatchlistTarget } from "../types/scanner";

const STORAGE_KEY = "shador:watchlist:v1";
const LEGACY_STORAGE_KEY = "shadowtrace:watchlist:v1";

export function getWatchlist(): WatchlistTarget[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WatchlistTarget[];
  } catch {
    return [];
  }
}

export function saveWatchlist(targets: WatchlistTarget[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
  } catch {
    // Storage quota fallback
  }
}

export function addTargetToWatchlist(target: Omit<WatchlistTarget, "id" | "addedAt">): WatchlistTarget[] {
  const existing = getWatchlist();
  const lowerDomain = target.domain.toLowerCase().trim();

  // If already exists, update properties
  const foundIndex = existing.findIndex((t) => t.domain.toLowerCase() === lowerDomain);
  if (foundIndex >= 0) {
    existing[foundIndex] = {
      ...existing[foundIndex],
      ...target,
    };
    saveWatchlist(existing);
    return existing;
  }

  const newEntry: WatchlistTarget = {
    ...target,
    id: `watch-${Math.random().toString(36).substring(2, 9)}`,
    addedAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...existing];
  saveWatchlist(updated);
  return updated;
}

export function removeTargetFromWatchlist(domain: string): WatchlistTarget[] {
  const existing = getWatchlist();
  const lowerDomain = domain.toLowerCase().trim();
  const filtered = existing.filter((t) => t.domain.toLowerCase() !== lowerDomain);
  saveWatchlist(filtered);
  return filtered;
}

export function isTargetInWatchlist(domain: string): boolean {
  const existing = getWatchlist();
  const lowerDomain = domain.toLowerCase().trim();
  return existing.some((t) => t.domain.toLowerCase() === lowerDomain);
}
