import { useState, useEffect } from 'react';

function Square({ value, onSquareClick, isWinning }) {
  return (
    <button className={"square" + (isWinning ? ' winner-square' : '')} onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }) {
  
  function handleClick(i) {
    if (squares[i] || calculateWinner(squares)) {
      return;
    }
    const nextSquares = squares.slice();
    if(xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares);
  }

  const winner = calculateWinner(squares);
  const winningLine = findWinningLine(squares);
  const isBoardFull = squares.every(square => square !== null);
  const isTie = !winner && isBoardFull;
  
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else if (isTie) {
    status = "It's a Tie!";
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  return (
    <>
      <div className={winner ? 'status winner-animation' : 'status'}>{status}</div>
      <div className="board-row">
        <Square value={squares[0]} isWinning={winningLine && winningLine.includes(0)} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} isWinning={winningLine && winningLine.includes(1)} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} isWinning={winningLine && winningLine.includes(2)} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} isWinning={winningLine && winningLine.includes(3)} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} isWinning={winningLine && winningLine.includes(4)} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} isWinning={winningLine && winningLine.includes(5)} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} isWinning={winningLine && winningLine.includes(6)} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} isWinning={winningLine && winningLine.includes(7)} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} isWinning={winningLine && winningLine.includes(8)} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}
export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [mode, setMode] = useState('pvp'); // 'pvp' or 'cpu'
  const [cpuPlayer, setCpuPlayer] = useState('O');
  const [difficulty, setDifficulty] = useState('hard'); // 'easy' | 'medium' | 'hard'
  const [playerXName, setPlayerXName] = useState('');
  const [playerOName, setPlayerOName] = useState('');
  const [scores, setScores] = useState({ X: 0, O: 0, T: 0 });
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares){
    // detect winner/tie for the new board
    const winnerAfter = calculateWinner(nextSquares);
    const isBoardFullAfter = nextSquares.every(sq => sq !== null);
    const isTieAfter = !winnerAfter && isBoardFullAfter;

    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);

    // update persistent scores if a result occurred
    if (winnerAfter) {
      setScores(prev => {
        const updated = { ...prev, [winnerAfter]: (prev[winnerAfter] || 0) + 1 };
        try { localStorage.setItem('ttt-scores', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    } else if (isTieAfter) {
      setScores(prev => {
        const updated = { ...prev, T: (prev.T || 0) + 1 };
        try { localStorage.setItem('ttt-scores', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  function resetGame() {
    setHistory([Array(9).fill(null)]);
    setCurrentMove(0);
  }

  // load scores from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ttt-scores');
      if (raw) {
        setScores(JSON.parse(raw));
      }
      const namesRaw = localStorage.getItem('ttt-player-names');
      if (namesRaw) {
        const names = JSON.parse(namesRaw);
        setPlayerXName(names.X || '');
        setPlayerOName(names.O || '');
      }
    } catch (e) {}
  }, []);

  // CPU move effect (minimax)
  useEffect(() => {
    if (mode !== 'cpu' || animating) return;
    const winnerNow = calculateWinner(currentSquares);
    if (winnerNow) return;
    const cpuTurn = (xIsNext && cpuPlayer === 'X') || (!xIsNext && cpuPlayer === 'O');
    if (!cpuTurn) return;
    const empty = currentSquares.some(sq => sq === null);
    if (!empty) return;
    const thinkDelay = 360;
    const t = setTimeout(() => {
      const move = findBestMove(currentSquares, cpuPlayer, difficulty);
      if (move !== null && currentSquares[move] === null) {
        const nextSquares = currentSquares.slice();
        nextSquares[move] = cpuPlayer;
        handlePlay(nextSquares);
      }
    }, thinkDelay);
    return () => clearTimeout(t);
  }, [currentSquares, mode, animating, xIsNext, cpuPlayer]);

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Go to move #' + move;
    } else {
      description = 'Go to game start';
    }
    return (
      <li key={move}>
        <button className='button' onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  const winner = calculateWinner(currentSquares);
  const isBoardFull = currentSquares.every(square => square !== null);
  const isTie = !winner && isBoardFull;

  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else if (isTie) {
    status = "It's a Tie!";
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  // start celebration when winner appears
  useEffect(() => {
    if (winner && !animating) {
      setAnimating(true);
      const DURATION = 1600; // ms
      const timer = setTimeout(() => {
        setAnimating(false);
      }, DURATION);
      return () => clearTimeout(timer);
    }
  }, [winner]);

  return(
    <div className={"game" + (animating ? ' celebrating' : '')}>
      <div className="game-board" aria-hidden={animating}>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay}/>
      </div>
      <div className="game-info" aria-hidden={animating}>
        <div style={{display:'flex', gap:8, marginBottom:12, alignItems:'center'}}>
          <button className={'button' + (mode === 'pvp' ? ' active' : '')} onClick={() => setMode('pvp')}>2 Players</button>
          <button className={'button' + (mode === 'cpu' ? ' active' : '')} onClick={() => setMode('cpu')}>Play vs CPU (O)</button>
        </div>
        <div style={{display:'flex', gap:8, marginBottom:12, alignItems:'center'}}>
          <input className="name-input" placeholder="Player X name" value={playerXName} onChange={e => { setPlayerXName(e.target.value); try{localStorage.setItem('ttt-player-names', JSON.stringify({ X: e.target.value, O: playerOName })); }catch(e){} }} />
          <input className="name-input" placeholder="Player O name" value={playerOName} onChange={e => { setPlayerOName(e.target.value); try{localStorage.setItem('ttt-player-names', JSON.stringify({ X: playerXName, O: e.target.value })); }catch(e){} }} />
          <label style={{fontSize:14}}>Difficulty:</label>
          <select className="difficulty-select" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="scoreboard">
          <div className="score-item"><strong>{playerXName || 'X'}:</strong> {scores.X}</div>
          <div className="score-item"><strong>{playerOName || 'O'}:</strong> {scores.O}</div>
          <div className="score-item"><strong>T:</strong> {scores.T}</div>
          <div style={{height:8}} />
          <button className="button" onClick={() => { setScores({ X:0, O:0, T:0 }); try { localStorage.removeItem('ttt-scores'); } catch(e){} }}>Reset Scores</button>
        </div>
        <ol>{moves}</ol>
      </div>

      {animating && (
        <div className={"overlay show"}>
          <div className="overlay-text">{status}</div>
        </div>
      )}
    </div>
  )
}
  function calculateWinner(squares) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
  return null;
  }
 

function findWinningLine(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return lines[i];
    }
  }
  return null;
}

function findBestMove(squares, player, difficulty = 'hard') {
  const opponent = player === 'X' ? 'O' : 'X';
  const empties = squares.map((s,i) => s === null ? i : -1).filter(i => i >= 0);
  if (difficulty === 'easy') {
    // random move
    if (empties.length === 0) return null;
    return empties[Math.floor(Math.random() * empties.length)];
  }
  if (difficulty === 'medium') {
    // somewhat random: 40% random, else best
    if (Math.random() < 0.4 && empties.length > 0) {
      return empties[Math.floor(Math.random() * empties.length)];
    }
    // fallthrough to minimax
  }
  // hard or fallback: minimax search
  let bestScore = -Infinity;
  let bestMove = null;
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      squares[i] = player;
      const score = minimax(squares, 0, false, player, opponent);
      squares[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(board, depth, isMaximizing, player, opponent) {
  const winner = calculateWinner(board);
  if (winner === player) return 10 - depth;
  if (winner === opponent) return depth - 10;
  if (board.every(s => s !== null)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = player;
        const val = minimax(board, depth + 1, false, player, opponent);
        board[i] = null;
        best = Math.max(best, val);
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = opponent;
        const val = minimax(board, depth + 1, true, player, opponent);
        board[i] = null;
        best = Math.min(best, val);
      }
    }
    return best;
  }
}





