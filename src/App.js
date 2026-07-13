import { useState, useCallback } from 'react';
import Menu from './components/Menu';
import Game from './components/Game';
import './App.css';

function App() {
  const [screen, setScreen] = useState('menu');
  const [characters, setCharacters] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [finalScore, setFinalScore] = useState(0);

  const handleStart = useCallback((chars, diff) => {
    setCharacters(chars);
    setDifficulty(diff);
    setScreen('game');
  }, []);

  const handleGameOver = useCallback((score) => {
    setFinalScore(score);
    setScreen('gameover');
  }, []);

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
