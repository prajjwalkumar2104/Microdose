"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Moon, Sun, BookOpen } from "lucide-react";
import { categories, topics, Topic } from "@/lib/data";
import { useAccurateTimer } from "@/hooks/useAccurateTimer";

type Phase = "SETUP" | "SPINNING" | "RULE_GATE" | "RESEARCH" | "SPEECH" | "COMPLETE";
type Theme = "midnight" | "paper" | "nostalgia";

const RESEARCH_TIME = 10 * 60; // 10 minutes
const SPEECH_TIME = 2 * 60; // 2 minutes

export default function Home() {
  const [theme, setTheme] = useState<Theme>("midnight");
  const [phase, setPhase] = useState<Phase>("SETUP");
  const [selectedCatId, setSelectedCatId] = useState<string>("gen");
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [spinText, setSpinText] = useState("Drawing...");

  // Setup accurate timer to handle background tab throttling
  const { remaining, start, reset, isRunning } = useAccurateTimer(0, () => {
    if (phase === "RESEARCH") transitionTo("SPEECH");
    if (phase === "SPEECH") transitionTo("COMPLETE");
  });

  // Apply theme to wrapper
  useEffect(() => {
    if (theme === "midnight") document.body.className = "min-h-screen font-sans antialiased";
    else document.body.className = `min-h-screen font-sans antialiased theme-${theme}`;
  }, [theme]);

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
      ticks++;
      if (ticks > 15) {
        clearInterval(interval);
        setCurrentTopic(getRandomTopic(selectedCatId));
        setPhase("RULE_GATE");
      }
    }, 100);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative transition-colors duration-300">
      
      {/* Header */}
      <div className="absolute top-8 flex flex-col items-center space-y-1">
        <h1 className="font-serif text-3xl font-bold text-topic tracking-tight">Unprompted</h1>
        <p className="text-secondary text-sm">Minimal prep. Think quick on your feet.</p>
      </div>

      <AnimatePresence mode="wait">
        
        {/* SETUP PHASE */}
        {phase === "SETUP" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center space-y-16 mt-12"
          >
            <div className="flex flex-col items-center space-y-4">
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="bg-background border border-accent/30 text-primary py-2 px-6 rounded-full appearance-none text-center cursor-pointer focus:outline-none focus:border-accent transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSpin}
              className="bg-accent text-background px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Spin Topic
            </button>
          </motion.div>
        )}

        {/* SPINNING PHASE */}
        {phase === "SPINNING" && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center mt-12"
          >
            <p className="text-accent text-xs font-bold tracking-widest uppercase mb-6">Drawing...</p>
            <h2 className="font-serif text-5xl md:text-7xl text-topic text-center blur-[2px] opacity-70">
              {spinText}
            </h2>
          </motion.div>
        )}

        {/* RULE GATE */}
        {phase === "RULE_GATE" && currentTopic && (
          <motion.div
            key="rule_gate"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center max-w-2xl text-center mt-12"
          >
            <p className="text-accent text-xs font-bold tracking-widest uppercase mb-6">Your Topic</p>
            <h2 className="font-serif text-5xl md:text-7xl text-topic mb-16 leading-tight">
              {currentTopic.title}
            </h2>
            
            <div className="border border-accent/20 rounded-2xl p-6 mb-12 bg-background/50 backdrop-blur-sm">
              <h3 className="text-accent font-semibold mb-2">The Rules</h3>
              <ul className="text-secondary text-sm space-y-1">
                <li>10 Minutes of pure research.</li>
                <li>No LLMs. No YouTube.</li>
                <li>When time is up, speak for 2 minutes.</li>
              </ul>
            </div>

            <button
              onClick={() => transitionTo("RESEARCH")}
              className="border border-accent text-accent px-8 py-3 rounded-full hover:bg-accent hover:text-background transition-colors"
            >
              Start 10 Min Research
            </button>
          </motion.div>
        )}

        {/* RESEARCH & SPEECH PHASES */}
        {(phase === "RESEARCH" || phase === "SPEECH") && currentTopic && (
          <motion.div
            key="active_session"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center mt-12 w-full max-w-3xl"
          >
            <div className="text-center mb-16">
              <p className="text-accent text-xs font-bold tracking-widest uppercase mb-4">
                {phase === "RESEARCH" ? "Research Phase" : "Speaking Phase"}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-topic opacity-80">
                {currentTopic.title}
              </h2>
            </div>

            <div className="relative flex items-center justify-center w-64 h-64 rounded-full border-[8px] border-accent/10 mb-12">
              {/* Progress ring calculation (visual only, simplified) */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="120" cy="120" r="116"
                  className="stroke-accent fill-none transition-all duration-100 ease-linear"
                  strokeWidth="8"
                  strokeDasharray="728"
                  strokeDashoffset={
                    728 - (728 * remaining) / (phase === "RESEARCH" ? RESEARCH_TIME : SPEECH_TIME)
                  }
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-serif text-6xl text-topic relative z-10 tabular-nums">
                {formatTime(remaining)}
              </span>
            </div>

            {phase === "RESEARCH" ? (
              <button
                onClick={() => transitionTo("SPEECH")}
                className="text-secondary text-sm hover:text-primary transition-colors underline underline-offset-4"
              >
                Finished early? Skip to speech
              </button>
            ) : (
              !isRunning && remaining === SPEECH_TIME && (
                <button
                  onClick={start}
                  className="bg-accent text-background px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Start Speaking
                </button>
              )
            )}
          </motion.div>
        )}

        {/* COMPLETE PHASE */}
        {phase === "COMPLETE" && currentTopic && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mt-12"
          >
            <h2 className="font-serif text-5xl text-topic mb-4">Session Complete</h2>
            <p className="text-secondary mb-12">Topic: {currentTopic.title}</p>
            <button
              onClick={() => transitionTo("SETUP")}
              className="bg-accent text-background px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Spin Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Controls */}
      <div className="absolute bottom-8 right-8 flex space-x-4">
        <button
          onClick={cycleTheme}
          className="p-3 rounded-full border border-primary/10 hover:bg-primary/5 transition-colors text-secondary"
          title="Toggle Theme"
        >
          {theme === "midnight" && <Moon size={20} />}
          {theme === "paper" && <Sun size={20} />}
          {theme === "nostalgia" && <BookOpen size={20} />}
        </button>
      </div>
    </div>
  );
}
