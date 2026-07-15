HANDOFF CONTEXT
===============

USER REQUESTS (AS-IS)
---------------------
- "Use design principles to rewrite the UI of this site into a modern black and white feel. Keep it minimial and modern."
- "use and study this design pallate and remake the UI [classic Whac-A-Mole palette]. if possible create actual sprites for the wackamole objects as well."
- "Within tamilCharacters.js exsists a file that attempts to link different tamil letters with audio, but currently this audio does not lead anywhere. The intention is to play this audio on a correct hit. Can you first research any libraries with the prounounciation of all characters listed in this file?"
- "do option one without the pregeneration" (Web Speech API)
- "read thru the db and update HANDOFF and graphify. current problems: 1. UI does not scale in mobile (moles are too small in mobile) 2. Audio does not work in windows (API issue)"

GOAL
----
Fix two blocking issues: (1) make the UI scale properly on mobile so moles are tap-friendly, and (2) fix audio playback on Windows where Web Speech API silently fails.

WORK COMPLETED
--------------
- Redesigned entire UI from minimal B&W to retro arcade Whac-A-Mole aesthetic
- Created DESIGN.md with full color palette and design system tokens
- Rewrote src/App.css (384 lines) with cobalt blue borders, cherry red accents, canary yellow highlights
- Rewrote src/components/Game.js with 5 procedural canvas sprite functions: drawBackground, drawDirtMound, drawMoleSprite, drawWhackEffect, drawWrongHitEffect
- Implemented cartoon mole character with egg body, ears, cross-eyed pupils, pink nose, whiskers, golden Tamil label
- Replaced broken mp3 audio with Web Speech API using SpeechSynthesisUtterance with ta-IN locale
- Added Tamil voice auto-detection with rate=0.8 for clarity
- Updated HANDOFF.md with current known issues and audio implementation details
- Ran graphify to re-index codebase: 95 nodes, 134 edges, 9 communities

CURRENT STATE
-------------
- Build passes clean (react-scripts 5.0.1)
- Game logic untouched (engine.js unchanged)
- Canvas is fixed 800x720 with CSS max-width scaling (causes mobile issue)
- Audio uses Web Speech API (works macOS/iOS, fails on Windows)
- DESIGN.md documents the retro arcade design system
- HANDOFF.md updated with current known issues

PENDING TASKS
-------------
1. UI mobile scaling: Canvas is 800x720 fixed pixels. CSS max-width:100% scales it down but moles become tiny. Need dynamic canvas sizing or responsive grid constants. Consider: (a) scale HOLE_WIDTH/MOLE_WIDTH based on viewport, (b) use devicePixelRatio for crisp rendering, (c) set minimum touch target size of 44x44px per Apple HIG.
2. Windows audio: Web Speech API silently fails on Windows. Options: (a) pre-generate 64 mp3 files using Google TTS or Edge TTS, (b) use a TTS library like speak-tts, (c) detect Windows and show visual-only feedback. Pre-generating mp3s is most reliable cross-platform solution.

KEY FILES
---------
- src/components/Game.js - Canvas renderer, sprite drawing, audio, click/touch handling (695 lines)
- src/App.css - All UI styles, retro arcade theme (384 lines)
- src/game/engine.js - Pure game logic, state management, hit detection
- src/data/tamilCharacters.js - 64 Tamil characters with audio field references
- src/components/Menu.js - Character set and difficulty selector
- src/components/HUD.js - Score, timer, target display
- DESIGN.md - Design system specification with color tokens
- HANDOFF.md - Project documentation and known issues
- graphify-out/graph.json - Knowledge graph (95 nodes, 134 edges)

IMPORTANT DECISIONS
-------------------
- Web Speech API chosen over pre-generated mp3s for zero-dependency audio (but Windows compatibility is poor)
- Procedural canvas sprites chosen over image assets (no asset loading, fully self-contained)
- Canvas coordinate system is 800x720 fixed with CSS scaling (simple but causes mobile issues)
- Retro arcade palette applied: canary yellow, cherry red, grass green, clay brown, cobalt blue, neon purple

EXPLICIT CONSTRAINTS
--------------------
- "Keep it minimial and modern" (original request, later overridden by retro arcade palette request)
- "do option one without the pregeneration" (user chose Web Speech API over mp3 generation)

CONTEXT FOR CONTINUATION
------------------------
- The game uses a 4x4 grid with HOLE_ROWS=4, HOLE_COLS=4
- Grid constants in engine.js: HOLE_WIDTH=90, HOLE_HEIGHT=30, MOLE_WIDTH=60, MOLE_HEIGHT=70
- Canvas coordinates are scaled from CSS pixels: scaleX = CANVAS_WIDTH / rect.width
- Touch handler exists (handleTouchStart) but the small canvas on mobile makes moles hard to hit
- Windows audio issue is in playPlaceholderAudio() function (lines 34-60 of Game.js)
- speechSynthesis.getVoices() may return empty array on Windows; speechSynthesis.speak() may silently fail
- Consider adding a fallback: if speechSynthesis fails, try Audio element with pre-generated files
- Graphify graph is at graphify-out/graph.json, report at graphify-out/GRAPH_REPORT.md
