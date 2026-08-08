import { useState, useEffect, useRef, useCallback } from "react";

export function useAccurateTimer(initialSeconds: number, onComplete: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  
  // Using a ref to track exact end time prevents drift and handles background tab throttling
  const endTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!isRunning) {
      endTimeRef.current = Date.now() + remaining * 1000;
      setIsRunning(true);
    }
  }, [remaining, isRunning]);

  const pause = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
  }, []);

  const reset = useCallback((newSeconds: number) => {
    setIsRunning(false);
    endTimeRef.current = null;
    setRemaining(newSeconds);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      if (endTimeRef.current) {
        const now = Date.now();
        const left = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
        setRemaining(left);
        
        if (left === 0) {
          setIsRunning(false);
          onComplete();
        }
      }
    }, 100); // Fast interval for immediate visual response
    
    return () => clearInterval(interval);
  }, [isRunning, onComplete]);

  return { remaining, start, pause, reset, isRunning };
}
