# Tamil Whack-a-Mole — Developer Handoff

## Overview

A whack-a-mole game designed to help people learn the Tamil alphabet. Players are shown a target character and must find and click the correct mole among distractors on a 4×4 grid. Built with React 19 and HTML5 Canvas — no game frameworks, no sprite sheets, all rendering is procedural.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 (Create React App) |
| Rendering | HTML5 Canvas 2D context |
| Animation | `requestAnimationFrame` loop |
| Language | Plain JavaScript (no TypeScript) |
| Testing | Jest + React Testing Library |
| Build | `react-scripts` 5.0.1 |

Zero third-party game/animation libraries. The entire game engine is ~300 lines of vanilla JS.

## Visual Design

Retro arcade Whac-A-Mole aesthetic with the classic palette:

| Color | Hex | Usage |
|---|---|---|
| Canary Yellow | `#FFD700` | Title text, score values, rivets, Tamil labels |
| Cherry Red | `#E31B23` | Selected states, labels, hit effects |
| Grass Green | `#4CAF50` | Playfield background |
| Clay Brown | `#8B4513` | Mole bodies, dirt mounds |
| Cobalt Blue | `#1E3A8A` | Cabinet border, panel borders |
| Neon Purple | `#7C3AED` | Whack starburst effect |
| Dark Navy | `#0F172A` | Body background, hole interiors |

Canvas sprites are fully procedural (no image assets):
- `drawBackground` - grass field with stripe texture, cobalt cabinet border, yellow rivets, banner
- `drawDirtMound` - double-layer clay mound with texture dots and grass tufts
- `drawMoleSprite` - cartoon mole with egg body, ears, cross-eyed pupils, pink nose, whiskers, golden Tamil label
- `drawWhackEffect` - purple starburst, yellow lightning bolts, red +10, romanized name float-up
- `drawWrongHitEffect` - red X mark, brown dust puffs

DESIGN.md contains the full design system specification.

## Project Structure

```
src/
├── index.js                    # Entry point, mounts <App />
├── index.css                   # Global body reset
├── App.js                      # Screen router: menu → game → gameover
├── App.css                     # All styles (menu, game, HUD, gameover)
├── App.test.js                 # Single smoke test
├── components/
│   ├── Menu.js                 # Character set selector, difficulty selector, start button
│   ├── Game.js                 # Canvas renderer, requestAnimationFrame loop, click handling
│   └── HUD.js                  # Score, timer, target character display
├── data/
│   └── tamilCharacters.js      # 64 Tamil characters (13 vowels, 18 consonants, 33 compound)
└── game/
    └── engine.js               # Pure game logic (state, spawning, hit detection, scoring, difficulty presets)
```

## How to Run

```bash
npm install        # install dependencies
npm start          # dev server on http://localhost:3000
npm run build      # production build to build/
npm test           # run tests
```

## Architecture

### Screen Flow (App.js)

```
menu ──onStart(chars, difficulty)──> game ──onGameOver(score)──> gameover
  ^                                                            |
  └───────────────── handleBackToMenu() ───────────────────────┘
  ^                                                            |
  └────────────────── handlePlayAgain() ───────────────────────┘
```

- `App.js` manages three screens via `useState('menu')`
- `characters` array and `difficulty` string are passed from Menu → Game
- Game component is remounted on replay via `key={Date.now()}`

### Menu (Menu.js)

- Character set selector: Vowels, Consonants, Compound Letters, All Characters
- Difficulty selector: Easy, Medium, Hard (defaults to Medium)
- Both selections required before Start button is enabled

### Game Engine (engine.js) — Pure Logic, No React

The engine is a set of pure functions that mutate a plain state object. No DOM, no React imports.

**Key exports:**
- `createGameState(characters, difficulty)` — factory, returns fresh state with difficulty-based timings
- `updateGameState(state, dt)` — advances timer, spawns moles, updates animations
- `handleClick(state, x, y, padding)` — hit detection, returns character or null (padding defaults to 0)
- Constants: `HOLE_WIDTH`, `HOLE_HEIGHT`, `MOLE_WIDTH`, `MOLE_HEIGHT`, `HOLE_ROWS`, `HOLE_COLS`, `STATES`
- `DIFFICULTY_PRESETS` — timing configurations for easy/medium/hard

**State object shape:**
```js
{
  characters: [],           // selected character set
  difficulty: 'medium',     // 'easy' | 'medium' | 'hard'
  holes: [],                // {x, y} positions for 16 holes
  moles: [],                // 16 mole objects (one per hole)
  targetCharacter: {},      // current character to find
  score: 0,
  timeRemaining: 60000,     // ms
  spawnTimer: 0,
  nextSpawnTime: 1500,      // randomized per batch
  riseDuration: 300,        // from difficulty preset
  visibleDuration: 2000,    // from difficulty preset
  fallDuration: 250,        // from difficulty preset
  spawnIntervalMin: 1500,   // from difficulty preset
  spawnIntervalMax: 3000,   // from difficulty preset
  molesPerBatch: 5,         // from difficulty preset
  gameOver: false,
  hitEffects: [],           // floating "+10" animations
  wrongHitEffects: [],      // floating "X" animations
}
```

**Mole object shape:**
```js
{
  state: 'hidden',          // 'hidden' | 'rising' | 'visible' | 'falling'
  character: null,          // { id, label, romanized, audio }
  isTarget: false,
  hit: false,               // true after being clicked, prevents re-scoring during fall
  timer: 0,                 // per-mole animation timer
  x: 0, y: 0,              // hole center position
  riseY: 0,                 // current Y position of mole top
}
```

**Mole lifecycle:**
```
HIDDEN → RISING (difficulty-based) → VISIBLE (difficulty-based) → FALLING (difficulty-based) → HIDDEN
```

### Difficulty Presets

| Parameter | Easy | Medium | Hard |
|---|---|---|---|
| Rise duration | 400ms | 300ms | 200ms |
| Visible duration | 2500ms | 2000ms | 1200ms |
| Fall duration | 300ms | 250ms | 200ms |
| Spawn interval | 2–3.5s | 1.5–3s | 0.8–1.8s |
| Moles per batch | 4 | 5 | 7 |

### Game Loop (Game.js)

```
requestAnimationFrame callback:
  1. Calculate dt from last frame
  2. updateGameState(state, dt)      — mutates engine state
  3. setHudState({...})              — triggers React HUD re-render
  4. Clear canvas
  5. drawBackground(ctx)             — gradient sky, sun
  6. drawHoleInteriors(ctx, holes)   — dark ellipses behind moles
  7. drawMoleBody(ctx, mole, hole)   — for each non-hidden mole
  8. drawHoleRims(ctx, holes)        — brown rims on top of moles
  9. drawHitEffects / drawWrongHitEffects
  10. If gameOver → onGameOver(score), stop loop
```

**Key detail:** Engine state lives in a `useRef` to avoid re-renders. Only the HUD triggers React re-renders via `setHudState`.

### Hit Detection

```js
handleClick(state, x, y, padding = 0) → character | null
```
- Iterates all 16 moles
- Checks bounding box: `[mole.x - MOLE_WIDTH/2 - padding, mole.riseY - padding]` to `[mole.x + MOLE_WIDTH/2 + padding, mole.y + padding]`
- Touch events pass dynamic padding to expand hit targets to 44px minimum on mobile
- Mouse events pass no padding (pixel-precise on desktop)
- If target hit: +10 score, new target picked, green "+10" effect, **all active moles fall**
- If wrong hit: -5 score (min 0), red "X" effect, only that mole falls
- Returns the hit character (for audio) or null

### Mole Spawning

- New batches only spawn when **all** previous moles have returned to HIDDEN state
- This prevents overlap between batches
- The `hit` flag on moles ensures clicked moles finish their falling animation before being reused

### Canvas Coordinates

Canvas is 800×720. Click coordinates are scaled from CSS pixels:
```js
const scaleX = CANVAS_WIDTH / rect.width;
const scaleY = CANVAS_HEIGHT / rect.height;
const x = (e.clientX - rect.left) * scaleX;
const y = (e.clientY - rect.top) * scaleY;
```

**Mobile touch handling:** Touch events calculate a dynamic padding to expand hit targets:
```js
const TOUCH_TARGET_MIN = 44; // Apple HIG minimum
const displayMoleWidth = MOLE_WIDTH * (rect.width / CANVAS_WIDTH);
const touchPadding = displayMoleWidth < TOUCH_TARGET_MIN
  ? Math.ceil(((TOUCH_TARGET_MIN - displayMoleWidth) / 2) * (CANVAS_WIDTH / rect.width))
  : 0;
```
This ensures moles are tappable on small screens without changing the visual appearance or desktop behavior.

## Grid Layout Constants

```js
HOLE_ROWS = 4
HOLE_COLS = 4
HOLE_START_X = 190
HOLE_START_Y = 195
HOLE_SPACING_X = 140
HOLE_SPACING_Y = 130
HOLE_WIDTH = 90
HOLE_HEIGHT = 30
MOLE_WIDTH = 60
MOLE_HEIGHT = 70
```

Grid is centered on the 800×720 canvas. Spans x=190..610, y=195..585.

## Game Mechanics

| Parameter | Value |
|---|---|
| Grid | 4×4 (16 holes) |
| Moles per batch | 4 / 5 / 7 (by difficulty) |
| Round duration | 60 seconds |
| Score per correct hit | +10 |
| Score per wrong hit | -5 (min 0) |
| Spawn interval | 0.8–3.5 seconds (by difficulty) |
| Rise animation | 200–400ms (by difficulty, ease-out cubic) |
| Visible duration | 1.2–2.5 seconds (by difficulty) |
| Fall animation | 200–300ms (by difficulty) |
| Correct hit behavior | All active moles fall |
| Wrong hit behavior | Only the clicked mole falls |

## Tamil Character Data (tamilCharacters.js)

```js
// Shape of each character:
{ id: 'ka', label: 'க', romanized: 'Ka', audio: 'ka.mp3' }

// Named export:
export const characterSets = {
  vowels: [...],      // 13 characters
  consonants: [...],  // 18 characters
  compound: [...],    // 33 characters
  all: [...],         // 64 characters (union of above)
};
```

## Extension Points

### Adding Mole Images

In `Game.js`, replace the `drawMoleBody` function. Currently draws a `fillRect`:
```js
// Current placeholder:
ctx.fillStyle = '#8B5E3C';
ctx.fillRect(moleX - MOLE_WIDTH / 2, visibleTop, MOLE_WIDTH, visibleHeight);

// To use an image:
const img = new Image();
img.src = 'mole.png';
// Draw only the visible portion above the ground line
ctx.drawImage(img, moleX - MOLE_WIDTH/2, visibleTop, MOLE_WIDTH, visibleHeight);
```

**Important:** The mole body is clipped to `groundY - riseY` height. Only the portion above the hole line is visible.

### Audio System

Audio uses a progressive enhancement approach with automatic fallback:

```js
// On module load, initAudioSystem() sets up voiceschanged listener
// to detect Tamil voices asynchronously (they load async on many browsers)

// playPlaceholderAudio(character):
// 1. If Tamil voice detected → Web Speech API (SpeechSynthesisUtterance, lang='ta-IN')
// 2. If no Tamil voice → AudioContext fallback (C5→E5 sine wave chime)
// 3. utterance.onerror catches silent failures (common on Windows)
```

**Platform support:**
- macOS/iOS: Tamil pronunciation via Web Speech API
- Windows: Pleasant two-tone chime via AudioContext (no MP3 downloads needed)
- Android: Tamil pronunciation via Web Speech API (Google TTS)

**Visual feedback:** All correct hits show the romanized character name floating up alongside the "+10" effect. This provides feedback even when audio is unavailable.

**Design decisions:**
- No pre-generated MP3 files — keeps the app lightweight (zero audio asset downloads)
- AudioContext is lazy-initialized (created on first use, not on page load)
- AudioContext uses `webkitAudioContext` fallback for Safari compatibility
- `ctx.resume()` called if AudioContext is suspended (autoplay policy compliance)

### Adding More Characters

Add entries to the appropriate array in `tamilCharacters.js`:
```js
{ id: 'unique_id', label: 'க', romanized: 'Ka', audio: 'ka.mp3' }
```

### Adding High Scores

Scores are persisted in `localStorage` under key `tamilWamScores` (top 10). The leaderboard is displayed on the game-over screen. To extend:
```js
// Current shape in localStorage:
[{ score: 100, difficulty: 'medium', date: 1720000000000 }, ...]
```

## Known Issues

1. ~~**UI does not scale on mobile**~~ — Fixed. Touch handler calculates dynamic padding to expand hit targets to 44px minimum on small screens. CSS media query reduces container padding on mobile to maximize canvas display width. Mouse clicks remain pixel-precise on desktop.

2. ~~**Audio does not work on Windows**~~ — Fixed. Replaced bare Web Speech API with progressive enhancement system: voiceschanged listener detects Tamil voices, AudioContext fallback generates a pleasant C5-E5 chime on platforms without Tamil TTS, utterance.onerror catches silent failures. Zero audio asset downloads.

3. ~~**Audio placeholder**~~ — Fixed. Replaced broken mp3 file loading with Web Speech API. Works on macOS/iOS; Windows has issues (see #2).

4. ~~**HTML metadata still says CRA defaults**~~ — Fixed.

5. ~~**Unused CRA boilerplate**~~ — Resolved.

6. ~~**No score persistence**~~ — Fixed. Scores saved to localStorage.

7. ~~**Hole re-drawing redundancy**~~ — Fixed.

8. ~~**No mobile touch events**~~ — Fixed. Touch handler added, but UI scaling still broken (see #1).

9. ~~**Single smoke test**~~ — Fixed. Added `engine.test.js`.

10. ~~**`lastHit` prop passed to HUD but not rendered**~~ — Removed stale references.
