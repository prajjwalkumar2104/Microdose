"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, BookOpen, ChevronDown } from "lucide-react";
import { categories, topics, Topic } from "@/lib/data";
import { useAccurateTimer } from "@/hooks/useAccurateTimer";

type Phase =
  | "SETUP"
  | "SPINNING"
  | "RULE_GATE"
  | "RESEARCH"
  | "SPEECH"
  | "COMPLETE";
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

  const { remaining, start, reset, isRunning } = useAccurateTimer(0, () => {
    if (phase === "RESEARCH") transitionTo("SPEECH");
    if (phase === "SPEECH") transitionTo("COMPLETE");
  });

  useEffect(() => {
    if (theme === "midnight")
      document.body.className = "min-h-screen font-sans antialiased";
    else
      document.body.className = `min-h-screen font-sans antialiased theme-${theme}`;
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ["midnight", "paper", "nostalgia"];
    setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
  };

  const getRandomTopic = (catId: string) => {
    const available = topics.filter((t) => t.categoryId === catId);
    if (available.length === 0)
      return topics[Math.floor(Math.random() * topics.length)];
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
    <div className="min-h-screen flex flex-col relative transition-colors duration-500 overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/15 blur-[120px] rounded-full pointer-events-none opacity-60 transition-opacity duration-1000" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/10 blur-[100px] rounded-full pointer-events-none opacity-40" />

      {/* Header - Now in normal document flow to prevent overlapping */}
      <div className="pt-10 md:pt-16 flex flex-col items-center space-y-2 z-10 flex-shrink-0">
        <h1 className="font-serif text-4xl md:text-5xl text-topic tracking-tight">
          Microdose
        </h1>
        {/* <p className="text-secondary text-sm md:text-base font-medium flex items-center gap-2">
          made by <span className="text-primary/70 bg-primary/10 px-3 py-1 rounded-full text-xs tracking-wide">@you</span>
        </p> */}
      </div>

      {/* Main Content Area - Flex-1 ensures it centers perfectly in the remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 py-12 z-10">
        <AnimatePresence mode="wait">
          {/* SETUP PHASE */}
          {phase === "SETUP" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center space-y-10 w-full max-w-sm"
            >
              <div className="text-center space-y-6 w-full">
                <p className="text-secondary text-sm font-medium tracking-wide">
                  Minimal prep. Try to think quick on your feet.
                </p>

                {/* Custom Dropdown */}
                <div className="relative w-full z-50">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between bg-background border border-primary/20 text-primary py-4 px-6 rounded-2xl cursor-pointer hover:border-accent transition-all duration-300 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {categories.find((c) => c.id === selectedCatId)?.icon}
                      </span>
                      <span className="font-medium text-sm md:text-base">
                        {categories.find((c) => c.id === selectedCatId)?.name}
                      </span>
                    </div>
                    <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }}>
                      <ChevronDown size={18} className="text-secondary" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <>
                        {/* Invisible overlay to close dropdown when clicking outside */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute top-full left-0 right-0 mt-3 z-50 bg-background border border-primary/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                          <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                            {categories.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedCatId(c.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                  selectedCatId === c.id
                                    ? "bg-accent/10 text-accent font-semibold"
                                    : "text-primary hover:bg-primary/5 hover:translate-x-1"
                                }`}
                              >
                                <span className="text-lg">{c.icon}</span>
                                <span className="text-sm">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={handleSpin}
                className="bg-accent text-background px-10 py-4 rounded-2xl font-semibold tracking-wider uppercase text-sm shadow-[0_0_40px_rgba(217,119,87,0.2)] hover:shadow-[0_0_60px_rgba(217,119,87,0.4)] hover:-translate-y-1 transition-all duration-300 w-full"
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
              className="flex flex-col items-center w-full max-w-4xl"
            >
              <p className="text-accent text-xs font-bold tracking-[0.3em] uppercase mb-8">
                Drawing...
              </p>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-topic text-center blur-[3px] opacity-60 leading-tight">
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
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center w-full max-w-4xl text-center"
            >
              <p className="text-accent text-xs font-bold tracking-[0.3em] uppercase mb-8">
                Your Topic
              </p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl text-topic mb-12 leading-tight">
                {currentTopic.title}
              </h2>

              <button
                onClick={() => transitionTo("RESEARCH")}
                className="group relative overflow-hidden bg-transparent border border-primary/20 text-primary px-10 py-4 rounded-full font-medium hover:border-accent hover:text-accent transition-colors duration-300"
              >
                <span className="relative z-10">Start 10 Min Research</span>
                <div className="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
            </motion.div>
          )}

          {/* RESEARCH & SPEECH PHASES */}
          {(phase === "RESEARCH" || phase === "SPEECH") && currentTopic && (
            <motion.div
              key="active_session"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center w-full max-w-3xl"
            >
              <div className="text-center mb-12">
                <p className="text-accent text-xs font-bold tracking-[0.3em] uppercase mb-4">
                  {phase === "RESEARCH" ? "Research Phase" : "Speaking Phase"}
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-topic opacity-90 leading-tight max-w-2xl mx-auto">
                  {currentTopic.title}
                </h2>
              </div>

              <div className="relative flex items-center justify-center w-64 h-64 md:w-72 md:h-72 rounded-full border-[2px] border-primary/10 mb-12 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    className="stroke-accent fill-none transition-all duration-100 ease-linear"
                    strokeWidth="4"
                    strokeDasharray="300%"
                    strokeDashoffset={`calc(300% - (300% * ${remaining}) / ${phase === "RESEARCH" ? RESEARCH_TIME : SPEECH_TIME})`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-serif text-6xl md:text-7xl text-topic relative z-10 tabular-nums tracking-tighter">
                  {formatTime(remaining)}
                </span>
              </div>

              {phase === "RESEARCH" ? (
                <button
                  onClick={() => transitionTo("SPEECH")}
                  className="text-secondary text-sm font-medium hover:text-primary transition-colors border-b border-secondary/30 hover:border-primary pb-1"
                >
                  Finished early? Skip to speech
                </button>
              ) : (
                !isRunning &&
                remaining === SPEECH_TIME && (
                  <button
                    onClick={start}
                    className="bg-accent text-background px-12 py-4 rounded-full font-semibold tracking-wider uppercase text-sm shadow-[0_0_40px_rgba(217,119,87,0.3)] hover:scale-105 transition-all duration-300"
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
              className="flex flex-col items-center w-full max-w-4xl text-center"
            >
              <h2 className="font-serif text-5xl md:text-7xl text-topic mb-8">
                Session Complete
              </h2>
              <p className="text-secondary text-lg mb-12 max-w-xl">
                Topic: {currentTopic.title}
              </p>
              <button
                onClick={() => transitionTo("SETUP")}
                className="bg-primary text-background px-10 py-4 rounded-full font-semibold tracking-wider uppercase text-sm hover:scale-105 transition-all duration-300"
              >
                Spin Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Controls */}
      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex space-x-4 z-20">
        <button
          onClick={cycleTheme}
          className="p-4 rounded-full bg-background border border-primary/20 hover:bg-primary/10 transition-all duration-300 text-secondary hover:text-primary shadow-lg"
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
