# Deployment

## Mobile PWA (Vercel)

1. Set the project root to `mobile/`.
2. Build command: `npm run build`
3. Output directory: `out`
4. Install command: `npm install`

The static export includes:

- Next.js app shell
- `/game/` MakeCode runtime assets
- PWA manifest and service worker

## GitHub Actions

The workflow in `.github/workflows/mobile-deploy.yml`:

- Installs and builds the mobile shell on pushes to `main`
- Uploads the static `out/` artifact

## Rebuilding the MakeCode Game

When you change files in `game/`:

1. Open the project in [MakeCode Arcade](https://arcade.makecode.com/)
2. Import from this repository's `game/` folder
3. Download or push the updated build
4. Copy `assets/js/binary.js` to both:
   - `game/assets/js/binary.js`
   - `mobile/public/game/js/binary.js`

`game/mobileBridge.ts` adds pause, difficulty, and state sync hooks once recompiled.

## Capacitor Native Builds

From `mobile/` after a production web build:

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
npx cap open ios
```

Use the generated app icons in `public/icons/` for store listings.

## Environment Notes

- The game iframe loads from `/game/index.html` on the same origin.
- Service worker caches shell assets and stores `binary.js` after first load.
- Capacitor haptics fall back to `navigator.vibrate` on the web.
