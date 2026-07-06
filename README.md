# Ultimate Dungeons

A retro arcade dungeon crawler built with Microsoft MakeCode Arcade, wrapped in a mobile-first Progressive Web App.

## Project Structure

```
├── game/          # MakeCode Arcade source and compiled web build
├── mobile/        # Next.js mobile app shell (PWA)
├── docs/          # Design and deployment notes
└── README.md
```

## Play on iPhone / Mobile

**Do not use `localhost` on your phone** — that only works on the same machine running the dev server.

### Option A: GitHub Pages (free)

After enabling GitHub Pages in repo settings (**Settings → Pages → Source: GitHub Actions**), the game will be at:

**https://dinoeuropa.github.io/Ultimate-Dungeons/**

In Safari: Share → **Add to Home Screen** to install the PWA.

### Option B: Vercel

1. Import this repo at [vercel.com](https://vercel.com)
2. Leave root directory as **`.`** (repo root) — `vercel.json` builds `mobile/` automatically
3. Deploy and open the Vercel URL on your phone

## Play Locally (development)

### Mobile App (recommended)

```bash
cd mobile
npm install
npm run dev
```

Open http://localhost:3000 on your phone or desktop browser.

### Game Only

Open `game/assets/index.html` in a browser, or serve the `game/assets/` folder statically.

## Editing the Game

1. Open [MakeCode Arcade](https://arcade.makecode.com/)
2. Import URL: `https://github.com/Dinoeuropa/Ultimate-Dungeons` (game folder)
3. Edit blocks or add TypeScript in `mobileBridge.ts`
4. Export to GitHub or download and copy updated `assets/js/binary.js`

Game logic lives in `game/main.blocks` / `game/main.ts`. Prefer the blocks editor for gameplay changes; use `game/mobileBridge.ts` for mobile shell integration.

## Mobile Features

- Custom virtual D-pad and action buttons (Melee, Ranged, Block)
- Landscape-first layout with safe-area support
- Installable PWA with offline caching
- High scores, achievements, save/resume, and daily run seed
- Difficulty modes (Easy / Normal / Hard)
- Optional Capacitor native packaging for iOS/Android

## Deploy

The mobile app is configured for static export and Vercel deployment:

```bash
cd mobile
npm run build
```

See [docs/deployment.md](docs/deployment.md) for CI and store packaging details.

## Original Game

Based on [ultimate-dungeons-](https://github.com/Dinoeuropa/ultimate-dungeons-) by Dinoeuropa.
