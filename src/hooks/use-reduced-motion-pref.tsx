// User preference for reduced motion, persisted in localStorage.
// Combines with the OS-level prefers-reduced-motion setting via framer-motion.
//
// Storage key: "se:reduced-motion" -> "1" | "0"
// Custom event "se:reduced-motion-change" fires on change so any subscribed
// component re-reads the value without a full reload.

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "se:reduced-motion";
const EVENT_NAME = "se:reduced-motion-change";

function readPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useReducedMotionPref(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => readPref());

  useEffect(() => {
    const sync = () => setEnabled(readPref());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((v: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      // ignore quota / privacy mode
    }
    setEnabled(v);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return [enabled, update];
}

/** Read-only variant for components that just need to react to the value. */
export function useReducedMotionPrefValue(): boolean {
  const [enabled] = useReducedMotionPref();
  return enabled;
}
