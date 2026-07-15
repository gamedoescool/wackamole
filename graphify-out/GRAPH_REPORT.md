# Graph Report - .  (2026-07-14)

## Corpus Check
- Corpus is ~9,535 words - fits in a single context window. You may not need a graph.

## Summary
- 93 nodes · 127 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7

## God Nodes (most connected - your core abstractions)
1. `Game()` - 13 edges
2. `createGameState()` - 6 edges
3. `spawnBatch()` - 6 edges
4. `updateGameState()` - 6 edges
5. `scripts` - 5 edges
6. `App()` - 5 edges
7. `handleClick()` - 5 edges
8. `production` - 4 edges
9. `development` - 4 edges
10. `pickRandomCharacter()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Game()` --calls--> `createGameState()`  [EXTRACTED]
  src/components/Game.js → src/game/engine.js
- `Game()` --calls--> `handleClick()`  [EXTRACTED]
  src/components/Game.js → src/game/engine.js
- `Game()` --calls--> `updateGameState()`  [EXTRACTED]
  src/components/Game.js → src/game/engine.js

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-scripts, eslintConfig, extends, name, private (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (14): allMolesHidden(), createGameState(), DIFFICULTY_PRESETS, easeOutCubic(), findEmptyHoles(), getHolePositions(), handleClick(), pickDistractors() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.30
Nodes (10): drawBackground(), drawHitEffects(), drawHoleInteriors(), drawHoleRims(), drawMoleBody(), drawPauseOverlay(), drawWrongHitEffects(), Game() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (9): browserslist, development, production, >0.2%, last 1 chrome version, last 1 firefox version, last 1 safari version, not dead (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (9): devDependencies, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, @testing-library/dom, @testing-library/jest-dom, @testing-library/react (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (7): DIFFICULTY_OPTIONS, Menu(), MENU_OPTIONS, characterSets, compound, consonants, vowels

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 7 - "Community 7"
Cohesion: 0.43
Nodes (5): App(), formatDate(), loadScores(), saveScore(), root

## Knowledge Gaps
- **37 isolated node(s):** `name`, `version`, `private`, `react`, `react-dom` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `browserslist` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._