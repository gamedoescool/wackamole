function HUD({ score, timeRemaining, targetCharacter, isPaused, onTogglePause }) {
  const seconds = Math.ceil(timeRemaining / 1000);
  const isLowTime = seconds <= 10;

  return (
    <div className="hud">
      <div className="hud-score">
        <span className="hud-label">Score</span>
        <span className="hud-value">{score}</span>
      </div>
      <div className="hud-target">
        <span className="hud-label">Find this character</span>
        {targetCharacter && (
          <div className="hud-target-display">
            <span className="hud-target-char">{targetCharacter.label}</span>
            <span className="hud-target-romanized">{targetCharacter.romanized}</span>
          </div>
        )}
      </div>
      <button className="hud-pause-btn" onClick={onTogglePause}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <div className="hud-timer">
        <span className="hud-label">Time</span>
        <span className={`hud-value ${isLowTime ? 'low-time' : ''}`}>
          {seconds}s
        </span>
      </div>
    </div>
  );
}

export default HUD;
