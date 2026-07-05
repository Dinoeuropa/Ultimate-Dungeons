"use client";

type MobileHUDProps = {
  visible: boolean;
  paused: boolean;
  floor?: number;
  score?: number;
  hp?: number;
  maxHp?: number;
  stamina?: number;
  maxStamina?: number;
  onPause: () => void;
};

function pct(value?: number, max?: number) {
  if (value == null || max == null || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export function MobileHUD({
  visible,
  paused,
  floor = 0,
  score = 0,
  hp,
  maxHp,
  stamina,
  maxStamina,
  onPause,
}: MobileHUDProps) {
  if (!visible) return null;

  return (
    <header className="mobile-hud">
      <button type="button" className="mobile-hud__pause" onClick={onPause}>
        {paused ? "Paused" : "Pause"}
      </button>
      <div className="mobile-hud__stat">Floor {floor}</div>
      <div className="mobile-hud__meter" aria-label="Health">
        <span>HP</span>
        <div className="meter">
          <i style={{ width: `${pct(hp, maxHp)}%` }} />
        </div>
      </div>
      <div className="mobile-hud__meter" aria-label="Stamina">
        <span>ST</span>
        <div className="meter meter--stamina">
          <i style={{ width: `${pct(stamina, maxStamina)}%` }} />
        </div>
      </div>
      <div className="mobile-hud__score">{score.toLocaleString()} pts</div>
    </header>
  );
}
