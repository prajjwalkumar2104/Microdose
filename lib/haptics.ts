// lib/haptics.ts

export const triggerTickVibration = () => {
  // Safe check for Server-Side Rendering and device support
  if (typeof window !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(10); // A tiny, sharp 10-millisecond physical tap
    } catch (e) {
      console.error("Haptics failed", e);
    }
  }
};

export const triggerDoneVibration = () => {
  if (typeof window !== "undefined" && navigator.vibrate) {
    try {
      // A premium "Double Pulse" (200ms on, 100ms pause, 200ms on)
      navigator.vibrate([200, 100, 200]); 
    } catch (e) {
      console.error("Haptics failed", e);
    }
  }
};