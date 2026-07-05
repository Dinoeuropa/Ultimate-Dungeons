"use client";

import { Achievement } from "@/lib/types";

type AchievementsPanelProps = {
  achievements: Achievement[];
  onClose: () => void;
};

export function AchievementsPanel({ achievements, onClose }: AchievementsPanelProps) {
  return (
    <div className="overlay-panel">
      <div className="overlay-panel__content">
        <h2>Achievements</h2>
        <ul className="achievement-list">
          {achievements.map((achievement) => (
            <li
              key={achievement.id}
              className={achievement.unlockedAt ? "achievement unlocked" : "achievement"}
            >
              <div>
                <strong>{achievement.title}</strong>
                <p>{achievement.description}</p>
              </div>
              <span>{achievement.unlockedAt ? "Unlocked" : "Locked"}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="primary-btn" onClick={onClose}>
          Back
        </button>
      </div>
    </div>
  );
}
