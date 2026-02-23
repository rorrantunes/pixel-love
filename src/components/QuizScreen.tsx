import { useState, useCallback } from "react";
import { retroSounds } from "@/lib/retro-sounds";

interface Props {
  onComplete: () => void;
}

const questions = [
  {
    q: "¿Dónde es mi sueño viajar?",
    options: ["Puerto Rico", "Japón", "Alemania", "México"],
    correct: 1,
  },
  {
    q: "¿Cuáles son mis flores favoritas?",
    options: ["Margaritas", "Tulipanes", "Rosas", "Lirios"],
    correct: 3,
  },
  {
    q: "¿Qué comida es mi favorita?",
    options: ["Comida italiana", "Comida japonesa", "Comida mexicana", "Comida brasileña"],
    correct: 1,
  },
];

const QuizScreen = ({ onComplete }: Props) => {
  const [current, setCurrent] = useState(0);
  const [lives, setLives] = useState(3);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [correct, setCorrect] = useState(false);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      retroSounds.click();
      setSelected(idx);
      const isCorrect = idx === questions[current].correct;

      if (isCorrect) {
        setTimeout(() => retroSounds.correct(), 150);
        setCorrect(true);
        setTimeout(() => {
          if (current < questions.length - 1) {
            setCurrent((c) => c + 1);
            setSelected(null);
            setCorrect(false);
          } else {
            retroSounds.levelComplete();
            onComplete();
          }
        }, 1000);
      } else {
        setTimeout(() => retroSounds.wrong(), 150);
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          setTimeout(() => {
            retroSounds.gameOver();
            setGameOver(true);
          }, 800);
        } else {
          setTimeout(() => {
            setSelected(null);
          }, 800);
        }
      }
    },
    [selected, current, lives, onComplete]
  );

  const restart = () => {
    retroSounds.click();
    setCurrent(0);
    setLives(3);
    setSelected(null);
    setGameOver(false);
    setCorrect(false);
  };

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-screen-in relative z-10">
        <h2 className="font-pixel text-xl text-accent text-glow-pink mb-4">Game Over</h2>
        <p className="font-pixel text-xs text-foreground/60 mb-8">Inténtalo de nuevo</p>
        <button
          onClick={restart}
          className="font-pixel text-sm px-6 py-3 bg-primary text-primary-foreground rounded-lg animate-pulse-glow"
        >
          Reiniciar
        </button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-screen-in relative z-10">
      <div className="absolute top-6 right-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} className={`text-xl ${i < lives ? "opacity-100" : "opacity-20"}`}>
            ❤️
          </span>
        ))}
      </div>

      <h2 className="font-pixel text-lg sm:text-2xl text-primary text-glow-pink mb-2">
        Cuánto me conoces
      </h2>
      <p className="font-pixel text-[10px] text-foreground/50 mb-10">Nivel 1</p>

      <p className="font-pixel text-xs sm:text-sm text-foreground mb-8 text-center max-w-md">
        {q.q}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        {q.options.map((opt, i) => {
          let bg = "bg-secondary hover:bg-secondary/80";
          if (selected !== null) {
            if (i === q.correct) bg = "bg-green-700/80";
            else if (i === selected) bg = "bg-red-700/80";
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={`font-pixel text-[10px] sm:text-xs px-4 py-3 rounded-lg text-foreground transition-all ${bg} border border-border`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <p className="font-pixel text-[8px] text-foreground/30 mt-8">
        {current + 1} / {questions.length}
      </p>
    </div>
  );
};

export default QuizScreen;
