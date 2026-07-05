# Ultimate Dungeons — MakeCode Arcade Game

Retro dungeon crawler source built with [MakeCode Arcade](https://arcade.makecode.com/).

## Edit in MakeCode

1. Open https://arcade.makecode.com/
2. Import URL: this repository's `game/` folder
3. Edit blocks or TypeScript
4. Save to GitHub or download build

## Mobile Integration

`mobileBridge.ts` adds shell integration hooks:

- Pause / resume from the mobile app
- Difficulty modes (Easy / Normal / Hard stamina regen)
- Periodic game state sync to the PWA shell

After editing game files, recompile in MakeCode and copy the new `assets/js/binary.js` to:

- `game/assets/js/binary.js`
- `mobile/public/game/js/binary.js`

Or run from repo root:

```bash
./scripts/sync-game-assets.sh
```

## Local Web Build

Open `assets/index.html` in a browser.

`assets/js/custom.js` bridges touch controls and hides the default MakeCode on-screen gamepad when embedded in the mobile shell.

## Key Files

| File | Purpose |
|------|---------|
| `main.blocks` | Visual blocks source |
| `main.ts` | Generated TypeScript (avoid hand-editing) |
| `mobileBridge.ts` | Mobile shell messaging and difficulty hooks |
| `assets/js/binary.js` | Compiled game runtime |
| `assets/js/custom.js` | Web shell control bridge |
| `pxt.json` | MakeCode project manifest |
