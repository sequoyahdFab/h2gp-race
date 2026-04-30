import { useEffect, useRef, useCallback } from 'react';

// Polls a LiveRC results URL and returns new lap times as they appear.
// Uses allorigins.win as a CORS proxy since LiveRC doesn't expose CORS headers.
export function useLiveRCPoller({ url, driverName, enabled, onNewLap }) {
  const knownCount = useRef(0);
  const timerRef = useRef(null);

  const poll = useCallback(async () => {
    if (!url || !enabled) return;
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      const json = await res.json();
      const html = json.contents || '';

      // Extract all decimal lap times from the results table
      // LiveRC renders lap times as e.g. "20.312" inside <td> cells
      const matches = [
        ...html.matchAll(/>\s*(\d{1,3}\.\d{2,4})\s*<\/td>/g),
      ]
        .map(m => parseFloat(m[1]))
        .filter(v => v > 4 && v < 600); // sanity: between 4s and 10min

      if (matches.length > knownCount.current) {
        const newTimes = matches.slice(knownCount.current);
        knownCount.current = matches.length;
        newTimes.forEach(t => onNewLap(t));
      }
    } catch {
      // Silently ignore — network errors during race shouldn't crash anything
    }
  }, [url, enabled, onNewLap]);

  useEffect(() => {
    if (!enabled || !url) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    poll(); // immediate first poll
    timerRef.current = setInterval(poll, 5000);
    return () => clearInterval(timerRef.current);
  }, [enabled, url, poll]);

  const reset = () => {
    knownCount.current = 0;
  };

  return { reset };
}
