"use client";

type HighScoresPanelProps = {
  scores: number[];
  onClose: () => void;
};

export function HighScoresPanel({ scores, onClose }: HighScoresPanelProps) {
  return (
    <div className="overlay-panel">
      <div className="overlay-panel__content">
        <h2>High Scores</h2>
        {scores.length === 0 ? (
          <p>No scores yet. Survive a run to set the board.</p>
        ) : (
          <ol className="score-list">
            {scores.map((score, index) => (
              <li key={`${score}-${index}`}>
                <span>#{index + 1}</span>
                <strong>{score.toLocaleString()}</strong>
              </li>
            ))}
          </ol>
        )}
        <button type="button" className="primary-btn" onClick={onClose}>
          Back
        </button>
      </div>
    </div>
  );
}
