import { useState, useCallback, useEffect } from "react";
import StarryBackground from "@/components/StarryBackground";
import IntroScreen from "@/components/IntroScreen";
import QuizScreen from "@/components/QuizScreen";
import PlatformerScreen from "@/components/PlatformerScreen";
import PacManScreen from "@/components/PacManScreen";
import FinalLetterScreen from "@/components/FinalLetterScreen";
import { bgMusic } from "@/lib/bg-music";

type Screen = "intro" | "quiz" | "platformer" | "pacman" | "letter";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("intro");
  const [transitioning, setTransitioning] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  const goTo = useCallback((next: Screen) => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen(next);
      setTransitioning(false);
    }, 600);
  }, []);

  const toggleMusic = useCallback(() => {
    if (bgMusic.isPlaying()) {
      bgMusic.stop();
      setMusicOn(false);
    } else {
      bgMusic.start();
      setMusicOn(true);
    }
  }, []);

  // Start music on first user interaction (Start Game)
  const handleStart = useCallback(() => {
    if (!bgMusic.isPlaying()) {
      bgMusic.start();
      setMusicOn(true);
    }
    goTo("quiz");
  }, [goTo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { bgMusic.stop(); };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <StarryBackground />

      {/* Music toggle button */}
      <button
        onClick={toggleMusic}
        className="fixed top-4 left-4 z-50 font-pixel text-lg px-3 py-2 bg-secondary/80 backdrop-blur-sm rounded-lg border border-border text-foreground/70 hover:text-foreground transition-colors"
        title={musicOn ? "Silenciar música" : "Activar música"}
      >
        {musicOn ? "♫" : "♪"}
      </button>

      <div className={transitioning ? "animate-fade-screen-out" : "animate-fade-screen-in"}>
        {screen === "intro" && <IntroScreen onStart={handleStart} />}
        {screen === "quiz" && <QuizScreen onComplete={() => goTo("platformer")} />}
        {screen === "platformer" && <PlatformerScreen onComplete={() => goTo("pacman")} />}
        {screen === "pacman" && <PacManScreen onComplete={() => goTo("letter")} />}
        {screen === "letter" && <FinalLetterScreen />}
      </div>
    </div>
  );
};

export default Index;
