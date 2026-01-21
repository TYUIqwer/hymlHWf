// Memory Game – Final Working Version
document.addEventListener('DOMContentLoaded', function () {
  // Game state
  let gameBoard = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let isProcessing = false;
  let currentDifficulty = 'easy';
  let timerInterval = null;
  let seconds = 0;
  let gameStarted = false;

  // Best scores
  let bestScores = JSON.parse(localStorage.getItem('memoryGameBestScores')) || {
    easy: { time: null, moves: null },
    hard: { time: null, moves: null }
  };

  // Card data
  const cardData = ['🧠', '💡', '🎯', '🚀', '🌟', '🏆', '⚡', '🔍', '🎮', '📚'];

  // DOM Elements
  const gameBoardEl = document.getElementById('game-board');
  if (!gameBoardEl) return; // Exit if game section not present

  const movesCountEl = document.getElementById('moves-count');
  const timerDisplayEl = document.getElementById('timer-display');
  const bestEasyTimeEl = document.getElementById('best-easy-time');
  const bestEasyMovesEl = document.getElementById('best-easy-moves');
  const bestHardTimeEl = document.getElementById('best-hard-time');
  const bestHardMovesEl = document.getElementById('best-hard-moves');
  const winMessageEl = document.getElementById('win-message');
  const finalMovesEl = document.getElementById('final-moves');
  const finalTimeEl = document.getElementById('final-time');
  const difficultySelect = document.getElementById('difficulty');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');

  // Initialize UI
  function init() {
    updateBestScoreDisplay();
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);
    difficultySelect.addEventListener('change', handleDifficultyChange);

    // Render initial empty board
    resetGameState();
    createAndRenderBoard();
  }

  function handleDifficultyChange() {
    currentDifficulty = difficultySelect.value;
    if (gameStarted) resetGame();
  }

  function startGame() {
    if (gameStarted) return;
    resetGameState();
    createAndRenderBoard();
    startTimer();
    gameStarted = true;
  }

  function resetGameState() {
    clearInterval(timerInterval);
    seconds = 0;
    moves = 0;
    matchedPairs = 0;
    flippedCards = [];
    isProcessing = false;
    gameStarted = false;
    if (timerDisplayEl) timerDisplayEl.textContent = '00:00';
    if (winMessageEl) winMessageEl.style.display = 'none';
    updateStats();
  }

  function createAndRenderBoard() {
    let cards = [];
    if (currentDifficulty === 'easy') {
      cards = [...cardData.slice(0, 6), ...cardData.slice(0, 6)]; // 6 pairs
    } else {
      cards = [...cardData, ...cardData]; // 10 pairs
    }
    gameBoard = shuffle(cards);
    renderBoard();
  }

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function renderBoard() {
    gameBoardEl.innerHTML = '';
    const cols = currentDifficulty === 'easy' ? 4 : 5;
    gameBoardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    gameBoard.forEach((icon, index) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front">?</div>
          <div class="card-back">${icon}</div>
        </div>
      `;
      card.addEventListener('click', () => handleCardClick(index));
      gameBoardEl.appendChild(card);
    });
  }

  function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    updateTimer();
    timerInterval = setInterval(() => {
      seconds++;
      updateTimer();
    }, 1000);
  }

  function updateTimer() {
    if (timerDisplayEl) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      timerDisplayEl.textContent = `${mins}:${secs}`;
    }
  }

  function handleCardClick(index) {
    if (!gameStarted) return;

    const cardEl = gameBoardEl.children[index];
    if (
      isProcessing ||
      cardEl.classList.contains('matched') ||
      flippedCards.includes(index)
    ) {
      return;
    }

    cardEl.classList.add('flipped');
    flippedCards.push(index);

    if (flippedCards.length === 2) {
      isProcessing = true;
      moves++;
      updateStats();

      const [i1, i2] = flippedCards;
      if (gameBoard[i1] === gameBoard[i2]) {
        // Match
        gameBoardEl.children[i1].classList.add('matched');
        gameBoardEl.children[i2].classList.add('matched');
        matchedPairs++;
        flippedCards = [];
        isProcessing = false;
        updateStats();
        checkWin();
      } else {
        // No match
        setTimeout(() => {
          gameBoardEl.children[i1].classList.remove('flipped');
          gameBoardEl.children[i2].classList.remove('flipped');
          flippedCards = [];
          isProcessing = false;
        }, 1000);
      }
    }
  }

  function checkWin() {
    const totalPairs = currentDifficulty === 'easy' ? 6 : 10;
    if (matchedPairs === totalPairs) {
      clearInterval(timerInterval);
      const currentTime = seconds;
      const currentMoves = moves;

      const best = bestScores[currentDifficulty];
      const isNewRecord = 
        !best.moves || 
        currentMoves < best.moves || 
        (currentMoves === best.moves && currentTime < best.time);

      if (isNewRecord) {
        bestScores[currentDifficulty] = { time: currentTime, moves: currentMoves };
        localStorage.setItem('memoryGameBestScores', JSON.stringify(bestScores));
        updateBestScoreDisplay();
      }

      if (finalMovesEl) finalMovesEl.textContent = currentMoves;
      if (finalTimeEl) finalTimeEl.textContent = formatTime(currentTime);
      if (winMessageEl) winMessageEl.style.display = 'block';
    }
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function updateStats() {
    if (movesCountEl) movesCountEl.textContent = moves;
  }

  function updateBestScoreDisplay() {
    const setBest = (elTime, elMoves, data) => {
      if (data.time !== null) {
        elTime.textContent = formatTime(data.time);
        elMoves.textContent = data.moves;
      } else {
        elTime.textContent = '-';
        elMoves.textContent = '-';
      }
    };
    if (bestEasyTimeEl) setBest(bestEasyTimeEl, bestEasyMovesEl, bestScores.easy);
    if (bestHardTimeEl) setBest(bestHardTimeEl, bestHardMovesEl, bestScores.hard);
  }

  function resetGame() {
    startGame();
  }

  init();
});