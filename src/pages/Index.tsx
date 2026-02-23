import { useState, useCallback } from "react";
import StarryBackground from "@/components/StarryBackground";
import IntroScreen from "@/components/IntroScreen";
import QuizScreen from "@/components/QuizScreen";
import PlatformerScreen from "@/components/PlatformerScreen";
import PacManScreen from "@/components/PacManScreen";
import FinalLetterScreen from "@/components/FinalLetterScreen";

type Screen = "intro" | "quiz" | "platformer" | "pacman" | "letter";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("intro");
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((next: Screen) => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen(next);
      setTransitioning(false);
    }, 600);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <StarryBackground />
      <div className={transitioning ? "animate-fade-screen-out" : "animate-fade-screen-in"}>
        {screen === "intro" && <IntroScreen onStart={() => goTo("quiz")} />}
        {screen === "quiz" && <QuizScreen onComplete={() => goTo("platformer")} />}
        {screen === "platformer" && <PlatformerScreen onComplete={() => goTo("pacman")} />}
        {screen === "pacman" && <PacManScreen onComplete={() => goTo("letter")} />}
        {screen === "letter" && <FinalLetterScreen />}
      </div>
    </div>
  );
};

export default Index;
