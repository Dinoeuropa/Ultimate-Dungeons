"use client";

type PauseMenuProps = {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
};

export function PauseMenu({ onResume, onRestart, onQuit }: PauseMenuProps) {
  return (
    <div className="pause-menu">
      <div className="pause-menu__panel">
        <h2>Paused</h2>
        <button type="button" onClick={onResume}>
          Resume
        </button>
        <button type="button" onClick={onRestart}>
          Restart Run
        </button>
        <button type="button" onClick={onQuit}>
          Main Menu
        </button>
      </div>
    </div>
  );
}
