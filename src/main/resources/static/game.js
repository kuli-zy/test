const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const levelEl = document.getElementById('level');
const statusEl = document.getElementById('status');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const overlayButton = document.getElementById('overlayButton');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');
const serverStatus = document.getElementById('serverStatus');

const GRID = 24;
const CELL = canvas.width / GRID;
const BASE_SPEED = 150;
const MIN_SPEED = 65;

let snake;
let food;
let direction;
let pendingDirection;
let score;
let level;
let running;
let gameOver;
let timer;
let bestScore = Number(localStorage.getItem('snakeBestScore') || 0);

bestScoreEl.textContent = bestScore;

function resetGame() {
    snake = [
        {x: 12, y: 12},
        {x: 11, y: 12},
        {x: 10, y: 12}
    ];
    direction = {x: 1, y: 0};
    pendingDirection = {...direction};
    score = 0;
    level = 1;
    running = false;
    gameOver = false;
    clearTimeout(timer);
    placeFood();
    updateHud();
    statusEl.textContent = '准备开始';
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '准备好了吗？';
    overlayText.textContent = '方向键 / WASD 控制，空格暂停。';
    overlayButton.textContent = '开始游戏';
    draw();
}

function placeFood() {
    do {
        food = {
            x: Math.floor(Math.random() * GRID),
            y: Math.floor(Math.random() * GRID)
        };
    } while (snake && snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function updateHud() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    bestScoreEl.textContent = bestScore;
}

function speed() {
    return Math.max(MIN_SPEED, BASE_SPEED - (level - 1) * 12);
}

function startGame() {
    if (gameOver) {
        resetGame();
    }
    if (running) return;
    running = true;
    overlay.classList.add('hidden');
    statusEl.textContent = '游戏中';
    tick();
}

function pauseGame() {
    if (!running || gameOver) return;
    running = false;
    clearTimeout(timer);
    statusEl.textContent = '已暂停';
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '游戏暂停';
    overlayText.textContent = '点击继续或按空格恢复。';
    overlayButton.textContent = '继续游戏';
}

function restartGame() {
    resetGame();
    startGame();
}

function tick() {
    if (!running) return;
    direction = pendingDirection;
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    if (
        head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        level = Math.floor(score / 50) + 1;
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('snakeBestScore', String(bestScore));
        }
        placeFood();
        updateHud();
    } else {
        snake.pop();
    }

    draw();
    timer = setTimeout(tick, speed());
}

function endGame() {
    running = false;
    gameOver = true;
    clearTimeout(timer);
    statusEl.textContent = '游戏结束';
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '游戏结束';
    overlayText.textContent = `本局得分 ${score}，点击重新开始。`;
    overlayButton.textContent = '再来一局';
    draw();
}

function setDirection(next) {
    const opposite = next.x === -direction.x && next.y === -direction.y;
    if (!opposite) {
        pendingDirection = next;
    }
}

function draw() {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
        const p = i * CELL;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
        ctx.stroke();
    }

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.34, 0, Math.PI * 2);
    ctx.fill();

    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
        ctx.fillRect(segment.x * CELL + 2, segment.y * CELL + 2, CELL - 4, CELL - 4);
    });
}

function handleKey(event) {
    const key = event.key.toLowerCase();
    const controls = {
        arrowup: {x: 0, y: -1}, w: {x: 0, y: -1},
        arrowdown: {x: 0, y: 1}, s: {x: 0, y: 1},
        arrowleft: {x: -1, y: 0}, a: {x: -1, y: 0},
        arrowright: {x: 1, y: 0}, d: {x: 1, y: 0}
    };

    if (controls[key]) {
        event.preventDefault();
        setDirection(controls[key]);
        if (!running && !gameOver) startGame();
    } else if (event.code === 'Space') {
        event.preventDefault();
        running ? pauseGame() : startGame();
    }
}

document.addEventListener('keydown', handleKey);
overlayButton.addEventListener('click', startGame);
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
restartButton.addEventListener('click', restartGame);

document.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('click', () => {
        const directions = {
            up: {x: 0, y: -1},
            down: {x: 0, y: 1},
            left: {x: -1, y: 0},
            right: {x: 1, y: 0}
        };
        setDirection(directions[button.dataset.direction]);
        if (!running && !gameOver) startGame();
    });
});

fetch('/api/game/info')
    .then(response => {
        if (!response.ok) throw new Error('server error');
        return response.json();
    })
    .then(data => {
        serverStatus.textContent = `${data.name} 服务已连接`;
    })
    .catch(() => {
        serverStatus.textContent = 'Spring Boot 服务连接失败';
    });

resetGame();
