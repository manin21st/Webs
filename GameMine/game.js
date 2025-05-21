class Minesweeper {
    constructor(width = 10, height = 10, mines = 10) {
        this.width = width;
        this.height = height;
        this.mines = mines;
        this.board = [];
        this.gameOver = false;
        this.mineCount = mines;
        this.timer = 0;
        this.timerInterval = null;
        this.firstClick = true;
        this.init();
    }

    init() {
        // 보드 초기화
        this.board = Array(this.height).fill().map(() =>
            Array(this.width).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            }))
        );

        this.gameOver = false;
        this.firstClick = true;
        this.updateNewGameButton('smile');
        document.getElementById('win-overlay').style.display = 'none';
        document.getElementById('lose-overlay').style.display = 'none';

        // 게임 보드 크기 설정
        const gameBoard = document.getElementById('game-board');
        gameBoard.style.gridTemplateColumns = `repeat(${this.width}, 30px)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.height}, 30px)`;

        this.renderBoard();
        this.setupEventListeners();
        this.updateMineCount();
        this.startTimer();
    }

    placeMines(firstX, firstY) {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            // 첫 클릭 위치와 그 주변에는 지뢰를 배치하지 않음
            if (!this.board[y][x].isMine && !(Math.abs(x - firstX) <= 1 && Math.abs(y - firstY) <= 1)) {
                this.board[y][x].isMine = true;
                minesPlaced++;
            }
        }

        // 주변 지뢰 수 계산
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.board[y][x].isMine) {
                    this.board[y][x].neighborMines = this.countNeighborMines(x, y);
                }
            }
        }
    }

    updateNewGameButton(state) {
        const button = document.getElementById('new-game');
        const icon = button.querySelector('i');
        icon.className = 'fas';
        
        switch (state) {
            case 'smile':
                icon.classList.add('fa-smile');
                break;
            case 'win':
                icon.classList.add('fa-laugh-beam');
                break;
            case 'dead':
                icon.classList.add('fa-dizzy');
                break;
            case 'surprise':
                icon.classList.add('fa-surprise');
                break;
        }
    }

    countNeighborMines(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newY = y + dy;
                const newX = x + dx;
                if (newY >= 0 && newY < this.height && newX >= 0 && newX < this.width) {
                    if (this.board[newY][newX].isMine) count++;
                }
            }
        }
        return count;
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                gameBoard.appendChild(cell);
                
                if (this.board[y][x].isRevealed) {
                    cell.classList.add('revealed');
                    if (this.board[y][x].isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (this.board[y][x].neighborMines > 0) {
                        cell.textContent = this.board[y][x].neighborMines;
                        cell.style.color = this.getNumberColor(this.board[y][x].neighborMines);
                    }
                } else if (this.board[y][x].isFlagged) {
                    cell.textContent = '🚩';
                }
            }
        }
    }

    getNumberColor(number) {
        const colors = [
            null,
            '#0000FF', // 1: 파랑
            '#008000', // 2: 초록
            '#FF0000', // 3: 빨강
            '#000080', // 4: 진한 파랑
            '#800000', // 5: 진한 빨강
            '#008080', // 6: 청록
            '#000000', // 7: 검정
            '#808080'  // 8: 회색
        ];
        return colors[number];
    }

    reveal(x, y) {
        if (this.gameOver || this.board[y][x].isFlagged || this.board[y][x].isRevealed) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(x, y);
        }

        this.board[y][x].isRevealed = true;

        if (this.board[y][x].isMine) {
            this.gameOver = true;
            this.revealAll();
            this.updateNewGameButton('dead');
            document.getElementById('lose-overlay').style.display = 'block';
            setTimeout(() => {
                document.getElementById('lose-overlay').style.display = 'none';
                alert('게임 오버!');
            }, 2000);
            this.stopTimer();
            return;
        }

        if (this.board[y][x].neighborMines === 0) {
            this.revealNeighbors(x, y);
        }

        this.renderBoard();
        this.checkWin();
    }

    revealNeighbors(x, y) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newY = y + dy;
                const newX = x + dx;
                if (newY >= 0 && newY < this.height && newX >= 0 && newX < this.width) {
                    if (!this.board[newY][newX].isRevealed && !this.board[newY][newX].isFlagged) {
                        this.reveal(newX, newY);
                    }
                }
            }
        }
    }

    toggleFlag(x, y) {
        if (this.gameOver || this.board[y][x].isRevealed) return;

        this.board[y][x].isFlagged = !this.board[y][x].isFlagged;
        this.mineCount += this.board[y][x].isFlagged ? -1 : 1;
        this.updateMineCount();
        this.renderBoard();
    }

    revealAll() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.board[y][x].isRevealed = true;
            }
        }
        this.renderBoard();
    }

    checkWin() {
        let unrevealedCount = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.board[y][x].isRevealed && !this.board[y][x].isMine) {
                    unrevealedCount++;
                }
            }
        }
        
        if (unrevealedCount === 0) {
            this.gameOver = true;
            this.updateNewGameButton('win');
            document.getElementById('win-overlay').style.display = 'block';
            setTimeout(() => {
                document.getElementById('win-overlay').style.display = 'none';
                alert('축하합니다! 승리하셨습니다!');
            }, 2000);
            this.stopTimer();
        }
    }

    updateMineCount() {
        document.getElementById('mine-count').textContent = this.mineCount;
    }

    startTimer() {
        this.stopTimer();
        this.timer = 0;
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.timer;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    setupEventListeners() {
        const gameBoard = document.getElementById('game-board');
        
        gameBoard.addEventListener('mousedown', () => {
            if (!this.gameOver) {
                this.updateNewGameButton('surprise');
            }
        });

        gameBoard.addEventListener('mouseup', () => {
            if (!this.gameOver) {
                this.updateNewGameButton('smile');
            }
        });

        gameBoard.addEventListener('mouseleave', () => {
            if (!this.gameOver) {
                this.updateNewGameButton('smile');
            }
        });

        gameBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const x = parseInt(e.target.dataset.x);
                const y = parseInt(e.target.dataset.y);
                this.reveal(x, y);
            }
        });

        gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell')) {
                const x = parseInt(e.target.dataset.x);
                const y = parseInt(e.target.dataset.y);
                this.toggleFlag(x, y);
            }
        });

        document.getElementById('new-game').addEventListener('click', () => {
            this.gameOver = false;
            this.mineCount = this.mines;
            this.init();
        });
    }
}

// 난이도 설정
const difficulties = {
    beginner: { width: 10, height: 10, mines: 10 },
    intermediate: { width: 16, height: 16, mines: 40 },
    expert: { width: 30, height: 16, mines: 99 }
};

let currentGame;

// 난이도 버튼 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 활성화된 버튼 스타일 변경
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 선택된 난이도로 새 게임 시작
            const difficulty = difficulties[button.dataset.difficulty];
            currentGame = new Minesweeper(difficulty.width, difficulty.height, difficulty.mines);
        });
    });

    // 초기 게임 시작 (초급)
    currentGame = new Minesweeper(10, 10, 10);
}); 