"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, BookOpen, ChevronDown } from "lucide-react";
import { categories, topics, Topic } from "@/lib/data";
import { useAccurateTimer } from "@/hooks/useAccurateTimer";
import { playTick, playChime } from "@/lib/audio";
import { useWakeLock } from "@/hooks/useWakeLock";

type Phase = "SETUP" | "SPINNING" | "RULE_GATE" | "RESEARCH" | "SPEECH" | "COMPLETE";
type Theme = "midnight" | "paper" | "nostalgia";

const RESEARCH_TIME = 10 * 60;
const SPEECH_TIME = 2 * 60;

export default function Home() {
  const [theme, setTheme] = useState<Theme>("midnight");
  const [phase, setPhase] = useState<Phase>("SETUP");
  const [selectedCatId, setSelectedCatId] = useState<string>("gen");
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [spinText, setSpinText] = useState("Drawing...");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Timer & Audio
  const { remaining, start, reset, isRunning } = useAccurateTimer(0, () => {
    playChime();
    if (phase === "RESEARCH") transitionTo("SPEECH");
    if (phase === "SPEECH") transitionTo("COMPLETE");
  });

  // Mobile Screen Sleep Fix
  useWakeLock(isRunning);

  // Theme Toggle Logic
  useEffect(() => {
    document.body.classList.add("bg-background", "text-primary", "selection:bg-accent/30");
    document.body.classList.remove("theme-paper", "theme-nostalgia");
    
    if (theme !== "midnight") {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  // Pro Keyboard Shortcuts (Still active silently in the background)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts if the custom category dropdown is currently open
      if (isDropdownOpen) return;

      switch (e.code) {
        case "Space":
          e.preventDefault(); // Prevents aggressive page scrolling
          if (phase === "SETUP") handleSpin();
          else if (phase === "RULE_GATE") transitionTo("RESEARCH");
          else if (phase === "SPEECH" && !isRunning && remaining === SPEECH_TIME) start();
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
  }, [phase, isRunning, remaining, selectedCatId, isDropdownOpen, reset]); 

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
      playTick(); 
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
      reset(RESEARCH_TIME);
      start();
    }
    if (newPhase === "SPEECH") {
      reset(SPEECH_TIME);
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
              <p className="text-accent text-xs font-bold tracking-[0.4em] uppercase mb-8 opacity-80">Drawing...</p>
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
              <p className="text-accent text-xs font-bold tracking-[0.4em] uppercase mb-8 opacity-80">Your Topic</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl text-topic mb-14 leading-[1.1] tracking-tighter select-text">
                {currentTopic.title}
              </h2>
              
              {/* Reroll & Start Buttons (Side by Side) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSpin}
                  className="group relative overflow-hidden bg-transparent border border-primary/20 text-primary/80 px-10 py-4 rounded-full font-semibold tracking-widest uppercase text-xs hover:border-primary/50 hover:text-primary transition-all duration-300"
                >
                  Spin Again
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => transitionTo("RESEARCH")}
                  className="group relative overflow-hidden bg-background/20 backdrop-blur-sm border border-primary/20 text-primary px-12 py-4 rounded-full font-semibold tracking-widest uppercase text-xs hover:border-accent hover:text-accent transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.05)]"
                >
                  <span className="relative z-10">Start 10 Min Research</span>
                  <div className="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out" />
                </motion.button>
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
                      strokeDashoffset: `calc(300% - (300% * ${remaining}) / ${phase === "RESEARCH" ? RESEARCH_TIME : SPEECH_TIME})`
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
                !isRunning && remaining === SPEECH_TIME && (
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
    </div>
  );
}