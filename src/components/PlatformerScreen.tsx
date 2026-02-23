import { useEffect, useRef, useState, useCallback } from "react";
import player1Src from "@/assets/player1-novio.png";
import { retroSounds } from "@/lib/retro-sounds";

interface Props {
  onComplete: () => void;
}

const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const SPEED = 4;
const PLAYER_W = 40;
const PLAYER_H = 50;
const HEART_SIZE = 20;
const GROUND_Y_OFFSET = 60;

interface Heart {
  x: number;
  y: number;
  collected: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  opacity: number;
  id: number;
}

const PlatformerScreen = ({ onComplete }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [collected, setCollected] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const gameRef = useRef({
    px: 100,
    py: 0,
    vy: 0,
    onGround: false,
    keys: {} as Record<string, boolean>,
    hearts: [] as Heart[],
    collected: 0,
    platforms: [] as { x: number; y: number; w: number }[],
    nextId: 0,
  });

  const initGame = useCallback((w: number, h: number) => {
    const g = gameRef.current;
    const groundY = h - GROUND_Y_OFFSET;
    g.px = 50;
    g.py = groundY - PLAYER_H;
    g.vy = 0;
    g.collected = 0;

    g.platforms = [
      { x: 0, y: groundY, w: w },
      { x: w * 0.2, y: groundY - 80, w: 100 },
      { x: w * 0.5, y: groundY - 130, w: 120 },
      { x: w * 0.75, y: groundY - 80, w: 100 },
    ];

    g.hearts = [
      { x: w * 0.25, y: groundY - 110, collected: false },
      { x: w * 0.55, y: groundY - 160, collected: false },
      { x: w * 0.8, y: groundY - 110, collected: false },
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const playerImg = new Image();
    playerImg.src = player1Src;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = canvas.parentElement?.clientHeight || 400;
      initGame(canvas.width, canvas.height);
    };
    resize();

    const g = gameRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      g.keys[e.key] = true;
      if (e.key === " " || e.key === "ArrowUp") e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      g.keys[e.key] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let frame: number;
    const loop = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Input
      if (g.keys["ArrowLeft"] || g.keys["a"]) g.px -= SPEED;
      if (g.keys["ArrowRight"] || g.keys["d"]) g.px += SPEED;
      if ((g.keys[" "] || g.keys["ArrowUp"] || g.keys["w"]) && g.onGround) {
        g.vy = JUMP_FORCE;
        g.onGround = false;
        retroSounds.jump();
      }

      // Physics
      g.vy += GRAVITY;
      g.py += g.vy;

      // Boundaries
      if (g.px < 0) g.px = 0;
      if (g.px > W - PLAYER_W) g.px = W - PLAYER_W;

      // Platform collision
      g.onGround = false;
      for (const p of g.platforms) {
        if (
          g.px + PLAYER_W > p.x &&
          g.px < p.x + p.w &&
          g.py + PLAYER_H >= p.y &&
          g.py + PLAYER_H <= p.y + 15 &&
          g.vy >= 0
        ) {
          g.py = p.y - PLAYER_H;
          g.vy = 0;
          g.onGround = true;
        }
      }

      // Heart collection
      for (const h of g.hearts) {
        if (
          !h.collected &&
          Math.abs(g.px + PLAYER_W / 2 - h.x) < 25 &&
          Math.abs(g.py + PLAYER_H / 2 - h.y) < 25
        ) {
          h.collected = true;
          g.collected++;
          retroSounds.collect();
          setCollected(g.collected);
          const id = g.nextId++;
          setFloatingTexts((prev) => [...prev, { x: h.x, y: h.y, opacity: 1, id }]);
          setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
          }, 1000);
          if (g.collected >= 3) {
            retroSounds.levelComplete();
            setTimeout(() => onComplete(), 800);
          }
        }
      }

      // Draw
      ctx.clearRect(0, 0, W, H);

      // Platforms
      ctx.fillStyle = "hsl(340, 30%, 25%)";
      for (const p of g.platforms) {
        ctx.fillRect(p.x, p.y, p.w, 8);
      }

      // Hearts
      for (const h of g.hearts) {
        if (!h.collected) {
          ctx.font = `${HEART_SIZE}px serif`;
          ctx.fillText("❤️", h.x - HEART_SIZE / 2, h.y + HEART_SIZE / 2);
        }
      }

      // Player (sprite image)
      if (playerImg.complete) {
        ctx.drawImage(playerImg, g.px, g.py, PLAYER_W, PLAYER_H);
      }

      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [initGame, onComplete]);

  // Mobile controls
  const g = gameRef.current;
  const pressLeft = () => { g.keys["ArrowLeft"] = true; };
  const releaseLeft = () => { g.keys["ArrowLeft"] = false; };
  const pressRight = () => { g.keys["ArrowRight"] = true; };
  const releaseRight = () => { g.keys["ArrowRight"] = false; };
  const jump = () => {
    if (g.onGround) {
      g.vy = JUMP_FORCE;
      g.onGround = false;
      retroSounds.jump();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-screen-in relative z-10">
      <h2 className="font-pixel text-lg sm:text-2xl text-primary text-glow-pink mb-1">La distancia</h2>
      <p className="font-pixel text-[10px] text-foreground/50 mb-2">Nivel 2</p>
      <div className="font-pixel text-xs text-foreground/70 mb-3">
        ❤️ {collected} / 3
      </div>

      <div className="relative w-full max-w-2xl" style={{ height: "350px" }}>
        <canvas ref={canvasRef} className="w-full h-full rounded-lg border border-border" />
        {floatingTexts.map((t) => (
          <div
            key={t.id}
            className="absolute font-pixel text-xs text-accent animate-float-up pointer-events-none"
            style={{ left: t.x, top: t.y }}
          >
            +1 ❤️
          </div>
        ))}
      </div>

      {/* Mobile controls */}
      <div className="flex gap-4 mt-4 sm:hidden">
        <button
          onTouchStart={pressLeft}
          onTouchEnd={releaseLeft}
          className="font-pixel text-lg px-5 py-3 bg-secondary rounded-lg border border-border text-foreground"
        >
          ◀
        </button>
        <button
          onTouchStart={jump}
          className="font-pixel text-lg px-5 py-3 bg-primary rounded-lg text-primary-foreground"
        >
          ▲
        </button>
        <button
          onTouchStart={pressRight}
          onTouchEnd={releaseRight}
          className="font-pixel text-lg px-5 py-3 bg-secondary rounded-lg border border-border text-foreground"
        >
          ▶
        </button>
      </div>
      <p className="font-pixel text-[8px] text-foreground/30 mt-3 hidden sm:block">
        ← → para mover · Espacio para saltar
      </p>
    </div>
  );
};

export default PlatformerScreen;
