"use client";

import { GameSettings } from "@/lib/types";

type SettingsPanelProps = {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onClose: () => void;
};

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  return (
    <div className="overlay-panel">
      <div className="overlay-panel__content">
        <h2>Settings</h2>

        <label className="setting-row">
          <span>Sound</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(event) =>
              onChange({ ...settings, soundEnabled: event.target.checked })
            }
          />
        </label>

        <label className="setting-row">
          <span>Haptics</span>
          <input
            type="checkbox"
            checked={settings.hapticsEnabled}
            onChange={(event) =>
              onChange({ ...settings, hapticsEnabled: event.target.checked })
            }
          />
        </label>

        <label className="setting-row">
          <span>Difficulty</span>
          <select
            value={settings.difficulty}
            onChange={(event) =>
              onChange({
                ...settings,
                difficulty: event.target.value as GameSettings["difficulty"],
              })
            }
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label className="setting-row">
          <span>Show tutorial on start</span>
          <input
            type="checkbox"
            checked={settings.showTutorialOnStart}
            onChange={(event) =>
              onChange({ ...settings, showTutorialOnStart: event.target.checked })
            }
          />
        </label>

        <button type="button" className="primary-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
