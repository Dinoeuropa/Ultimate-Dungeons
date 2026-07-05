"use client";

import { SaveData } from "@/lib/types";

type MainMenuProps = {
  highScore: number;
  saveData: SaveData | null;
  dailySeed: string;
  onPlay: () => void;
  onContinue: () => void;
  onDailyRun: () => void;
  onTutorial: () => void;
  onHighScores: () => void;
  onAchievements: () => void;
  onSettings: () => void;
};

export function MainMenu({
  highScore,
  saveData,
  dailySeed,
  onPlay,
  onContinue,
  onDailyRun,
  onTutorial,
  onHighScores,
  onAchievements,
  onSettings,
}: MainMenuProps) {
  return (
    <div className="main-menu">
      <div className="main-menu__panel">
        <p className="main-menu__eyebrow">Mobile Edition</p>
        <h1>Ultimate Dungeons</h1>
        <p className="main-menu__tagline">
          Clear procedurally generated floors, defeat ghosts, and survive three boss
          encounters.
        </p>

        <div className="main-menu__actions">
          <button type="button" className="primary-btn" onClick={onPlay}>
            New Run
          </button>
          {saveData && (
            <button type="button" className="secondary-btn" onClick={onContinue}>
              Continue Floor {saveData.floor}
            </button>
          )}
          <button type="button" className="secondary-btn" onClick={onDailyRun}>
            Daily Run
          </button>
          <button type="button" className="secondary-btn" onClick={onTutorial}>
            Tutorial
          </button>
        </div>

        <div className="main-menu__meta">
          <span>Best Score: {highScore.toLocaleString()}</span>
          <span>Daily Seed: {dailySeed.slice(-8)}</span>
        </div>

        <div className="main-menu__footer">
          <button type="button" className="ghost-btn" onClick={onHighScores}>
            High Scores
          </button>
          <button type="button" className="ghost-btn" onClick={onAchievements}>
            Achievements
          </button>
          <button type="button" className="ghost-btn" onClick={onSettings}>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
