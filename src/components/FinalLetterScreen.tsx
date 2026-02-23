import { useState, useRef, useCallback } from "react";
import bouquet from "@/assets/bouquet.png";
import { retroSounds } from "@/lib/retro-sounds";

interface Props {}

const FinalLetterScreen = (_props: Props) => {
  const [opened, setOpened] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [sparkles, setSparkles] = useState<{x: number;y: number;delay: number;}[]>([]);
  const noRef = useRef<HTMLButtonElement>(null);

  const letterText = `Felices 3 meses mi amor,

Cada nivel que pasaste es como cada obstáculo que hemos superado juntos. La distancia, los miedos, los fantasmas del pasado... nada pudo detenernos.

Te amo más de lo que las palabras pueden expresar, y más de lo que cualquier videojuego podría contener.

Con todo mi amor,

Tu pollito💗`;

  const handleNoHover = useCallback(() => {
    if (!noRef.current) return;
    retroSounds.wrong();
    const btn = noRef.current;
    const parent = btn.parentElement;
    if (!parent) return;
    const maxX = parent.clientWidth - btn.clientWidth;
    const maxY = parent.clientHeight - btn.clientHeight;
    btn.style.position = "absolute";
    btn.style.left = `${Math.random() * maxX}px`;
    btn.style.top = `${Math.random() * maxY}px`;
  }, []);

  const handleYes = () => {
    retroSounds.celebration();
    setAnswered(true);
    const newSparkles = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setSparkles(newSparkles);
  };

  if (answered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-screen-in relative z-10 overflow-hidden">
        {sparkles.map((s, i) =>
          <div
            key={i}
            className="absolute animate-sparkle text-foreground/60"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animationDelay: `${s.delay}s`,
              fontSize: `${8 + Math.random() * 12}px`
            }}
          >
            ✦
          </div>
        )}
        <img src={bouquet} alt="Ramo de flores" className="w-48 sm:w-64 animate-float mb-8" />
        <p className="font-pixel text-xs sm:text-sm text-primary text-glow-pink text-center max-w-md leading-relaxed">
          Estas flores nunca se marchitarán como mi amor por ti.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-screen-in relative z-10">
      {!opened ? (
        <div
          onClick={() => { retroSounds.reveal(); setOpened(true); }}
          className="cursor-pointer animate-float text-8xl select-none hover:scale-110 transition-transform"
        >
          💌
        </div>
      ) : (
        <div className="bg-card/90 border border-border rounded-lg p-6 sm:p-8 max-w-lg w-full animate-fade-screen-in backdrop-blur-sm">
          <pre className="font-pixel text-[8px] sm:text-[10px] text-foreground/80 whitespace-pre-wrap leading-relaxed mb-8">
            {letterText}
          </pre>

          <p className="font-pixel text-xs text-primary text-center mb-6 text-glow-pink">
            ¿Estás dispuesto a empezar el Nivel 3 conmigo?
          </p>

          <div className="relative flex justify-center gap-4 min-h-[60px]">
            <button
              onClick={handleYes}
              className="font-pixel text-xs sm:text-sm px-10 sm:px-14 py-3 bg-primary text-primary-foreground rounded-xl animate-pulse-glow z-10"
            >
              Sí
            </button>
            <button
              ref={noRef}
              onMouseEnter={handleNoHover}
              onTouchStart={handleNoHover}
              className="font-pixel text-xs sm:text-sm px-10 sm:px-14 py-3 bg-secondary text-secondary-foreground rounded-xl border border-border transition-all z-10"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalLetterScreen;
