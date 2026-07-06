"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameSnapshot } from "@/game/types";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { HighScoresPanel } from "@/components/HighScoresPanel";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MainMenu } from "@/components/MainMenu";
import { MobileHUD } from "@/components/MobileHUD";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SplashScreen } from "@/components/SplashScreen";
import { StandaloneGame } from "@/components/StandaloneGame";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import {
  addHighScore,
  clearSave,
  evaluateAchievements,
  getAchievements,
  getDailySeed,
  getHighScores,
  getSaveData,
  getSettings,
  markDailyRunPlayed,
  saveRun,
  saveSettings,
} from "@/lib/storage";
import { SaveData } from "@/lib/types";

type Screen =
  | "splash"
  | "menu"
  | "game"
  | "highscores"
  | "achievements"
  | "settings"
  | "gameover";

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [highScores, setHighScores] = useState<number[]>([]);
  const [achievements, setAchievements] = useState(getAchievements());
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [gameState, setGameState] = useState<GameSnapshot | null>(null);
  const gameStateRef = useRef<GameSnapshot | null>(null);

  const handleStateChange = useCallback((snapshot: GameSnapshot) => {
    gameStateRef.current = snapshot;
    setGameState(snapshot);
  }, []);
  const [sessionBest, setSessionBest] = useState(0);
  const [dailySeed, setDailySeed] = useState<number | undefined>(undefined);
  const [continueRun, setContinueRun] = useState<SaveData | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPortraitWarning, setShowPortraitWarning] = useState(false);

  const dailySeedLabel = useMemo(() => getDailySeed(), []);

  useEffect(() => {
    setHighScores(getHighScores());
    setSaveData(getSaveData());
    setAchievements(getAchievements());

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js`,
      ).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    let remove: (() => void) | undefined;

    void import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("backButton", () => {
          if (screen === "game") {
            setPaused(true);
          } else if (screen !== "menu" && screen !== "splash") {
            setScreen("menu");
          }
        }),
      )
      .then((handle) => {
        remove = () => void handle.remove();
      })
      .catch(() => undefined);

    return () => remove?.();
  }, [screen]);

  useEffect(() => {
    const updateOrientation = () => {
      setShowPortraitWarning(window.innerHeight > window.innerWidth);
    };
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.score > sessionBest) {
      setSessionBest(gameState.score);
    }

    evaluateAchievements({ floor: gameState.floor, score: gameState.score });
    setAchievements(getAchievements());

    if (gameState.inGame && gameState.floor > 0) {
      const nextSave: SaveData = {
        floor: gameState.floor,
        score: gameState.score,
        hp: gameState.hp,
        stamina: gameState.stamina,
        savedAt: new Date().toISOString(),
        dailySeed: dailySeedLabel,
      };
      saveRun(nextSave);
      setSaveData(nextSave);
    }
  }, [dailySeedLabel, gameState, sessionBest]);

  const finishSession = (score?: number) => {
    const best = score ?? sessionBest;
    if (best > 0) {
      addHighScore(best);
      setHighScores(getHighScores());
    }
    setSessionBest(0);
    setPaused(false);
    setContinueRun(null);
    setDailySeed(undefined);
    setScreen("menu");
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    addHighScore(score);
    setHighScores(getHighScores());
    clearSave();
    setSaveData(null);
    setScreen("gameover");
  };

  const startGame = (mode: "new" | "continue" | "daily") => {
    if (mode === "new") {
      clearSave();
      setSaveData(null);
      setContinueRun(null);
      setDailySeed(undefined);
    } else if (mode === "continue" && saveData) {
      setContinueRun(saveData);
      setDailySeed(undefined);
    } else if (mode === "daily") {
      markDailyRunPlayed();
      setAchievements(getAchievements());
      const seed = Array.from(getDailySeed()).reduce(
        (acc, ch) => acc + ch.charCodeAt(0),
        0,
      );
      setDailySeed(seed);
      setContinueRun(null);
      clearSave();
    }
    setSessionBest(0);
    setPaused(false);
    setShowTutorial(settings.showTutorialOnStart && mode === "new");
    setScreen("game");
  };

  return (
    <div className="app-root">
      <InstallPrompt />

      {showPortraitWarning && screen === "game" && (
        <div className="orientation-warning">
          Rotate to landscape for the best dungeon experience.
        </div>
      )}

      {screen === "splash" && (
        <SplashScreen onComplete={() => setScreen("menu")} />
      )}

      {screen === "menu" && (
        <MainMenu
          highScore={highScores[0] ?? 0}
          saveData={saveData}
          dailySeed={dailySeedLabel}
          onPlay={() => startGame("new")}
          onContinue={() => startGame("continue")}
          onDailyRun={() => startGame("daily")}
          onTutorial={() => {
            alert(
              "Ultimate Dungeons — Controls\n\n• D-pad: Move through procedurally generated floors\n• Melee: Powerful close-range slash (uses stamina)\n• Ranged: Fire a bolt in your facing direction\n• Block: Shield against ghost attacks and projectiles\n\nDefeat all spirits to unlock the exit door. Bosses await on floors 12, 23, and 34.",
            );
          }}
          onHighScores={() => setScreen("highscores")}
          onAchievements={() => setScreen("achievements")}
          onSettings={() => setScreen("settings")}
        />
      )}

      {screen === "highscores" && (
        <HighScoresPanel scores={highScores} onClose={() => setScreen("menu")} />
      )}

      {screen === "achievements" && (
        <AchievementsPanel
          achievements={achievements}
          onClose={() => setScreen("menu")}
        />
      )}

      {screen === "settings" && (
        <SettingsPanel
          settings={settings}
          onChange={(next) => {
            setSettings(next);
            saveSettings(next);
          }}
          onClose={() => setScreen("menu")}
        />
      )}

      {screen === "gameover" && (
        <div className="overlay-panel">
          <div className="overlay-panel__content gameover-panel">
            <p className="main-menu__eyebrow">Run Complete</p>
            <h2>Game Over</h2>
            <p className="gameover-score">{finalScore.toLocaleString()} points</p>
            <button type="button" className="primary-btn" onClick={() => setScreen("menu")}>
              Return to Menu
            </button>
          </div>
        </div>
      )}

      {screen === "game" && (
        <>
          <MobileHUD
            visible
            paused={paused}
            floor={gameState?.floor}
            score={gameState?.score}
            hp={gameState?.hp}
            maxHp={gameState?.maxHp}
            stamina={gameState?.stamina}
            maxStamina={gameState?.maxStamina}
            timeBonus={gameState?.timeBonus}
            enemyCount={gameState?.enemyCount}
            bossName={gameState?.bossName}
            bossHp={gameState?.bossHp}
            bossMaxHp={gameState?.bossMaxHp}
            endlessUnlocked={gameState?.endlessUnlocked}
            onPause={() => setPaused(true)}
          />
          <TutorialOverlay
            visible={showTutorial && !paused}
            onDismiss={() => setShowTutorial(false)}
          />
          <StandaloneGame
            active
            paused={paused || showTutorial}
            dailySeed={dailySeed}
            continueRun={continueRun}
            difficulty={settings.difficulty}
            soundEnabled={settings.soundEnabled}
            hapticsEnabled={settings.hapticsEnabled}
            onReady={() => undefined}
            onStateChange={handleStateChange}
            onGameOver={handleGameOver}
            onResume={() => setPaused(false)}
            onQuit={() => finishSession()}
          />
        </>
      )}
    </div>
  );
}
