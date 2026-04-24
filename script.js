const GRID_ROWS = 15;
const GRID_COLS = 15;

let grid = [];
let startNode = { row: 1, col: 1 };
let endNode = { row: 13, col: 13 };

let isDrawing = false;
let currentMode = 'wall'; // 'wall', 'start', 'end'
let isSolving = false;

const gridElement = document.getElementById('grid');
const stepCountEl = document.getElementById('step-count');
const pathOutputEl = document.getElementById('path-output');
const speedSlider = document.getElementById('speed-slider');

// Directions for movement: D, L, R, U (Lexicographical order is D, L, R, U for Rat in Maze standard)
// Actually standard is D, L, R, U for "lexicographically smallest path" strings.
// D = +1 row, L = -1 col, R = +1 col, U = -1 row
const directions = [
    { name: 'D', dRow: 1, dCol: 0 },
    { name: 'L', dRow: 0, dCol: -1 },
    { name: 'R', dRow: 0, dCol: 1 },
    { name: 'U', dRow: -1, dCol: 0 }
];

function initGrid() {
    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${GRID_ROWS}, 1fr)`;
    grid = [];

    for (let r = 0; r < GRID_ROWS; r++) {
        let row = [];
        for (let c = 0; c < GRID_COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            if (r === startNode.row && c === startNode.col) cell.classList.add('start');
            if (r === endNode.row && c === endNode.col) cell.classList.add('end');

            // Event Listeners for drawing
            cell.addEventListener('mousedown', (e) => handleCellMouseDown(e, r, c));
            cell.addEventListener('mouseenter', (e) => handleCellMouseEnter(e, r, c));
            cell.addEventListener('mouseup', () => isDrawing = false);

            gridElement.appendChild(cell);
            row.push({
                row: r,
                col: c,
                isWall: false,
                isVisited: false,
                isPath: false,
                element: cell
            });
        }
        grid.push(row);
    }
    
    // Global mouse up to stop drawing if dragged outside grid
    document.addEventListener('mouseup', () => isDrawing = false);
}

function handleCellMouseDown(e, r, c) {
    if (isSolving) return;
    e.preventDefault(); // Prevent drag ghost image
    isDrawing = true;
    updateCell(r, c);
}

function handleCellMouseEnter(e, r, c) {
    if (isSolving || !isDrawing) return;
    updateCell(r, c);
}

function updateCell(r, c) {
    const cell = grid[r][c];
    if (r === startNode.row && c === startNode.col && currentMode !== 'start') return;
    if (r === endNode.row && c === endNode.col && currentMode !== 'end') return;

    if (currentMode === 'wall') {
        cell.isWall = !cell.isWall;
        if (cell.isWall) {
            cell.element.classList.add('wall');
        } else {
            cell.element.classList.remove('wall');
        }
    } else if (currentMode === 'start') {
        grid[startNode.row][startNode.col].element.classList.remove('start');
        startNode = { row: r, col: c };
        cell.isWall = false;
        cell.element.classList.remove('wall');
        cell.element.classList.add('start');
    } else if (currentMode === 'end') {
        grid[endNode.row][endNode.col].element.classList.remove('end');
        endNode = { row: r, col: c };
        cell.isWall = false;
        cell.element.classList.remove('wall');
        cell.element.classList.add('end');
    }
}

function clearPath() {
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const cell = grid[r][c];
            cell.isVisited = false;
            cell.isPath = false;
            cell.element.classList.remove('visited', 'path');
        }
    }
    stepCountEl.innerText = '0';
    pathOutputEl.innerText = '-';
}

function clearBoard() {
    startNode = { row: 1, col: 1 };
    endNode = { row: GRID_ROWS - 2, col: GRID_COLS - 2 };
    initGrid();
    stepCountEl.innerText = '0';
    pathOutputEl.innerText = '-';
}

function generateRandomMaze() {
    clearBoard();
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if ((r === startNode.row && c === startNode.col) || 
                (r === endNode.row && c === endNode.col)) continue;
            
            if (Math.random() < 0.3) {
                grid[r][c].isWall = true;
                grid[r][c].element.classList.add('wall');
            }
        }
    }
}

// UI Event Listeners
document.getElementById('btn-draw-wall').addEventListener('click', (e) => setMode('wall', e.target));
document.getElementById('btn-set-start').addEventListener('click', (e) => setMode('start', e.target));
document.getElementById('btn-set-end').addEventListener('click', (e) => setMode('end', e.target));

function setMode(mode, buttonElement) {
    currentMode = mode;
    document.querySelectorAll('.mode-buttons button').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
}

document.getElementById('btn-clear-path').addEventListener('click', clearPath);
document.getElementById('btn-clear-board').addEventListener('click', clearBoard);
document.getElementById('btn-random').addEventListener('click', generateRandomMaze);

document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.body.dataset.theme === 'dark';
    document.body.dataset.theme = isDark ? '' : 'dark';
});

// Animations and Solver
document.getElementById('btn-solve').addEventListener('click', () => {
    if (isSolving) return;
    clearPath();
    isSolving = true;
    
    const algorithm = document.getElementById('algorithm-select').value;
    const animations = [];
    let path = [];

    if (algorithm === 'backtracking') {
        path = solveBacktracking(animations);
    } else if (algorithm === 'bfs') {
        path = solveBFS(animations);
    } else if (algorithm === 'dfs') {
        path = solveDFS(animations);
    }

    animateAlgorithm(animations, path);
});

// Delay helper based on slider
function getDelay() {
    const speed = 101 - parseInt(speedSlider.value); // 1 to 100 -> 100 to 1 ms
    return speed * 2;
}

function solveBacktracking(animations) {
    const visited = Array(GRID_ROWS).fill(false).map(() => Array(GRID_COLS).fill(false));
    const pathString = [];
    let finalPath = null;

    function dfs(r, c) {
        if (r < 0 || c < 0 || r >= GRID_ROWS || c >= GRID_COLS || grid[r][c].isWall || visited[r][c]) {
            return false;
        }

        visited[r][c] = true;
        animations.push({ type: 'visit', r, c });

        if (r === endNode.row && c === endNode.col) {
            finalPath = [...pathString];
            return true;
        }

        for (let dir of directions) {
            pathString.push(dir.name);
            if (dfs(r + dir.dRow, c + dir.dCol)) {
                return true;
            }
            pathString.pop();
        }

        // Backtrack
        animations.push({ type: 'backtrack', r, c });
        return false;
    }

    dfs(startNode.row, startNode.col);
    
    // Reconstruct path array from directions for visualization if found
    let pathNodes = [];
    if (finalPath) {
        let currR = startNode.row;
        let currC = startNode.col;
        pathNodes.push({r: currR, c: currC});
        for (let dirName of finalPath) {
            const dir = directions.find(d => d.name === dirName);
            currR += dir.dRow;
            currC += dir.dCol;
            pathNodes.push({r: currR, c: currC});
        }
    }

    return pathNodes;
}

function solveBFS(animations) {
    const visited = Array(GRID_ROWS).fill(false).map(() => Array(GRID_COLS).fill(false));
    const queue = [{ r: startNode.row, c: startNode.col, path: [] }];
    visited[startNode.row][startNode.col] = true;

    while (queue.length > 0) {
        const { r, c, path } = queue.shift();
        animations.push({ type: 'visit', r, c });

        if (r === endNode.row && c === endNode.col) {
            return [...path, { r, c }];
        }

        for (let dir of directions) {
            const newR = r + dir.dRow;
            const newC = c + dir.dCol;

            if (newR >= 0 && newC >= 0 && newR < GRID_ROWS && newC < GRID_COLS && 
                !grid[newR][newC].isWall && !visited[newR][newC]) {
                visited[newR][newC] = true;
                queue.push({ r: newR, c: newC, path: [...path, { r, c }] });
            }
        }
    }
    return [];
}

function solveDFS(animations) {
    const visited = Array(GRID_ROWS).fill(false).map(() => Array(GRID_COLS).fill(false));
    const stack = [{ r: startNode.row, c: startNode.col, path: [] }];

    while (stack.length > 0) {
        const { r, c, path } = stack.pop();

        if (r < 0 || c < 0 || r >= GRID_ROWS || c >= GRID_COLS || grid[r][c].isWall || visited[r][c]) {
            continue;
        }

        visited[r][c] = true;
        animations.push({ type: 'visit', r, c });

        if (r === endNode.row && c === endNode.col) {
            return [...path, { r, c }];
        }

        // Push in reverse order so D, L, R, U is popped in correct order
        for (let i = directions.length - 1; i >= 0; i--) {
            const dir = directions[i];
            stack.push({ r: r + dir.dRow, c: c + dir.dCol, path: [...path, { r, c }] });
        }
    }
    return [];
}

function animateAlgorithm(animations, path) {
    let i = 0;

    function nextStep() {
        if (i < animations.length) {
            const { type, r, c } = animations[i];
            const cellEl = grid[r][c].element;
            
            if (type === 'visit') {
                if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
                    cellEl.classList.add('visited');
                    cellEl.classList.remove('path');
                }
            } else if (type === 'backtrack') {
                if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
                    cellEl.classList.remove('visited');
                }
            }
            
            i++;
            setTimeout(nextStep, getDelay());
        } else {
            animatePath(path);
        }
    }
    nextStep();
}

function animatePath(path) {
    if (path.length === 0) {
        isSolving = false;
        alert("No path found!");
        return;
    }

    let i = 0;
    let pathString = "";

    function nextPathStep() {
        if (i < path.length) {
            const { r, c } = path[i];
            const cellEl = grid[r][c].element;
            
            if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
                cellEl.classList.remove('visited');
                cellEl.classList.add('path');
            }

            // Construct path string
            if (i > 0) {
                const prev = path[i-1];
                if (r > prev.r) pathString += "D";
                else if (r < prev.r) pathString += "U";
                else if (c > prev.c) pathString += "R";
                else if (c < prev.c) pathString += "L";
            }

            stepCountEl.innerText = i;
            pathOutputEl.innerText = pathString;

            i++;
            setTimeout(nextPathStep, 50); // Path animates faster
        } else {
            isSolving = false;
        }
    }
    nextPathStep();
}

// Initialize on load
initGrid();
