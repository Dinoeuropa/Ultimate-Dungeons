# Ultimate Dungeons

A standalone retro dungeon crawler built with **Phaser 3** and **Next.js**, designed for mobile browsers and installable as a PWA.

## What's New (Standalone Rewrite)

The game no longer depends on MakeCode Arcade. It runs as a native web game engine with:

- **Procedural dungeon generation** — A* path carving through randomized floor layouts (faithful to the original algorithm)
- **Upgraded combat** — melee slash FX, ranged bolts, block shield, floating damage numbers, screen shake
- **Modern mobile UI** — redesigned HUD with boss health bar, spirit counter, time bonus, and touch controls
- **Boss floors** — Crab King (12), Basilisk (23), Dinosaur (34)
- **Progression** — high scores, achievements, save/resume, daily seeded runs

## Project Structure

```
game/          # Original MakeCode source (archived reference)
mobile/        # Standalone Phaser 3 game + PWA shell (deploy this)
  src/game/    # Game engine, dungeon generator, combat, scenes
docs/          # Deployment guides
```

## Play on iPhone

Deploy to Vercel or GitHub Pages — **do not use localhost on your phone**.

### GitHub Pages

1. Enable **Settings → Pages → Source: GitHub Actions**
2. Open **https://dinoeuropa.github.io/Ultimate-Dungeons/**
3. Safari → Share → **Add to Home Screen**

### Vercel

Import the repo with root directory `.` — `vercel.json` builds `mobile/` automatically.

## Local Development

```bash
cd mobile
npm install
npm run dev
```

Open the forwarded URL or `http://localhost:3000` on the same machine running the dev server.

## Game Controls

| Input | Action |
|-------|--------|
| D-pad | Move |
| Melee | Close-range slash (50 damage, 60 stamina) |
| Ranged | Directional bolt (20 damage, 15 stamina) |
| Block | Shield against spirit attacks |

Defeat all spirits to unlock the exit door. Pick up hearts for +35 HP.

## Tech Stack

- **Phaser 3** — game rendering, combat, entities
- **Next.js 15** — app shell, menus, PWA
- **TypeScript** — game logic and UI
- **Capacitor** (optional) — native iOS/Android packaging

## Original Game

The MakeCode Arcade source is preserved in `game/` for reference.
