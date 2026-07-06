"use client";

type TutorialOverlayProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function TutorialOverlay({ visible, onDismiss }: TutorialOverlayProps) {
  if (!visible) return null;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-overlay__panel">
        <p className="main-menu__eyebrow">Quick Tutorial</p>
        <h2>How to Play</h2>
        <ul className="tutorial-list">
          <li>
            <strong>D-pad</strong> — move through procedurally generated floors
          </li>
          <li>
            <strong>Melee</strong> — close-range slash (high damage, uses stamina)
          </li>
          <li>
            <strong>Ranged</strong> — fire a bolt in your facing direction
          </li>
          <li>
            <strong>Block</strong> — shield against spirit attacks
          </li>
          <li>Defeat all <strong>purple spirits</strong> to unlock the exit door</li>
          <li>Bosses appear on floors <strong>12, 23, and 34</strong></li>
        </ul>
        <button type="button" className="primary-btn" onClick={onDismiss}>
          Got it — let&apos;s go!
        </button>
      </div>
    </div>
  );
}
