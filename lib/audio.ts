// lib/audio.ts

// 1. Create a single, shared audio context outside the functions
let audioCtx: AudioContext | null = null;

// 2. Helper to safely get/resume the context (handles Next.js SSR)
const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  
  // Browsers pause audio contexts until the user clicks something. 
  // This ensures it wakes up when they click "Spin".
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  
  return audioCtx;
};

export const playTick = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Snappy, mechanical tick sound
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Resonant glass chime sound
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); 
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3); 
    
    osc.start();
    osc.stop(ctx.currentTime + 3);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};