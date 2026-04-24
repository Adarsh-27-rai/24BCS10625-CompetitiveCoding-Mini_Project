const GRID_ROWS = 15;
const GRID_COLS = 15;

let grid = [];
let startNode = { row: 1, col: 1 };
let endNode = { row: 13, col: 13 };

let isDrawing = false;
let currentMode = 'wall'; // 'wall', 'start', 'end'
let isSolving = false;

const gridElement = document.getElementById('grid');

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
            
            if (r === startNode.row && c === startNode.col) {
                cell.classList.add('start');
                cell.innerText = 'S';
            }
            if (r === endNode.row && c === endNode.col) {
                cell.classList.add('end');
                cell.innerText = 'E';
            }

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
    
    document.addEventListener('mouseup', () => isDrawing = false);
}

function handleCellMouseDown(e, r, c) {
    if (isSolving) return;
    e.preventDefault(); 
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
        grid[startNode.row][startNode.col].element.innerText = '';
        startNode = { row: r, col: c };
        cell.isWall = false;
        cell.element.classList.remove('wall');
        cell.element.classList.add('start');
        cell.element.innerText = 'S';
    } else if (currentMode === 'end') {
        grid[endNode.row][endNode.col].element.classList.remove('end');
        grid[endNode.row][endNode.col].element.innerText = '';
        endNode = { row: r, col: c };
        cell.isWall = false;
        cell.element.classList.remove('wall');
        cell.element.classList.add('end');
        cell.element.innerText = 'E';
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
}

function clearBoard() {
    startNode = { row: 1, col: 1 };
    endNode = { row: GRID_ROWS - 2, col: GRID_COLS - 2 };
    initGrid();
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



// Solve
document.getElementById('btn-solve').addEventListener('click', () => {
    if (isSolving) return;
    clearPath();
    isSolving = true;
    
    findShortestPath();
    isSolving = false;
});

function findShortestPath() {
    const visited = Array(GRID_ROWS).fill(false).map(() => Array(GRID_COLS).fill(false));
    const queue = [{ r: startNode.row, c: startNode.col, path: [] }];
    visited[startNode.row][startNode.col] = true;
    let finalPath = null;

    while (queue.length > 0) {
        const { r, c, path } = queue.shift();
        
        const cellEl = grid[r][c].element;
        if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
            cellEl.classList.add('visited');
        }

        if (r === endNode.row && c === endNode.col) {
            finalPath = path;
            break;
        }

        for (let dir of directions) {
            const newR = r + dir.dRow;
            const newC = c + dir.dCol;

            if (newR >= 0 && newC >= 0 && newR < GRID_ROWS && newC < GRID_COLS && 
                !grid[newR][newC].isWall && !visited[newR][newC]) {
                visited[newR][newC] = true;
                queue.push({ r: newR, c: newC, path: [...path, {r: newR, c: newC}] });
            }
        }
    }

    if (finalPath) {
        let i = 0;
        function animatePath() {
            if (i < finalPath.length) {
                const pCell = grid[finalPath[i].r][finalPath[i].c].element;
                if (!pCell.classList.contains('start') && !pCell.classList.contains('end')) {
                    pCell.classList.remove('visited');
                    pCell.classList.add('path');
                }
                i++;
                setTimeout(animatePath, 50);
            }
        }
        animatePath();
    } else {
        alert("No path found!");
    }
}

initGrid();
