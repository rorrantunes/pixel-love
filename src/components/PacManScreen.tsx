import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  onComplete: () => void;
}

const CELL = 24;
const COLS = 19;
const ROWS = 15;

// 1 = wall, 0 = path, 2 = player start, 3 = goal (Vale), 4 = ghost start
const MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,3,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const GHOST_COLORS = ["#ef4444", "#f472b6", "#67e8f9", "#fb923c"];

interface Ghost {
  x: number;
  y: number;
  color: string;
  dir: number;
}

const PacManScreen = ({ onComplete }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [caught, setCaught] = useState(false);
  const gameRef = useRef({
    px: 1, py: 1,
    ghosts: [] as Ghost[],
    keys: {} as Record<string, boolean>,
    moveTimer: 0,
    ghostTimer: 0,
    won: false,
  });

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.px = 1; g.py = 1;
    g.won = false;
    g.ghosts = GHOST_COLORS.map((color, i) => ({
      x: 9 + (i % 2 === 0 ? -1 : 1),
      y: 7 + (i < 2 ? -1 : 1),
      color,
      dir: i,
    }));
    setCaught(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = COLS * CELL;
    const H = ROWS * CELL;
    canvas.width = W;
    canvas.height = H;

    const g = gameRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      g.keys[e.key] = true;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => { g.keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const canMove = (x: number, y: number) =>
      x >= 0 && x < COLS && y >= 0 && y < ROWS && MAP[y][x] !== 1;

    let frame: number;
    const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];

    const loop = () => {
      if (g.won || caught) { frame = requestAnimationFrame(loop); return; }

      g.moveTimer++;
      if (g.moveTimer >= 8) {
        g.moveTimer = 0;
        let nx = g.px, ny = g.py;
        if (g.keys["ArrowUp"] || g.keys["w"]) ny--;
        else if (g.keys["ArrowDown"] || g.keys["s"]) ny++;
        else if (g.keys["ArrowLeft"] || g.keys["a"]) nx--;
        else if (g.keys["ArrowRight"] || g.keys["d"]) nx++;

        if (canMove(nx, ny)) { g.px = nx; g.py = ny; }

        if (MAP[g.py][g.px] === 3) {
          g.won = true;
          setTimeout(() => onComplete(), 600);
        }
      }

      g.ghostTimer++;
      if (g.ghostTimer >= 12) {
        g.ghostTimer = 0;
        for (const ghost of g.ghosts) {
          // Simple chase AI
          const dx = g.px - ghost.x;
          const dy = g.py - ghost.y;
          let preferred = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 1 : 3)
            : (dy > 0 ? 2 : 0);

          const tryDirs = [preferred, ...DIRS.map((_,i)=>i).filter(i=>i!==preferred)];
          let moved = false;
          for (const d of tryDirs) {
            const nx = ghost.x + DIRS[d][0];
            const ny = ghost.y + DIRS[d][1];
            if (canMove(nx, ny)) {
              ghost.x = nx; ghost.y = ny;
              moved = true;
              break;
            }
          }

          if (ghost.x === g.px && ghost.y === g.py) {
            setCaught(true);
          }
        }
      }

      // Check collision after player move too
      for (const ghost of g.ghosts) {
        if (ghost.x === g.px && ghost.y === g.py) setCaught(true);
      }

      // Draw
      ctx.clearRect(0, 0, W, H);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (MAP[r][c] === 1) {
            ctx.fillStyle = "hsl(240, 30%, 18%)";
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            ctx.strokeStyle = "hsl(340, 40%, 30%)";
            ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
          }
          if (MAP[r][c] === 3) {
            ctx.font = `${CELL - 4}px serif`;
            ctx.fillText("💕", c * CELL + 2, r * CELL + CELL - 4);
          }
        }
      }

      // Player (Pac-Man style)
      ctx.fillStyle = "hsl(50, 90%, 60%)";
      ctx.beginPath();
      const cx = g.px * CELL + CELL / 2;
      const cy = g.py * CELL + CELL / 2;
      ctx.arc(cx, cy, CELL / 2 - 2, 0.2 * Math.PI, 1.8 * Math.PI);
      ctx.lineTo(cx, cy);
      ctx.fill();

      // Ghosts
      for (const ghost of g.ghosts) {
        ctx.fillStyle = ghost.color;
        const gx = ghost.x * CELL + 2;
        const gy = ghost.y * CELL + 2;
        const gs = CELL - 4;
        ctx.fillRect(gx, gy, gs, gs);
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.fillRect(gx + 4, gy + 4, 5, 5);
        ctx.fillRect(gx + gs - 9, gy + 4, 5, 5);
        ctx.fillStyle = "#222";
        ctx.fillRect(gx + 6, gy + 6, 2, 2);
        ctx.fillRect(gx + gs - 7, gy + 6, 2, 2);
      }

      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [caught, onComplete]);

  // Mobile controls
  const g = gameRef.current;
  const tap = (key: string) => {
    g.keys[key] = true;
    setTimeout(() => { g.keys[key] = false; }, 150);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-screen-in relative z-10">
      <h2 className="font-pixel text-lg sm:text-2xl text-primary text-glow-pink mb-1">El viaje</h2>
      <p className="font-pixel text-[10px] text-foreground/50 mb-4">Nivel 3</p>

      {caught && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background/80">
          <h3 className="font-pixel text-xl text-accent mb-4">¡Te atraparon!</h3>
          <button
            onClick={initGame}
            className="font-pixel text-sm px-6 py-3 bg-primary text-primary-foreground rounded-lg animate-pulse-glow"
          >
            Reintentar
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="rounded-lg border border-border"
        style={{ maxWidth: "100%", imageRendering: "pixelated" }}
      />

      {/* Mobile controls */}
      <div className="flex flex-col items-center gap-2 mt-4 sm:hidden">
        <button onTouchStart={() => tap("ArrowUp")} className="font-pixel text-lg px-5 py-2 bg-secondary rounded-lg border border-border text-foreground">▲</button>
        <div className="flex gap-4">
          <button onTouchStart={() => tap("ArrowLeft")} className="font-pixel text-lg px-5 py-2 bg-secondary rounded-lg border border-border text-foreground">◀</button>
          <button onTouchStart={() => tap("ArrowDown")} className="font-pixel text-lg px-5 py-2 bg-secondary rounded-lg border border-border text-foreground">▼</button>
          <button onTouchStart={() => tap("ArrowRight")} className="font-pixel text-lg px-5 py-2 bg-secondary rounded-lg border border-border text-foreground">▶</button>
        </div>
      </div>
      <p className="font-pixel text-[8px] text-foreground/30 mt-3 hidden sm:block">
        Flechas para mover · Llega al 💕
      </p>
    </div>
  );
};

export default PacManScreen;
