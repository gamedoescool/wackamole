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

function playPlaceholderAudio(character) {
  if (!character) return;
  try {
    const audio = new Audio(`audio/${character.audio}`);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {
    // Audio file not found - expected for placeholders
  }
}

function drawBackground(ctx) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  skyGrad.addColorStop(0, '#87CEEB');
  skyGrad.addColorStop(0.35, '#B0E0E6');
  skyGrad.addColorStop(0.5, '#7CBA3F');
  skyGrad.addColorStop(1, '#5A8F29');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(720, 55, 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    ctx.beginPath();
    ctx.moveTo(720 + Math.cos(angle) * 45, 55 + Math.sin(angle) * 45);
    ctx.lineTo(720 + Math.cos(angle) * 58, 55 + Math.sin(angle) * 58);
    ctx.stroke();
  }
}

function drawHoleInteriors(ctx, holes) {
  holes.forEach((hole) => {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(hole.x + 2, hole.y + 3, HOLE_WIDTH / 2 + 6, HOLE_HEIGHT / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1A0E03';
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y, HOLE_WIDTH / 2, HOLE_HEIGHT / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHoleRims(ctx, holes) {
  holes.forEach((hole) => {
    ctx.fillStyle = '#5C3D0E';
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y, HOLE_WIDTH / 2 + 8, HOLE_HEIGHT / 2 + 4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMoleBody(ctx, mole, hole) {
  if (mole.state === STATES.HIDDEN) return;

  const moleX = mole.x;
  const visibleTop = mole.riseY;
  const groundY = hole.y;

  const visibleHeight = Math.max(0, groundY - visibleTop);
  if (visibleHeight <= 0) return;

  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(moleX - MOLE_WIDTH / 2, visibleTop, MOLE_WIDTH, visibleHeight);

  ctx.fillStyle = '#A67848';
  ctx.fillRect(
    moleX - MOLE_WIDTH / 2 + 4,
    visibleTop + 2,
    MOLE_WIDTH - 8,
    Math.min(visibleHeight * 0.4, 20)
  );

  if (mole.character && visibleHeight > 30) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      mole.character.label,
      moleX,
      visibleTop + visibleHeight / 2
    );
  }
}

function drawHitEffects(ctx, effects) {
  effects.forEach((effect) => {
    const progress = effect.timer / 600;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#4CFF4C';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+10', effect.x, effect.y - progress * 40);
    ctx.restore();
  });
}

function drawWrongHitEffects(ctx, effects) {
  effects.forEach((effect) => {
    const progress = effect.timer / 400;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', effect.x, effect.y - progress * 30);
    ctx.restore();
  });
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

      updateGameState(state, dt);

      setHudState({
        score: state.score,
        timeRemaining: state.timeRemaining,
        targetCharacter: state.targetCharacter,
      });

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawBackground(ctx);
      drawHoleInteriors(ctx, state.holes);

      state.moles.forEach((mole, i) => {
        drawMoleBody(ctx, mole, state.holes[i]);
      });

      drawHoleRims(ctx, state.holes);

      drawHitEffects(ctx, state.hitEffects);
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

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [characters, difficulty, gameLoop]);

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

export default Game;
