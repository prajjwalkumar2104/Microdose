"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Moon, Sun, BookOpen, ChevronDown, Settings, X } from "lucide-react";
import { categories, topics, Topic } from "@/lib/data";
import { useAccurateTimer } from "@/hooks/useAccurateTimer";
import { playTick, playChime } from "@/lib/audio";
import { useWakeLock } from "@/hooks/useWakeLock";

type Phase = "SETUP" | "SPINNING" | "RULE_GATE" | "RESEARCH" | "SPEECH" | "COMPLETE";
type Theme = "midnight" | "paper" | "nostalgia";

// --- ADVANCED MAGNETIC PHYSICS WRAPPER ---
function MagneticWrapper({ children, pull = 0.2 }: { children: React.ReactNode, pull?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // The spring physics: tightly coiled, fast snapback, slightly heavy
  const springConfig = { damping: 15, stiffness: 250, mass: 0.2 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    
    // Calculate the distance from the exact center of the button
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    
    // Apply the magnetic pull
    x.set(middleX * pull);
    y.set(middleY * pull);
  };

  const handleMouseLeave = () => {
    // Snap back to absolute center when the cursor leaves
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="relative flex items-center justify-center z-10"
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>("midnight");
  const [phase, setPhase] = useState<Phase>("SETUP");
  const [selectedCatId, setSelectedCatId] = useState<string>("gen");
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [spinText, setSpinText] = useState("Drawing...");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings State
  const [speechTime, setSpeechTime] = useState(2); // In minutes
  const [researchTime, setResearchTime] = useState(10); // In minutes
  const [isMuted, setIsMuted] = useState(false);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  // Load Settings from LocalStorage on Mount
  useEffect(() => {
    const saved = localStorage.getItem("microdose_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.speechTime) setSpeechTime(parsed.speechTime);
      if (parsed.researchTime) setResearchTime(parsed.researchTime);
      if (parsed.isMuted !== undefined) setIsMuted(parsed.isMuted);
    }
    setHasLoadedSettings(true);
  }, []);

  // Save Settings whenever they change
  useEffect(() => {
    if (hasLoadedSettings) {
      localStorage.setItem(
        "microdose_settings",
        JSON.stringify({ speechTime, researchTime, isMuted })
      );
    }
  }, [speechTime, researchTime, isMuted, hasLoadedSettings]);

  // Timer & Audio
  const { remaining, start, reset, isRunning } = useAccurateTimer(0, () => {
    if (!isMuted) playChime();
    if (phase === "RESEARCH") transitionTo("SPEECH");
    if (phase === "SPEECH") transitionTo("COMPLETE");
  });

  // Mobile Screen Sleep Fix
  useWakeLock(isRunning);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service Worker registration failed: ", err);
      });
    }
  }, []);

  // Theme Toggle Logic
  useEffect(() => {
    document.body.classList.add("bg-background", "text-primary", "selection:bg-accent/30");
    document.body.classList.remove("theme-midnight", "theme-paper", "theme-nostalgia");
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Pro Keyboard Shortcuts (Still active silently in the background)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts if custom dropdowns or modals are open
      if (isDropdownOpen || isSettingsOpen) return;

      switch (e.code) {
        case "Space":
          e.preventDefault(); 
          if (phase === "SETUP") handleSpin();
          else if (phase === "RULE_GATE") transitionTo("RESEARCH");
          else if (phase === "SPEECH" && !isRunning && remaining === speechTime * 60) start();
          else if (phase === "COMPLETE") transitionTo("SETUP");
          break;
          
        case "Enter":
          if (phase === "RESEARCH") transitionTo("SPEECH");
          break;
          
        case "Escape":
          if (phase !== "SETUP") {
            setPhase("SETUP");
            reset(0); 
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, isRunning, remaining, selectedCatId, isDropdownOpen, isSettingsOpen, reset, speechTime]); 

  const cycleTheme = () => {
    const themes: Theme[] = ["midnight", "paper", "nostalgia"];
    setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
  };

  const getRandomTopic = (catId: string) => {
    const available = topics.filter((t) => t.categoryId === catId);
    if (available.length === 0) return topics[Math.floor(Math.random() * topics.length)];
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleSpin = () => {
    setPhase("SPINNING");
    let ticks = 0;
    const interval = setInterval(() => {
      setSpinText(topics[Math.floor(Math.random() * topics.length)].title);
      if (!isMuted) playTick(); 
      ticks++;
      if (ticks > 15) {
        clearInterval(interval);
        setCurrentTopic(getRandomTopic(selectedCatId));
        setPhase("RULE_GATE");
      }
    }, 80);
  };

  const transitionTo = (newPhase: Phase) => {
    setPhase(newPhase);
    if (newPhase === "RESEARCH") {
      reset(researchTime * 60);
      start();
    }
    if (newPhase === "SPEECH") {
      reset(speechTime * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-700 overflow-x-hidden select-none">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-accent/20 blur-[140px] rounded-full pointer-events-none opacity-50 mix-blend-screen transition-opacity duration-1000" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-40 mix-blend-screen transition-opacity duration-1000" />
      <div className="absolute bottom-[-20%] left-[10%] w-[700px] h-[700px] bg-accent/10 blur-[150px] rounded-full pointer-events-none opacity-30 mix-blend-screen" />

      {/* Header */}
      <div className="pt-10 md:pt-16 flex flex-col items-center space-y-2 z-10 flex-shrink-0">
        <h1 className="font-serif text-4xl md:text-5xl text-topic tracking-tight">Microdose</h1>
        <p className="text-secondary/70 text-sm md:text-base font-medium flex items-center gap-2">
          made by <span className="text-primary/60 bg-primary/5 border border-primary/10 px-3 py-1 rounded-full text-xs tracking-widest uppercase">@you</span>
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center pt-12 md:pt-16 w-full px-6 pb-12 z-10">
        <AnimatePresence mode="wait">
          
          {/* SETUP PHASE */}
          {phase === "SETUP" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center space-y-8 w-full max-w-sm"
            >
              <div className="text-center space-y-4 w-full">
                <p className="text-secondary text-base md:text-lg font-medium tracking-wide opacity-90">
                  Minimal prep. Try to think quick on your feet.
                </p>
                
                {/* Premium Glassmorphism Dropdown */}
                <div className="relative w-full z-50">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between bg-background/40 backdrop-blur-md border border-primary/10 text-primary py-4 px-6 rounded-2xl cursor-pointer hover:bg-background/60 hover:border-accent/40 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">{categories.find(c => c.id === selectedCatId)?.icon}</span>
                      <span className="font-medium text-sm md:text-base tracking-wide">{categories.find(c => c.id === selectedCatId)?.name}</span>
                    </div>
                    <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                      <ChevronDown size={18} className="text-secondary" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="absolute top-full left-0 right-0 mt-3 z-50 bg-background/80 backdrop-blur-2xl border border-primary/10 rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.2)] overflow-hidden"
                        >
                          <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                            {categories.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedCatId(c.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                                  selectedCatId === c.id
                                    ? "bg-accent/15 text-accent font-semibold"
                                    : "text-primary/80 hover:bg-primary/5 hover:text-primary"
                                }`}
                              >
                                <span className="text-xl">{c.icon}</span>
                                <span className="text-sm tracking-wide">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <motion.button
                whileHover={{ y: -2, boxShadow: "0 20px 40px rgba(217,119,87,0.25)" }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSpin}
                className="bg-accent text-background px-10 py-4 rounded-2xl font-bold tracking-[0.2em] uppercase text-xs shadow-[0_10px_20px_rgba(217,119,87,0.15)] transition-all duration-300 w-full"
              >
                Spin Topic
              </motion.button>
            </motion.div>
          )}

          {/* SPINNING PHASE */}
          {phase === "SPINNING" && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full max-w-4xl"
            >
              <p className="text-accent text-l font-bold tracking-[0.4em] uppercase mb-8 opacity-80">Drawing...</p>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-topic text-center blur-[3px] opacity-50 leading-[1.1] tracking-tighter">
                {spinText}
              </h2>
            </motion.div>
          )}

          {/* RULE GATE */}
          {phase === "RULE_GATE" && currentTopic && (
            <motion.div
              key="rule_gate"
              initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center w-full max-w-4xl text-center"
            >
              <p className="text-accent text-l font-bold tracking-[0.4em] uppercase mb-8 opacity-80">Your Topic</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl text-topic mb-14 leading-[1.1] tracking-tighter select-text">
                {currentTopic.title}
              </h2>
              
              {/* Reroll & Start Buttons & Settings */}
              {/* Reroll & Start Buttons & Settings */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                
                <MagneticWrapper pull={0.15}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSpin}
                    className="group relative overflow-hidden bg-transparent border border-primary/20 text-primary/80 px-10 py-4 rounded-full font-semibold tracking-widest uppercase text-xs hover:border-primary/50 hover:text-primary transition-all duration-300"
                  >
                    Spin Again
                  </motion.button>
                </MagneticWrapper>

                <MagneticWrapper pull={0.1}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => transitionTo("RESEARCH")}
                    className="group relative overflow-hidden bg-background/20 backdrop-blur-sm border border-primary/20 text-primary px-12 py-4 rounded-full font-semibold tracking-widest uppercase text-xs hover:border-accent hover:text-accent transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.05)]"
                  >
                    <span className="relative z-10">Start {researchTime} Min Research</span>
                    <div className="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out" />
                  </motion.button>
                </MagneticWrapper>

                <MagneticWrapper pull={0.3}>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-4 rounded-full bg-background/20 backdrop-blur-sm border border-primary/20 text-secondary hover:text-primary hover:border-primary/50 transition-all duration-300"
                  >
                    <Settings size={18} />
                  </motion.button>
                </MagneticWrapper>

              </div>
            </motion.div>
          )}

          {/* RESEARCH & SPEECH PHASES */}
          {(phase === "RESEARCH" || phase === "SPEECH") && currentTopic && (
            <motion.div
              key="active_session"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center w-full max-w-3xl"
            >
              <div className="text-center mb-12">
                <p className="text-accent text-xs font-bold tracking-[0.4em] uppercase mb-6 opacity-80">
                  {phase === "RESEARCH" ? "Research Phase" : "Speaking Phase"}
                </p>
                <h2 className="font-serif text-3xl md:text-5xl text-topic opacity-95 leading-[1.1] tracking-tighter max-w-2xl mx-auto select-text">
                  {currentTopic.title}
                </h2>
              </div>

              <div className="relative flex items-center justify-center w-64 h-64 md:w-72 md:h-72 rounded-full border-[1px] border-primary/20 mb-12 shadow-[inset_0_0_60px_rgba(0,0,0,0.03)] bg-background/10 backdrop-blur-md">
                <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible">
                  <motion.circle
                    cx="50%" cy="50%" r="48%"
                    className="stroke-accent fill-none"
                    strokeWidth="3"
                    strokeDasharray="300%"
                    initial={{ strokeDashoffset: "0%" }}
                    animate={{
                      strokeDashoffset: `calc(300% - (300% * ${remaining}) / ${phase === "RESEARCH" ? researchTime * 60 : speechTime * 60})`
                    }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.8 }}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-serif text-6xl md:text-7xl text-topic relative z-10 tabular-nums tracking-tighter drop-shadow-lg">
                  {formatTime(remaining)}
                </span>
              </div>

              {phase === "RESEARCH" ? (
                <button
                  onClick={() => transitionTo("SPEECH")}
                  className="text-secondary/70 text-sm font-medium hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-1 tracking-wide"
                >
                  Finished early? Skip to speech
                </button>
              ) : (
                !isRunning && remaining === speechTime * 60 && (
                  <motion.button
                    whileHover={{ y: -2, boxShadow: "0 20px 40px rgba(217,119,87,0.25)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={start}
                    className="bg-accent text-background px-14 py-5 rounded-full font-bold tracking-[0.2em] uppercase text-xs shadow-[0_10px_20px_rgba(217,119,87,0.15)] transition-all duration-300"
                  >
                    Start Speaking
                  </motion.button>
                )
              )}
            </motion.div>
          )}

          {/* COMPLETE PHASE */}
          {phase === "COMPLETE" && currentTopic && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center w-full max-w-4xl text-center"
            >
              <h2 className="font-serif text-5xl md:text-7xl text-topic mb-8 tracking-tighter">Session Complete</h2>
              <p className="text-secondary/80 text-lg mb-14 max-w-xl font-medium tracking-wide select-text">Topic: {currentTopic.title}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => transitionTo("SETUP")}
                className="bg-primary text-background px-12 py-4 rounded-full font-bold tracking-[0.2em] uppercase text-xs hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all duration-300"
              >
                Spin Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Controls */}
      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex space-x-4 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={cycleTheme}
          className="p-4 rounded-full bg-background/50 backdrop-blur-xl border border-primary/10 hover:bg-primary/10 transition-all duration-300 text-secondary hover:text-primary shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
          title="Toggle Theme"
        >
          {theme === "midnight" && <Moon size={18} />}
          {theme === "paper" && <Sun size={18} />}
          {theme === "nostalgia" && <BookOpen size={18} />}
        </motion.button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-6 right-6 text-secondary hover:text-primary transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-10">
                <h2 className="font-serif text-3xl text-topic mb-2 tracking-tight">Settings</h2>
                <p className="text-secondary/80 text-sm font-medium tracking-wide">Timer lengths in whole minutes.</p>
              </div>

              <div className="space-y-10">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-accent text-[11px] font-bold tracking-[0.2em] uppercase">Speech</label>
                    <span className="font-serif text-2xl text-primary">{speechTime} min</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1" 
                    value={speechTime} onChange={(e) => setSpeechTime(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all duration-300"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-secondary/50 text-[10px] tracking-widest mt-3">
                    <span>1 min</span>
                    <span>10 min</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-accent text-[11px] font-bold tracking-[0.2em] uppercase">Research</label>
                    <span className="font-serif text-2xl text-primary">{researchTime} min</span>
                  </div>
                  <input 
                    type="range" min="1" max="60" step="1" 
                    value={researchTime} onChange={(e) => setResearchTime(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all duration-300"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-secondary/50 text-[10px] tracking-widest mt-3 mb-1">
                    <span>1 min</span>
                    <span>60 min</span>
                  </div>
                  <p className="text-secondary/70 text-xs font-medium">Deep research only</p>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <label className="flex items-center gap-4 cursor-pointer group py-2">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded border border-white/20 group-hover:border-accent transition-colors overflow-hidden">
                      <input 
                        type="checkbox" 
                        checked={isMuted} 
                        onChange={(e) => setIsMuted(e.target.checked)}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <motion.div 
                        initial={false}
                        animate={{ scale: isMuted ? 1 : 0, opacity: isMuted ? 1 : 0 }}
                        className="w-3 h-3 bg-accent rounded-sm"
                      />
                    </div>
                    <span className="text-primary/90 text-sm font-medium tracking-wide group-hover:text-primary transition-colors">
                      Mute sound effects
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-12 pt-6 flex flex-col gap-4">
                <p className="text-secondary/50 text-xs font-medium text-center">Saved for next time.</p>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full bg-accent text-background py-4 rounded-xl font-bold tracking-[0.1em] uppercase text-xs shadow-lg transition-all duration-300"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}