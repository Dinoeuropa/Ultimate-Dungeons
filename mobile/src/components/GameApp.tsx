"use client";

import { useEffect, useMemo, useState } from "react";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { GameCanvas } from "@/components/GameCanvas";
import { HighScoresPanel } from "@/components/HighScoresPanel";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MainMenu } from "@/components/MainMenu";
import { MobileHUD } from "@/components/MobileHUD";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SplashScreen } from "@/components/SplashScreen";
import { withBasePath } from "@/lib/paths";
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
import { difficultyToValue, GameStatePayload, SaveData } from "@/lib/types";

type Screen =
  | "splash"
  | "menu"
  | "game"
  | "highscores"
  | "achievements"
  | "settings";

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [highScores, setHighScores] = useState<number[]>([]);
  const [achievements, setAchievements] = useState(getAchievements());
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [gameState, setGameState] = useState<GameStatePayload | null>(null);
  const [sessionBest, setSessionBest] = useState(0);
  const [showPortraitWarning, setShowPortraitWarning] = useState(false);

  const dailySeed = useMemo(() => getDailySeed(), []);

  useEffect(() => {
    setHighScores(getHighScores());
    setSaveData(getSaveData());
    setAchievements(getAchievements());

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(withBasePath("/sw.js")).catch(() => undefined);
    }
  }, []);

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
        dailySeed,
      };
      saveRun(nextSave);
      setSaveData(nextSave);
    }
  }, [dailySeed, gameState, sessionBest]);

  const finishSession = () => {
    if (sessionBest > 0) {
      addHighScore(sessionBest);
      setHighScores(getHighScores());
    }
    setSessionBest(0);
    setPaused(false);
    setScreen("menu");
  };

  const startGame = (mode: "new" | "continue" | "daily") => {
    if (mode === "new") {
      clearSave();
      setSaveData(null);
    }
    if (mode === "daily") {
      markDailyRunPlayed();
      setAchievements(getAchievements());
    }
    setSessionBest(0);
    setPaused(false);
    setScreen("game");
  };

  return (
    <div className="app-root">
      <InstallPrompt />

      {showPortraitWarning && screen === "game" && (
        <div className="orientation-warning">
          Rotate to landscape for the best dungeon crawling experience.
        </div>
      )}

      {screen === "splash" && (
        <SplashScreen onComplete={() => setScreen("menu")} />
      )}

      {screen === "menu" && (
        <MainMenu
          highScore={highScores[0] ?? 0}
          saveData={saveData}
          dailySeed={dailySeed}
          onPlay={() => startGame("new")}
          onContinue={() => startGame("continue")}
          onDailyRun={() => startGame("daily")}
          onTutorial={() => {
            alert(
              "Controls:\n• D-pad: Move\n• Melee: Close combat\n• Ranged: Projectile (uses stamina)\n• Block: Block ranged attacks and minions\n\nDefeat all ghosts to unlock the exit door.",
            );
          }}
          onHighScores={() => setScreen("highscores")}
          onAchievements={() => setScreen("achievements")}
          onSettings={() => setScreen("settings")}
        />
      )}

      {screen === "highscores" && (
        <HighScoresPanel
          scores={highScores}
          onClose={() => setScreen("menu")}
        />
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
            onPause={() => setPaused(true)}
          />
          <GameCanvas
            active
            paused={paused}
            difficultyValue={difficultyToValue(settings.difficulty)}
            onReady={() => undefined}
            onStateChange={setGameState}
            onResume={() => setPaused(false)}
            onQuit={finishSession}
          />
        </>
      )}
    </div>
  );
}
