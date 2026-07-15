import { useState, useCallback } from 'react';
import Menu from './components/Menu';
import Game from './components/Game';
import './App.css';

const STORAGE_KEY = 'tamilWamScores';

function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveScore(score, difficulty) {
  const scores = loadScores();
  scores.push({ score, difficulty, date: Date.now() });
  scores.sort((a, b) => b.score - a.score);
  const top10 = scores.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));
  return top10;
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function App() {
  const [screen, setScreen] = useState('menu');
  const [characters, setCharacters] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [finalScore, setFinalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const handleStart = useCallback((chars, diff) => {
    setCharacters(chars);
    setDifficulty(diff);
    setScreen('game');
  }, []);

  const handleGameOver = useCallback((score) => {
    setFinalScore(score);
    const top10 = saveScore(score, difficulty);
    setLeaderboard(top10);
    setScreen('gameover');
  }, [difficulty]);

  const handlePlayAgain = useCallback(() => {
    setScreen('game');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setScreen('menu');
    setCharacters([]);
  }, []);

  return (
    <div className="app">
      {screen === 'menu' && <Menu onStart={handleStart} />}
      {screen === 'game' && (
        <Game
          key={Date.now()}
          characters={characters}
          difficulty={difficulty}
          onGameOver={handleGameOver}
        />
      )}
      {screen === 'gameover' && (
        <div className="gameover">
          <h1 className="gameover-title">Time's Up!</h1>
          <p className="gameover-score">Your Score: {finalScore}</p>
          {leaderboard.length > 0 && (
            <div className="leaderboard">
              <h2 className="leaderboard-title">Top 10 Scores</h2>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Score</th>
                    <th>Difficulty</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={i} className={entry.score === finalScore ? 'leaderboard-current' : ''}>
                      <td>{i + 1}</td>
                      <td>{entry.score}</td>
                      <td className="leaderboard-difficulty">{entry.difficulty}</td>
                      <td>{formatDate(entry.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="gameover-buttons">
            <button className="gameover-btn" onClick={handlePlayAgain}>
              Play Again
            </button>
            <button className="gameover-btn secondary" onClick={handleBackToMenu}>
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
