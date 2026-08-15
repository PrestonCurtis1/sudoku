/**
 * Sudoku Game Engine
 * Features: Fetching puzzles via API, localStorage persistence,
 * Note/Edit mode, keyboard/numpad input, and light/dark theme toggle.
 */

class SudokuGame {
  constructor() {
    this.boardElement = document.getElementById('sudoku-board');
    this.selectedCell = null;
    this.isNoteMode = false;
    this.boardState = []; // 9x9 grid data
    this.solution = [];   // 9x9 solution data
    this.gameFinished = false;

    // Statistics state
    this.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      score: 0
    };

    this.init();
  }

  init() {
    this.loadStats();
    this.setupEventListeners();
    this.setupTheme();
    this.startNewGame();
  }

  /* ==========================================================================
     1. LocalStorage & Theme Management
     ========================================================================== */
  loadStats() {
    const savedStats = localStorage.getItem('sudoku_stats');
    if (savedStats) {
      this.stats = JSON.parse(savedStats);
      this.updateStatsUI();
    }
  }

  saveStats() {
    localStorage.setItem('sudoku_stats', JSON.stringify(this.stats));
    this.updateStatsUI();
  }

  updateStatsUI() {
    document.getElementById('games-played').textContent = this.stats.gamesPlayed;
    document.getElementById('games-won').textContent = this.stats.gamesWon;
    document.getElementById('score').textContent = this.stats.score;
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('sudoku_theme') || 'light-mode';
    document.body.className = savedTheme;

    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      const newTheme = document.body.classList.contains('light-mode') ? 'dark-mode' : 'light-mode';
      document.body.className = newTheme;
      localStorage.setItem('sudoku_theme', newTheme);
    });
  }

  /* ==========================================================================
     2. Game Setup & API Integration
     ========================================================================== */
  async startNewGame() {
    const difficulty = document.getElementById('difficulty').value;
    this.gameFinished = false;

    try {
      // Fetch board from Dosaku / Sugoku API fallback
      const response = await fetch(`https://sugoku.onrender.com/board?difficulty=${difficulty}`);
      const data = await response.json();
      this.boardState = data.board;
      
      // Fetch solution
      const solResponse = await fetch('https://sugoku.onrender.com/solve', {
        method: 'POST',
        body: new URLSearchParams({ board: JSON.stringify(this.boardState) }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const solData = await solResponse.json();
      this.solution = solData.solution;

    } catch (error) {
      console.warn('API fetch failed, generating fallback board local instance.');
      this.useFallbackBoard();
    }

    this.renderBoard();
  }

  useFallbackBoard() {
    // Fallback sample puzzle (0 represents empty cells)
    this.boardState = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];
    this.solution = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ];
  }

  /* ==========================================================================
     3. DOM Manipulation & Rendering
     ========================================================================== */
  renderBoard() {
    this.boardElement.innerHTML = '';
    this.selectedCell = null;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = row;
        cell.dataset.col = col;

        const val = this.boardState[row][col];
        if (val !== 0) {
          cell.textContent = val;
          cell.classList.add('given'); // Uneditable starting value
        } else {
          // Container for notes
          const notesGrid = document.createElement('div');
          notesGrid.classList.add('notes-grid');
          for (let i = 1; i <= 9; i++) {
            const noteSpan = document.createElement('span');
            noteSpan.classList.add(`note-${i}`);
            notesGrid.appendChild(noteSpan);
          }
          cell.appendChild(notesGrid);
        }

        cell.addEventListener('click', () => this.selectCell(cell));
        this.boardElement.appendChild(cell);
      }
    }
  }

  selectCell(cell) {
    if (this.selectedCell) {
      this.selectedCell.classList.remove('selected');
    }
    this.selectedCell = cell;
    cell.classList.add('selected');
  }

  /* ==========================================================================
     4. User Input & Note Handling
     ========================================================================== */
  setupEventListeners() {
    // New game & Difficulty
    document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());

    // Note mode toggle
    const noteBtn = document.getElementById('note-mode-btn');
    noteBtn.addEventListener('click', () => {
      this.isNoteMode = !this.isNoteMode;
      noteBtn.classList.toggle('active', this.isNoteMode);
      noteBtn.textContent = `Notes Mode: ${this.isNoteMode ? 'ON' : 'OFF'}`;
    });

    // On-screen Numpad listener
    document.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleInput(parseInt(btn.dataset.value, 10));
      });
    });

    // Erase button
    document.getElementById('erase-btn').addEventListener('click', () => this.handleErase());

    // Physical Keyboard Listener
    document.addEventListener('keydown', (e) => {
      if (!this.selectedCell) return;

      if (e.key >= '1' && e.key <= '9') {
        this.handleInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        this.handleErase();
      } else if (e.key.startsWith('Arrow')) {
        this.handleNavigation(e.key);
      }
    });
  }

  handleInput(num) {
    if (!this.selectedCell || this.selectedCell.classList.contains('given') || this.gameFinished) return;

    const row = this.selectedCell.dataset.row;
    const col = this.selectedCell.dataset.col;

    if (this.isNoteMode) {
      // Toggle notes inside empty cell
      const noteSpan = this.selectedCell.querySelector(`.note-${num}`);
      if (noteSpan) {
        noteSpan.textContent = noteSpan.textContent === `${num}` ? '' : `${num}`;
      }
    } else {
      // Enter permanent number
      this.selectedCell.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) node.remove();
      });
      
      this.selectedCell.insertAdjacentText('afterbegin', num);
      this.boardState[row][col] = num;

      // Check correctness
      if (this.solution.length > 0) {
        if (num === this.solution[row][col]) {
          this.selectedCell.classList.remove('incorrect');
          this.selectedCell.classList.add('correct');
          this.stats.score += 10;
          this.saveStats();
          this.checkWinCondition();
        } else {
          this.selectedCell.classList.remove('correct');
          this.selectedCell.classList.add('incorrect');
          this.stats.score = Math.max(0, this.stats.score - 5);
          this.saveStats();
        }
      }

      if (!this.gameFinished) {
        this.checkWinCondition();
      }
    }
  }

  handleErase() {
    if (!this.selectedCell || this.selectedCell.classList.contains('given')) return;

    const row = this.selectedCell.dataset.row;
    const col = this.selectedCell.dataset.col;

    this.boardState[row][col] = 0;
    this.selectedCell.classList.remove('incorrect', 'correct');

    // Clear main value text
    this.selectedCell.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) node.remove();
    });

    // Clear notes
    const notes = this.selectedCell.querySelectorAll('.notes-grid span');
    notes.forEach(note => note.textContent = '');
  }

  handleNavigation(key) {
    let row = parseInt(this.selectedCell.dataset.row, 10);
    let col = parseInt(this.selectedCell.dataset.col, 10);

    if (key === 'ArrowUp') row = Math.max(0, row - 1);
    if (key === 'ArrowDown') row = Math.min(8, row + 1);
    if (key === 'ArrowLeft') col = Math.max(0, col - 1);
    if (key === 'ArrowRight') col = Math.min(8, col + 1);

    const nextCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (nextCell) this.selectCell(nextCell);
  }

  /* ==========================================================================
     5. Game Logic Verification
     ========================================================================== */
  isBoardFull() {
    return this.boardState.every(row => row.every(cell => cell !== 0));
  }

  finishGame(won) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.stats.gamesPlayed += 1;

    if (won) {
      this.stats.gamesWon += 1;
      this.stats.score += 100; // Bonus for completion
      this.saveStats();
      setTimeout(() => alert('Congratulations! You solved the puzzle!'), 200);
      return;
    }

    this.saveStats();
    setTimeout(() => alert('Game over! The board is full but the puzzle is not solved.'), 200);
  }

  checkWinCondition() {
    if (this.gameFinished) return;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.boardState[r][c] !== this.solution[r][c]) {
          if (this.isBoardFull()) {
            this.finishGame(false);
          }
          return; // Puzzle not solved yet
        }
      }
    }

    this.finishGame(true);
  }
}

// Initialize application on DOM readiness
document.addEventListener('DOMContentLoaded', () => {
  new SudokuGame();
});