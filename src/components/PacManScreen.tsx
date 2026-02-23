import { useEffect, useRef, useState, useCallback } from "react";
import player1Src from "@/assets/player1-novio.png";
import player2Src from "@/assets/player2-vale.png";
import { retroSounds } from "@/lib/retro-sounds";

interface Props {
  onComplete: () => void;
}

const CELL = 24;
const COLS = 19;
const ROWS = 15;

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
  const caughtRef = useRef(false);
  const gameRef = useRef({
    px: 1, py: 1,
    ghosts: [] as Ghost[],
    keys: {} as Record<string, boolean>,
    moveTimer: 0,
    ghostTimer: 0,
    won: false,
    lastMoveSound: 0,
    bullets: [] as { x: number; y: number; dx: number; dy: number }[],
    bulletTimer: 0,
    lastDir: [1, 0] as [number, number],
    cooldown: 0,
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
    caughtRef.current = false;
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

    const player1Img = new Image();
    player1Img.src = player1Src;
    const player2Img = new Image();
    player2Img.src = player2Src;

    const W = COLS * CELL;
    const H = ROWS * CELL;
    canvas.width = W;
    canvas.height = H;

    const g = gameRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      g.keys[e.key] = true;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
      if ((e.key === " " || e.key === "Enter") && g.cooldown <= 0) {
        e.preventDefault();
        g.bullets.push({ x: g.px, y: g.py, dx: g.lastDir[0], dy: g.lastDir[1] });
        g.cooldown = 15;
        retroSounds.jump();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { g.keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const canMove = (x: number, y: number) =>
      x >= 0 && x < COLS && y >= 0 && y < ROWS && MAP[y][x] !== 1;

    let frame: number;
    const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];

    const loop = () => {
      if (g.won || caughtRef.current) { frame = requestAnimationFrame(loop); return; }

      g.moveTimer++;
      if (g.moveTimer >= 8) {
        g.moveTimer = 0;
        let nx = g.px, ny = g.py;
        if (g.keys["ArrowUp"] || g.keys["w"]) { ny--; g.lastDir = [0, -1]; }
        else if (g.keys["ArrowDown"] || g.keys["s"]) { ny++; g.lastDir = [0, 1]; }
        else if (g.keys["ArrowLeft"] || g.keys["a"]) { nx--; g.lastDir = [-1, 0]; }
        else if (g.keys["ArrowRight"] || g.keys["d"]) { nx++; g.lastDir = [1, 0]; }

        if (canMove(nx, ny) && (nx !== g.px || ny !== g.py)) {
          g.px = nx; g.py = ny;
          g.lastMoveSound++;
          if (g.lastMoveSound >= 3) {
            g.lastMoveSound = 0;
            retroSounds.move();
          }
        }

        if (MAP[g.py][g.px] === 3) {
          g.won = true;
          retroSounds.levelComplete();
          setTimeout(() => onComplete(), 600);
        }
      }

      // Cooldown
      if (g.cooldown > 0) g.cooldown--;

      // Move bullets
      g.bulletTimer++;
      if (g.bulletTimer >= 4) {
        g.bulletTimer = 0;
        for (let i = g.bullets.length - 1; i >= 0; i--) {
          const b = g.bullets[i];
          b.x += b.dx;
          b.y += b.dy;
          if (!canMove(b.x, b.y)) { g.bullets.splice(i, 1); continue; }
          // Check ghost hit
          const hitIdx = g.ghosts.findIndex(gh => gh.x === b.x && gh.y === b.y);
          if (hitIdx !== -1) {
            g.ghosts.splice(hitIdx, 1);
            g.bullets.splice(i, 1);
            retroSounds.collect();
          }
        }
      }

      g.ghostTimer++;
      if (g.ghostTimer >= 12) {
        g.ghostTimer = 0;
        for (const ghost of g.ghosts) {
          const dx = g.px - ghost.x;
          const dy = g.py - ghost.y;
          let preferred = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 1 : 3)
            : (dy > 0 ? 2 : 0);

          const tryDirs = [preferred, ...DIRS.map((_,i)=>i).filter(i=>i!==preferred)];
          for (const d of tryDirs) {
            const nnx = ghost.x + DIRS[d][0];
            const nny = ghost.y + DIRS[d][1];
            if (canMove(nnx, nny)) {
              ghost.x = nnx; ghost.y = nny;
              break;
            }
          }

          if (ghost.x === g.px && ghost.y === g.py) {
            caughtRef.current = true;
            retroSounds.caught();
            setCaught(true);
          }
        }
      }

      for (const ghost of g.ghosts) {
        if (ghost.x === g.px && ghost.y === g.py) {
          if (!caughtRef.current) {
            retroSounds.caught();
          }
          caughtRef.current = true;
          setCaught(true);
        }
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
            if (player2Img.complete) {
              ctx.drawImage(player2Img, c * CELL - 4, r * CELL - 4, CELL + 8, CELL + 8);
            }
          }
        }
      }

      if (player1Img.complete) {
        ctx.drawImage(player1Img, g.px * CELL - 4, g.py * CELL - 4, CELL + 8, CELL + 8);
      }

      // Ghosts
      for (const ghost of g.ghosts) {
        const gx = ghost.x * CELL + CELL / 2;
        const gy = ghost.y * CELL + CELL / 2;
        const r = CELL / 2 - 2;

        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, r, Math.PI, 0);
        ctx.lineTo(gx + r, gy + r - 2);
        const waves = 3;
        const waveW = (r * 2) / waves;
        for (let i = 0; i < waves; i++) {
          const wx = gx + r - i * waveW;
          ctx.quadraticCurveTo(wx - waveW * 0.25, gy + r + 3, wx - waveW * 0.5, gy + r - 2);
          ctx.quadraticCurveTo(wx - waveW * 0.75, gy + r - 7, wx - waveW, gy + r - 2);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(gx - 3, gy - 3, 3, 0, Math.PI * 2);
        ctx.arc(gx + 3, gy - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(gx - 2, gy - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bullets
      for (const b of g.bullets) {
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(b.x * CELL + CELL / 2, b.y * CELL + CELL / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onComplete]);

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
            onClick={() => { retroSounds.click(); initGame(); }}
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

      <div className="flex flex-col items-center gap-2 mt-4 sm:hidden">
        <button onTouchStart={() => tap("ArrowUp")} className="font-pixel text-lg px-5 py-2 bg-secondary rounded-lg border border-border text-foreground">▲</button>
        <div className="flex gap-4">
          <button onTouchStart={() => tap("ArrowLeft")} className="font-pixel text-lg px-5 py-2 bg-secondary rounded-lg border border-border text-foreground">◀</button>
          <button onTouchStart={() => tap("ArrowDown")} className="font-pixel text-lg px-5 py-2 bg-secondary rounded-lg border border-border text-foreground">▼</button>
          <button onTouchStart={() => tap("ArrowRight")} className="font-pixel text-lg px-5 py-2 bg-secondary rounded-lg border border-border text-foreground">▶</button>
        </div>
        <button onTouchStart={() => {
          const gg = gameRef.current;
          if (gg.cooldown <= 0) {
            gg.bullets.push({ x: gg.px, y: gg.py, dx: gg.lastDir[0], dy: gg.lastDir[1] });
            gg.cooldown = 15;
            retroSounds.jump();
          }
        }} className="font-pixel text-xs px-8 py-2 bg-primary text-primary-foreground rounded-lg mt-1">🔫 Disparar</button>
      </div>
      <p className="font-pixel text-[8px] text-foreground/30 mt-3 hidden sm:block">
        Flechas para mover · Espacio para disparar · Llega al 💕
      </p>
    </div>
  );
};

export default PacManScreen;
