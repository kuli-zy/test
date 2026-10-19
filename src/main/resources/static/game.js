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

let state = null;
let timer = null;

async function api(path, options = {}) {
    const response = await fetch(`/api/game${path}`, {
        headers: {'Content-Type': 'application/json'},
        ...options
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function updateHud() {
    if (!state) return;
    scoreEl.textContent = state.score;
    bestScoreEl.textContent = state.bestScore;
    levelEl.textContent = state.level;

    const mode = state.gameOver ? 'over' : state.running ? 'running' : state.score > 0 ? 'paused' : 'ready';
    statusEl.dataset.state = mode;
    statusEl.textContent = {
        over: '游戏结束',
        running: '游戏中',
        paused: '已暂停',
        ready: '准备开始'
    }[mode];

    startButton.disabled = state.running;
    pauseButton.disabled = !state.running;
}

function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
}

function draw() {
    if (!state) return;
    const grid = state.gridSize;
    const cell = canvas.width / grid;

    ctx.fillStyle = '#081321';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(120, 175, 187, 0.065)';
    ctx.lineWidth = 1;
    for (let i = 1; i < grid; i++) {
        const p = i * cell + .5;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
        ctx.stroke();
    }

    if (state.food) {
        const fx = state.food.x * cell + cell / 2;
        const fy = state.food.y * cell + cell / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(255, 117, 149, .72)';
        ctx.shadowBlur = cell * .9;
        ctx.fillStyle = '#ff7595';
        ctx.beginPath();
        ctx.arc(fx, fy, cell * .32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255, 235, 243, .9)';
        ctx.beginPath();
        ctx.arc(fx - cell * .09, fy - cell * .1, cell * .08, 0, Math.PI * 2);
        ctx.fill();
    }

    state.snake.forEach((segment, index) => {
        const inset = index === 0 ? 1.2 : 1.6;
        const x = segment.x * cell + inset;
        const y = segment.y * cell + inset;
        const size = cell - inset * 2;
        ctx.fillStyle = index === 0 ? '#78fbd0' : (index % 2 ? '#36cfa1' : '#46dfaf');
        if (index === 0) {
            ctx.save();
            ctx.shadowColor = 'rgba(69, 225, 176, .55)';
            ctx.shadowBlur = 12;
        }
        roundRect(x, y, size, size, cell * .27);
        ctx.fill();
        if (index === 0) {
            ctx.restore();
            ctx.fillStyle = '#0a3934';
            const facing = state.direction;
            const offsets = {
                up: [[.32, .3], [.68, .3]],
                down: [[.32, .7], [.68, .7]],
                left: [[.3, .32], [.3, .68]],
                right: [[.7, .32], [.7, .68]]
            };
            for (const [ex, ey] of (offsets[facing] || offsets.right)) {
                ctx.beginPath();
                ctx.arc(segment.x * cell + cell * ex, segment.y * cell + cell * ey, cell * .065, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

function render() {
    updateHud();
    draw();

    if (state.gameOver) {
        overlay.classList.remove('hidden');
        overlayTitle.textContent = '游戏结束';
        overlayText.textContent = `本局得分 ${state.score}，点击重新开始。`;
        overlayButton.textContent = '再来一局';
    } else if (!state.running) {
        overlay.classList.remove('hidden');
        overlayTitle.textContent = state.score === 0 ? '准备好了吗？' : '游戏暂停';
        overlayText.textContent = state.score === 0 ? '方向键 / WASD 控制，空格暂停。' : '点击继续或按空格恢复。';
        overlayButton.textContent = state.score === 0 ? '开始游戏' : '继续游戏';
    } else {
        overlay.classList.add('hidden');
    }
}

function scheduleTick() {
    clearTimeout(timer);
    if (!state || !state.running || state.gameOver) return;
    timer = setTimeout(async () => {
        try {
            state = await api('/tick', {method: 'POST'});
            render();
            scheduleTick();
        } catch (error) {
            serverStatus.textContent = 'Spring Boot 服务连接失败';
        }
    }, state.speedMs);
}

async function startGame() {
    try {
        state = await api('/start', {method: 'POST'});
        render();
        scheduleTick();
    } catch (error) {
        serverStatus.textContent = 'Spring Boot 服务连接失败';
    }
}

async function pauseGame() {
    if (!state || !state.running) return;
    clearTimeout(timer);
    state = await api('/pause', {method: 'POST'});
    render();
}

async function restartGame() {
    clearTimeout(timer);
    state = await api('/restart', {method: 'POST'});
    render();
    scheduleTick();
}

async function move(direction) {
    if (!state) return;
    state = await api('/move', {
        method: 'POST',
        body: JSON.stringify({direction})
    });
    render();
    if (!state.running && !state.gameOver) {
        await startGame();
    }
}

function handleKey(event) {
    const key = event.key.toLowerCase();
    const controls = {
        arrowup: 'up', w: 'up',
        arrowdown: 'down', s: 'down',
        arrowleft: 'left', a: 'left',
        arrowright: 'right', d: 'right'
    };

    if (controls[key]) {
        event.preventDefault();
        move(controls[key]);
    } else if (event.code === 'Space') {
        event.preventDefault();
        state?.running ? pauseGame() : startGame();
    }
}

document.addEventListener('keydown', handleKey);
overlayButton.addEventListener('click', () => state?.gameOver ? restartGame() : startGame());
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
restartButton.addEventListener('click', restartGame);

document.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('click', () => move(button.dataset.direction));
});

(async function init() {
    try {
        const info = await api('/info');
        state = await api('/state');
        serverStatus.textContent = `${info.name} 服务已连接`;
        statusEl.textContent = '准备开始';
        render();
    } catch (error) {
        serverStatus.textContent = 'Spring Boot 服务连接失败';
        statusEl.textContent = '服务不可用';
        statusEl.dataset.state = 'offline';
        startButton.disabled = true;
        pauseButton.disabled = true;
        restartButton.disabled = true;
    }
})();
