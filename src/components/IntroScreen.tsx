import player1 from "@/assets/player1-novio.png";
import player2 from "@/assets/player2-vale.png";
import { retroSounds } from "@/lib/retro-sounds";

interface Props {
  onStart: () => void;
}

const IntroScreen = ({ onStart }: Props) => {
  const handleStart = () => {
    retroSounds.startGame();
    onStart();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-screen-in relative z-10">
      <h1 className="text-3xl sm:text-5xl font-pixel text-primary text-glow-pink mb-3">
        Pixel Love
      </h1>
      <p className="text-xs sm:text-sm font-pixel text-foreground/70 mb-8">
        Nivel 3 – Edición Osito
      </p>

      <div className="flex items-end gap-8 sm:gap-16 mb-6">
        <div className="flex flex-col items-center">
          <img src={player1} alt="Player 1" className="w-24 sm:w-32 image-pixelated" />
          <span className="font-pixel text-[8px] sm:text-[10px] text-primary mt-2">PLAYER 1</span>
        </div>
        <div className="flex flex-col items-center">
          <img src={player2} alt="Player 2" className="w-24 sm:w-32 image-pixelated" />
          <span className="font-pixel text-[8px] sm:text-[10px] text-primary mt-2">PLAYER 2</span>
        </div>
      </div>

      <p className="font-pixel text-[10px] sm:text-xs text-foreground/60 mb-10 text-center">
        Misión: encontrar a la Vale
      </p>

      <button
        onClick={handleStart}
        className="font-pixel text-sm sm:text-base px-8 py-4 bg-primary text-primary-foreground rounded-lg animate-pulse-glow hover:brightness-110 transition-all"
      >
        Start Game
      </button>
    </div>
  );
};

export default IntroScreen;
