"use client";

type SplashScreenProps = {
  onComplete: () => void;
};

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div className="splash-screen">
      <div className="splash-screen__content">
        <p className="splash-screen__eyebrow">Retro Arcade</p>
        <h1>Ultimate Dungeons</h1>
        <p>Procedural dungeons. Ghosts. Bosses. One hero.</p>
        <button type="button" className="primary-btn" onClick={onComplete}>
          Enter
        </button>
      </div>
    </div>
  );
}
