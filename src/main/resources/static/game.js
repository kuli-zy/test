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
let frame = 0;

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
    const text = state.gameOver ? '游戏结束' : state.running ? '游戏中' : '已暂停';
    const label = statusEl.querySelector('span');
    if (label) label.textContent = text;
    else statusEl.textContent = text;
}

function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
}

function draw() {
    if (!state) return;
    frame += 1;
    const grid = state.gridSize;
    const cell = canvas.width / grid;

    const bg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 40, canvas.width / 2, canvas.height / 2, canvas.width * .72);
    bg.addColorStop(0, '#071426');
    bg.addColorStop(.55, '#030916');
    bg.addColorStop(1, '#01030a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.075)';
    ctx.lineWidth = 1;
    for (let i = 1; i < grid; i++) {
        const p = Math.round(i * cell) + .5;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
        ctx.stroke();
    }
    ctx.restore();

    const fx = state.food.x * cell + cell / 2;
    const fy = state.food.y * cell + cell / 2;
    const pulse = 1 + Math.sin(frame * .18) * .08;
    ctx.save();
    ctx.shadowColor = '#ff3d71';
    ctx.shadowBlur = 24;
    const foodGlow = ctx.createRadialGradient(fx, fy, 2, fx, fy, cell * .6);
    foodGlow.addColorStop(0, '#fff1f5');
    foodGlow.addColorStop(.18, '#ff668f');
    foodGlow.addColorStop(.48, '#ff315f');
    foodGlow.addColorStop(1, 'rgba(255,49,95,0)');
    ctx.fillStyle = foodGlow;
    ctx.beginPath();
    ctx.arc(fx, fy, cell * .62 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff4d72';
    ctx.beginPath();
    ctx.arc(fx, fy, cell * .28 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    state.snake.forEach((segment, index) => {
        const x = segment.x * cell + 2.5;
        const y = segment.y * cell + 2.5;
        const size = cell - 5;
        const head = index === 0;
        ctx.save();
        ctx.shadowColor = head ? '#7dffb2' : '#21f58a';
        ctx.shadowBlur = head ? 22 : 12;
        const grad = ctx.createLinearGradient(x, y, x + size, y + size);
        if (head) {
            grad.addColorStop(0, '#b8ffd0');
            grad.addColorStop(.45, '#52ff9a');
            grad.addColorStop(1, '#13c96d');
        } else {
            grad.addColorStop(0, '#39ff88');
            grad.addColorStop(1, '#0bbd68');
        }
        ctx.fillStyle = grad;
        roundedRect(x, y, size, size, head ? 7 : 5);
        ctx.fill();

        ctx.strokeStyle = head ? 'rgba(220,255,234,.78)' : 'rgba(180,255,212,.25)';
        ctx.lineWidth = 1;
        roundedRect(x + .5, y + .5, size - 1, size - 1, head ? 7 : 5);
        ctx.stroke();

        if (head) {
            const d = state.direction;
            const eyes = d === 'left' || d === 'right'
                ? [{x: d === 'right' ? .67 : .33, y: .32}, {x: d === 'right' ? .67 : .33, y: .68}]
                : [{x: .32, y: d === 'down' ? .67 : .33}, {x: .68, y: d === 'down' ? .67 : .33}];
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#03120a';
            eyes.forEach(eye => {
                ctx.beginPath();
                ctx.arc(x + size * eye.x, y + size * eye.y, Math.max(1.4, cell * .065), 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.restore();
    });
}

function render() {
    updateHud();
    draw();

    if (state.gameOver) {
        overlay.classList.remove('hidden');
        overlayTitle.textContent = 'GAME OVER';
        overlayText.textContent = `本局得分 ${state.score}，重新启动系统再来一局。`;
        overlayButton.querySelector('span') ? overlayButton.querySelector('span').textContent = '重新启动' : overlayButton.textContent = '重新启动';
    } else if (!state.running) {
        overlay.classList.remove('hidden');
        overlayTitle.textContent = state.score === 0 ? 'READY PLAYER?' : 'SYSTEM PAUSED';
        overlayText.textContent = state.score === 0 ? '方向键 / WASD 控制，空格暂停。' : '点击继续或按空格恢复。';
        const text = state.score === 0 ? '进入游戏' : '继续游戏';
        overlayButton.querySelector('span') ? overlayButton.querySelector('span').textContent = text : overlayButton.textContent = text;
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
    if (!state.running && !state.gameOver) await startGame();
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
document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => move(button.dataset.direction)));

(async function init() {
    try {
        const info = await api('/info');
        state = await api('/state');
        serverStatus.textContent = `${info.name} · 服务已连接`;
        const label = statusEl.querySelector('span');
        if (label) label.textContent = '准备开始';
        render();
    } catch (error) {
        serverStatus.textContent = 'Spring Boot 服务连接失败';
        const label = statusEl.querySelector('span');
        if (label) label.textContent = '服务不可用';
    }
})();
