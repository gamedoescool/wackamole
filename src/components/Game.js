import { useRef, useEffect, useCallback, useState } from 'react';
import {
  createGameState,
  updateGameState,
  handleClick,
  HOLE_WIDTH,
  HOLE_HEIGHT,
  MOLE_WIDTH,
  MOLE_HEIGHT,
  STATES,
} from '../game/engine';
import HUD from './HUD';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 720;

// Retro arcade palette
const COLORS = {
  canaryYellow: '#FFD700',
  cherryRed: '#E31B23',
  grassGreen: '#4CAF50',
  grassDark: '#3D8B40',
  clayBrown: '#8B4513',
  clayLight: '#A0522D',
  darkBrown: '#5D3A1A',
  molePink: '#FF69B4',
  cobaltBlue: '#1E3A8A',
  cobaltLight: '#2444a8',
  neonPurple: '#7C3AED',
  cream: '#FFF8DC',
  darkNavy: '#0F172A',
};

function playPlaceholderAudio(character) {
  if (!character || !character.label) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Cancel any pending speech to avoid queue buildup
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(character.label);
    utterance.lang = 'ta-IN';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a Tamil voice if available
    const voices = synth.getVoices();
    const tamilVoice = voices.find(v => v.lang.startsWith('ta'));
    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }

    synth.speak(utterance);
  } catch (e) {
    // Speech synthesis not available
  }
}

// --- Sprite: Background (grass playfield, cabinet border, rivets) ---
function drawBackground(ctx) {
  // Base grass green
  ctx.fillStyle = COLORS.grassGreen;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Grass texture - horizontal stripes
  ctx.fillStyle = COLORS.grassDark;
  for (let y = 0; y < CANVAS_HEIGHT; y += 12) {
    ctx.fillRect(0, y, CANVAS_WIDTH, 2);
  }

  // Grass texture - scattered dots for organic feel
  ctx.fillStyle = 'rgba(61, 139, 64, 0.5)';
  for (let i = 0; i < 120; i++) {
    const gx = (i * 137 + 43) % CANVAS_WIDTH;
    const gy = (i * 193 + 71) % CANVAS_HEIGHT;
    ctx.beginPath();
    ctx.arc(gx, gy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cabinet border frame - cobalt blue
  const borderW = 12;
  ctx.fillStyle = COLORS.cobaltBlue;
  // Top
  ctx.fillRect(0, 0, CANVAS_WIDTH, borderW);
  // Bottom
  ctx.fillRect(0, CANVAS_HEIGHT - borderW, CANVAS_WIDTH, borderW);
  // Left
  ctx.fillRect(0, 0, borderW, CANVAS_HEIGHT);
  // Right
  ctx.fillRect(CANVAS_WIDTH - borderW, 0, borderW, CANVAS_HEIGHT);

  // Inner border highlight
  ctx.strokeStyle = COLORS.cobaltLight;
  ctx.lineWidth = 2;
  ctx.strokeRect(borderW, borderW, CANVAS_WIDTH - borderW * 2, CANVAS_HEIGHT - borderW * 2);

  // Decorative rivets at corners
  const rivetPositions = [
    [20, 20],
    [CANVAS_WIDTH - 20, 20],
    [20, CANVAS_HEIGHT - 20],
    [CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20],
    [CANVAS_WIDTH / 2, 20],
    [CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20],
    [20, CANVAS_HEIGHT / 2],
    [CANVAS_WIDTH - 20, CANVAS_HEIGHT / 2],
  ];
  rivetPositions.forEach(([rx, ry]) => {
    // Rivet shadow
    ctx.fillStyle = COLORS.darkBrown;
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();
    // Rivet body
    ctx.fillStyle = COLORS.canaryYellow;
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
    ctx.fill();
    // Rivet highlight
    ctx.fillStyle = COLORS.cream;
    ctx.beginPath();
    ctx.arc(rx - 1, ry - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top banner text
  ctx.fillStyle = COLORS.darkNavy;
  ctx.fillRect(borderW, borderW, CANVAS_WIDTH - borderW * 2, 28);
  ctx.fillStyle = COLORS.canaryYellow;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TAMIL WHACK-A-MOLE', CANVAS_WIDTH / 2, borderW + 14);
}

// --- Sprite: Dirt Mound (clay brown mound with texture and grass) ---
function drawDirtMound(ctx, hole) {
  const hx = hole.x;
  const hy = hole.y;
  const moundW = HOLE_WIDTH / 2 + 18;
  const moundH = 22;

  // Back mound (behind the hole) - darker
  ctx.fillStyle = COLORS.darkBrown;
  ctx.beginPath();
  ctx.ellipse(hx, hy - moundH + 4, moundW, moundH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main mound
  ctx.fillStyle = COLORS.clayBrown;
  ctx.beginPath();
  ctx.ellipse(hx, hy - moundH + 6, moundW - 2, moundH - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dirt texture dots
  ctx.fillStyle = COLORS.darkBrown;
  const dotSeed = Math.floor(hx * 7 + hy * 13);
  for (let i = 0; i < 8; i++) {
    const angle = (dotSeed + i * 47) % 360;
    const dist = 6 + ((dotSeed + i * 23) % 10);
    const dx = hx + Math.cos(angle * Math.PI / 180) * dist * (moundW / 30);
    const dy = hy - moundH + 6 + Math.sin(angle * Math.PI / 180) * dist * 0.4;
    ctx.beginPath();
    ctx.arc(dx, dy, 1.5 + (i % 3) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass tufts on top edges
  ctx.strokeStyle = COLORS.grassGreen;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    const gx = hx + i * 12;
    const gy = hy - moundH + 2;
    // Left-leaning blade
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - 3, gy - 6 - (i % 2) * 2);
    ctx.stroke();
    // Right-leaning blade
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 3, gy - 5 - ((i + 1) % 2) * 2);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

// --- Sprite: Hole Interior ---
function drawHoleInteriors(ctx, holes) {
  holes.forEach((hole) => {
    // Hole shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(hole.x + 2, hole.y + 3, HOLE_WIDTH / 2 + 6, HOLE_HEIGHT / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep dark hole
    ctx.fillStyle = COLORS.darkNavy;
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y, HOLE_WIDTH / 2, HOLE_HEIGHT / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// --- Sprite: Hole Rim (front lip of dirt) ---
function drawHoleRims(ctx, holes) {
  holes.forEach((hole) => {
    // Front rim - clay brown, lower half ellipse to create lip effect
    ctx.fillStyle = COLORS.clayBrown;
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y + 2, HOLE_WIDTH / 2 + 6, 8, 0, 0, Math.PI);
    ctx.fill();

    // Rim highlight
    ctx.fillStyle = COLORS.clayLight;
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y + 1, HOLE_WIDTH / 2 + 4, 5, 0, 0, Math.PI);
    ctx.fill();
  });
}

// --- Sprite: Mole Character (cartoon mole with face, whiskers, ears, Tamil label) ---
function drawMoleSprite(ctx, mole, hole) {
  if (mole.state === STATES.HIDDEN) return;

  const moleX = mole.x;
  const visibleTop = mole.riseY;
  const groundY = hole.y;
  const visibleHeight = Math.max(0, groundY - visibleTop);
  if (visibleHeight <= 0) return;

  // Clip to only show mole above ground
  ctx.save();
  ctx.beginPath();
  ctx.rect(moleX - MOLE_WIDTH / 2 - 2, 0, MOLE_WIDTH + 4, groundY);
  ctx.clip();

  // Body coordinates - mole is 60 wide, 70 tall, centered
  const bodyW = MOLE_WIDTH;
  const bodyH = MOLE_HEIGHT;
  const cx = moleX;
  const topY = visibleTop;
  const bodyTop = topY;
  const bodyBottom = topY + bodyH;
  const bodyMidY = topY + bodyH * 0.45;

  // --- Body shadow (offset behind) ---
  ctx.fillStyle = COLORS.darkBrown;
  ctx.beginPath();
  ctx.ellipse(cx + 2, bodyBottom - 8, bodyW / 2 - 2, bodyH / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Main body (egg shape - wider at bottom) ---
  ctx.fillStyle = COLORS.clayBrown;
  ctx.beginPath();
  // Top of head (narrower)
  ctx.moveTo(cx, bodyTop + 2);
  // Right side curves out toward bottom
  ctx.bezierCurveTo(
    cx + bodyW / 2 - 2, bodyTop + 8,
    cx + bodyW / 2 + 2, bodyMidY,
    cx + bodyW / 2, bodyBottom - 8
  );
  // Bottom (flat-ish)
  ctx.bezierCurveTo(
    cx + bodyW / 2, bodyBottom,
    cx - bodyW / 2, bodyBottom,
    cx - bodyW / 2, bodyBottom - 8
  );
  // Left side curves back up
  ctx.bezierCurveTo(
    cx - bodyW / 2 - 2, bodyMidY,
    cx - bodyW / 2 + 2, bodyTop + 8,
    cx, bodyTop + 2
  );
  ctx.fill();

  // --- Belly/face area (lighter oval) ---
  ctx.fillStyle = COLORS.clayLight;
  ctx.beginPath();
  ctx.ellipse(cx, bodyTop + bodyH * 0.5, bodyW / 2 - 6, bodyH / 2 - 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Ears (small rounded bumps on top) ---
  ctx.fillStyle = COLORS.clayBrown;
  // Left ear
  ctx.beginPath();
  ctx.ellipse(cx - bodyW / 2 + 8, bodyTop + 8, 7, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Right ear
  ctx.beginPath();
  ctx.ellipse(cx + bodyW / 2 - 8, bodyTop + 8, 7, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Ear inner (lighter)
  ctx.fillStyle = COLORS.clayLight;
  ctx.beginPath();
  ctx.ellipse(cx - bodyW / 2 + 8, bodyTop + 8, 4, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + bodyW / 2 - 8, bodyTop + 8, 4, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // --- Eyes (white circles with dark pupils, slightly cross-eyed) ---
  const eyeY = bodyTop + bodyH * 0.28;
  const eyeSpacing = 9;
  // Left eye white
  ctx.fillStyle = COLORS.cream;
  ctx.beginPath();
  ctx.ellipse(cx - eyeSpacing, eyeY, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right eye white
  ctx.beginPath();
  ctx.ellipse(cx + eyeSpacing, eyeY, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Left pupil (slightly inward for cross-eyed look)
  ctx.fillStyle = COLORS.darkNavy;
  ctx.beginPath();
  ctx.arc(cx - eyeSpacing + 2, eyeY + 1, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Right pupil (slightly inward)
  ctx.beginPath();
  ctx.arc(cx + eyeSpacing - 2, eyeY + 1, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - eyeSpacing + 3, eyeY - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + eyeSpacing - 1, eyeY - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // --- Nose (pink oval at center) ---
  const noseY = bodyTop + bodyH * 0.38;
  ctx.fillStyle = COLORS.molePink;
  ctx.beginPath();
  ctx.ellipse(cx, noseY, 6, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nose highlight
  ctx.fillStyle = '#ff8ec4';
  ctx.beginPath();
  ctx.ellipse(cx - 1, noseY - 1, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Whiskers (3 thin lines on each side) ---
  ctx.strokeStyle = COLORS.darkBrown;
  ctx.lineWidth = 1;
  const whiskerY = noseY + 3;
  // Left whiskers
  for (let w = -1; w <= 1; w++) {
    ctx.beginPath();
    ctx.moveTo(cx - 8, whiskerY + w * 3);
    ctx.lineTo(cx - 24, whiskerY + w * 5 - 2);
    ctx.stroke();
  }
  // Right whiskers
  for (let w = -1; w <= 1; w++) {
    ctx.beginPath();
    ctx.moveTo(cx + 8, whiskerY + w * 3);
    ctx.lineTo(cx + 24, whiskerY + w * 5 - 2);
    ctx.stroke();
  }

  // --- Smile line ---
  ctx.strokeStyle = COLORS.darkBrown;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, noseY + 2, 8, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // --- Tamil character on chest/belly ---
  if (mole.character && visibleHeight > 30) {
    const charY = bodyTop + bodyH * 0.65;
    // Text shadow for readability
    ctx.fillStyle = COLORS.darkBrown;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mole.character.label, cx + 1, charY + 1);
    // Main text in gold
    ctx.fillStyle = COLORS.canaryYellow;
    ctx.fillText(mole.character.label, cx, charY);
  }

  ctx.restore();
}

// --- Sprite: Whack Effect (starburst, lightning bolts, +10 text) ---
function drawWhackEffect(ctx, effect) {
  const progress = effect.timer / 600;
  const alpha = 1 - progress;
  const scale = 0.5 + progress * 0.8;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(effect.x, effect.y - progress * 50);

  // Starburst
  const rays = 8;
  const innerR = 8 * scale;
  const outerR = 22 * scale;
  ctx.fillStyle = COLORS.neonPurple;
  ctx.beginPath();
  for (let i = 0; i < rays * 2; i++) {
    const angle = (i * Math.PI) / rays - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const sx = Math.cos(angle) * r;
    const sy = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();

  // Lightning bolts (4 small bolts radiating out)
  ctx.strokeStyle = COLORS.canaryYellow;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  const boltDist = 16 * scale;
  for (let b = 0; b < 4; b++) {
    const bAngle = (b * Math.PI) / 2 + progress * 2;
    const bx = Math.cos(bAngle) * boltDist;
    const by = Math.sin(bAngle) * boltDist;
    // Zigzag bolt
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 4, by + 3);
    ctx.lineTo(bx + 1, by + 5);
    ctx.lineTo(bx + 5, by + 8);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';

  // +10 text
  ctx.fillStyle = COLORS.cherryRed;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Text outline for visibility
  ctx.strokeStyle = COLORS.darkNavy;
  ctx.lineWidth = 3;
  ctx.strokeText('+10', 0, -10 * scale);
  ctx.fillText('+10', 0, -10 * scale);

  ctx.restore();
}

// --- Sprite: Wrong Hit Effect (X mark, dust clouds) ---
function drawWrongHitEffect(ctx, effect) {
  const progress = effect.timer / 400;
  const alpha = 1 - progress;
  const rise = progress * 35;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(effect.x, effect.y - rise);

  // Red X mark
  ctx.strokeStyle = COLORS.cherryRed;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const xSize = 14;
  ctx.beginPath();
  ctx.moveTo(-xSize, -xSize);
  ctx.lineTo(xSize, xSize);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(xSize, -xSize);
  ctx.lineTo(-xSize, xSize);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Dust puffs (3 small brown circles)
  ctx.fillStyle = COLORS.clayBrown;
  const puffDist = 18 * progress;
  for (let p = 0; p < 3; p++) {
    const pAngle = (p * 2.1) + 0.5;
    const px = Math.cos(pAngle) * puffDist;
    const py = Math.sin(pAngle) * puffDist + 10;
    const puffR = 4 * (1 - progress * 0.5);
    ctx.beginPath();
    ctx.arc(px, py, puffR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.canaryYellow;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  ctx.fillStyle = COLORS.cream;
  ctx.font = '20px sans-serif';
  ctx.fillText('Press Escape or click Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function Game({ characters, difficulty, onGameOver }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const lastTimeRef = useRef(null);
  const rafRef = useRef(null);
  const [hudState, setHudState] = useState({
    score: 0,
    timeRemaining: 60000,
    targetCharacter: null,
  });
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const next = !prev;
      isPausedRef.current = next;
      if (!next) {
        // Reset lastTimeRef on unpause to prevent dt explosion
        lastTimeRef.current = null;
      }
      return next;
    });
  }, []);

  const gameLoop = useCallback(
    (timestamp) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const state = gameStateRef.current;
      if (!state || state.gameOver) return;

      if (isPausedRef.current) {
        // Draw paused scene
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawBackground(ctx);
        state.holes.forEach((hole) => drawDirtMound(ctx, hole));
        drawHoleInteriors(ctx, state.holes);
        state.moles.forEach((mole, i) => {
          drawMoleSprite(ctx, mole, state.holes[i]);
        });
        drawHoleRims(ctx, state.holes);
        drawWhackEffects(ctx, state.hitEffects);
        drawWrongHitEffects(ctx, state.wrongHitEffects);
        drawPauseOverlay(ctx);
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      updateGameState(state, dt);

      setHudState({
        score: state.score,
        timeRemaining: state.timeRemaining,
        targetCharacter: state.targetCharacter,
      });

      // Draw order: background -> dirt mounds -> hole interiors -> moles -> hole rims -> effects
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawBackground(ctx);

      // Dirt mounds (behind holes)
      state.holes.forEach((hole) => drawDirtMound(ctx, hole));

      // Hole interiors (dark holes)
      drawHoleInteriors(ctx, state.holes);

      // Moles (clipped to above ground)
      state.moles.forEach((mole, i) => {
        drawMoleSprite(ctx, mole, state.holes[i]);
      });

      // Hole rims (front lip, creates depth)
      drawHoleRims(ctx, state.holes);

      // Effects on top
      drawWhackEffects(ctx, state.hitEffects);
      drawWrongHitEffects(ctx, state.wrongHitEffects);

      if (state.gameOver) {
        onGameOver(state.score);
        return;
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    },
    [onGameOver]
  );

  useEffect(() => {
    gameStateRef.current = createGameState(characters, difficulty);
    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') togglePause();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [characters, difficulty, gameLoop, togglePause]);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const state = gameStateRef.current;
    if (!state) return;
    if (isPausedRef.current) return;

    const hitChar = handleClick(state, x, y);
    if (hitChar) {
      playPlaceholderAudio(hitChar);
    }
  }, []);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    const state = gameStateRef.current;
    if (!state) return;
    if (isPausedRef.current) return;

    const hitChar = handleClick(state, x, y);
    if (hitChar) {
      playPlaceholderAudio(hitChar);
    }
  }, []);

  return (
    <div className="game-container">
      <HUD
        score={hudState.score}
        timeRemaining={hudState.timeRemaining}
        targetCharacter={hudState.targetCharacter}
        isPaused={isPaused}
        onTogglePause={togglePause}
      />
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
      />
    </div>
  );
}

// Wrapper functions that iterate over arrays (called from gameLoop)
function drawWhackEffects(ctx, effects) {
  effects.forEach((effect) => drawWhackEffect(ctx, effect));
}

function drawWrongHitEffects(ctx, effects) {
  effects.forEach((effect) => drawWrongHitEffect(ctx, effect));
}

export default Game;
