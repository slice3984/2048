const gridContainerEl = document.querySelector(".grid-container");
const scoreEl = document.querySelector(".info__score");
const resetEl = document.getElementById("reset");
const highscoreBtnEl = document.getElementById('display-highscores');
const highscoreDivEl = document.getElementById("highscores-content");
const highscoreOuterEl = document.getElementById('highscores');
const highscoreInfoEl = document.querySelector('.info__highscore');
let highscore = 0;

class Tile {
    tileEl;
    posClass;

    constructor(points, x, y) {
        this.points = points;
        this.x = x;
        this.y = y;
        this.generateEl();
    }

    generateEl() {
        const tileEl = document.createElement("div");
        tileEl.className = "tile";

        tileEl.className += ` move-${this.y}-${this.x}`;
        this.posClass = `move-${this.y}-${this.x}`;

        // Background
        tileEl.classList.add(`color-${Math.log2(this.points)}`);

        tileEl.setAttribute("value", this.points);

        this.tileEl = tileEl;
    }

    getEl() {
        return this.tileEl;
    }

    remove() {
        this.tileEl.remove();
    }

    merge() {
        this.tileEl.classList.replace(
            `color-${Math.log2(this.points)}`,
            `color-${Math.log2(this.points * 2)}`
        );
        this.points *= 2;
        this.tileEl.setAttribute("value", this.points);
    }

    moveTo(x, y) {
        const newPos = `move-${y}-${x}`;
        this.tileEl.classList.replace(this.posClass, newPos);
        this.posClass = newPos;
    }
}

class Board {
    gameover = false;
    score = 0;
    board = new Array(4).fill(0).map(x => new Array(4).fill(undefined));

    constructor(gridEl) {
        this.gridEl = gridEl;
    }

    addTile(tileEl) {
        this.board[tileEl.y][tileEl.x] = tileEl;
    }

    isCellInUse(x, y) {
        return !!this.board[y][x];
    }

    isBoardFull() {
        for (const row of this.board) {
            if (row.filter(x => !x).length > 0) {
                return false;
            }
        }
        return true;
    }

    generateRandomTile() {
        if (this.isBoardFull()) {
            return false;
        }

        let x = 0;
        let y = 0;

        do {
            const pos = this.getRandomPos();
            x = pos.x;
            y = pos.y;
        } while (this.isCellInUse(x, y));

        const points = Math.random() < 0.9 ? 2 : 4;
        const tile = new Tile(points, x, y);
        this.addTile(tile);
        this.score += points;
        scoreEl.textContent = `Score: ${this.score}`;
        if (highscore < this.score) {
            highscoreInfoEl.textContent = `Best: ${this.score}`;
        }

        return tile;
    }

    addRandomTile() {
        this.gridEl.appendChild(this.generateRandomTile().getEl());
    }

    getRandomPos() {
        return {
            x: Math.floor(Math.random() * 4),
            y: Math.floor(Math.random() * 4)
        };
    }

    doMove(keyCode) {
        if (this.gameover) {
            return;
        }

        let direction;
        let move;
        switch (keyCode) {
            case "ArrowUp":
                direction = "up";
                break;
            case "ArrowDown":
                direction = "down";
                break;
            case "ArrowLeft":
                direction = "left";
                break;
            case "ArrowRight":
                direction = "right";
                break;
            default:
                return;
        }
        move = this.canMove(direction);
        if (move.gotMove()) {
            this.move(direction);
            this.merge(direction);

            this.addRandomTile();
        }

        // Gameover check
        let possibleMoves = ["up", "down", "left", "right"].filter(dir => {
            let move = this.canMove(dir);
            return move.gotMove();
        });

        if (!possibleMoves.length) {
            document.querySelector(".gameover").style.display = "block";
            this.gameover = true;
            this.updateHighscores();
            Highscores.render();
        }
    }

    updateHighscores() {
        let scores = Highscores.getHighscores();
        scores.push(this.score);
        Highscores.saveHighscores(scores);
    }

    getColumnRow(index, col, reverse) {
        let arr = [];

        if (col) {
            for (let i = 0; i < 4; i++) {
                arr.push(this.board[i][index]);
            }
        } else {
            arr = [...this.board[index]];
        }

        return reverse ? arr.reverse() : arr;
    }

    merge(direction) {
        const move = new Move(false, false);
        let col, reverse;

        switch (direction) {
            case "up":
                col = true;
                reverse = false;
                break;
            case "down":
                col = true;
                reverse = true;
                break;
            case "left":
                col = false;
                reverse = false;
                break;
            case "right":
                col = false;
                reverse = true;
        }

        for (let colRow = 0; colRow < 4; colRow++) {
            let arr = this.getColumnRow(colRow, col, reverse);
            for (let i = 0; i < 3; i++) {
                if (arr[i] && arr[i + 1]) {
                    if (arr[i].points == arr[i + 1].points) {
                        this.removeFromBoard(arr[i + 1].x, arr[i + 1].y);
                        arr[i].merge();
                        arr[i + 1].remove();
                        i++;
                    }
                }
            }
        }
        if (this.canMove(direction).canMove) {
            this.move(direction);
        }
    }

    canMove(direction) {
        const move = new Move(false, false);
        let col, reverse;

        switch (direction) {
            case "up":
                col = true;
                reverse = false;
                break;
            case "down":
                col = true;
                reverse = true;
                break;
            case "left":
                col = false;
                reverse = false;
                break;
            case "right":
                col = false;
                reverse = true;
        }

        for (let colRow = 0; colRow < 4; colRow++) {
            let arr = this.getColumnRow(colRow, col, reverse);
            for (let cell = 0; cell < 3; cell++) {
                if (!arr[cell] && arr[cell + 1]) {
                    move.canMove = true;
                } else if (arr[cell] && arr[cell + 1]) {
                    let cellA = arr[cell].points;
                    let cellB = arr[cell + 1].points;
                    if (!move.canMerge) {
                        move.canMerge = cellA == cellB;
                    }
                }
            }
        }
        return move;
    }

    clearPoints() {
        this.score = 0;
    }

    clearBoard() {
        for (let row of this.board) {
            for (let cell in row) {
                if (row[cell]) {
                    row[cell].remove();
                }
                row[cell] = undefined;
            }
        }
    }

    updateBoard(oldX, oldY, newX, newY) {
        const tile = this.board[oldY][oldX];
        this.board[oldY][oldX] = undefined;
        this.board[newY][newX] = tile;
        tile.x = newX;
        tile.y = newY;
    }

    removeFromBoard(x, y) {
        this.gridEl.removeChild(this.board[y][x].tileEl);
        this.board[y][x] = undefined;
    }

    move(direction) {
        let col, reverse;

        switch (direction) {
            case "up":
                col = true;
                reverse = false;
                break;
            case "down":
                col = true;
                reverse = true;
                break;
            case "left":
                col = false;
                reverse = false;
                break;
            case "right":
                col = false;
                reverse = true;
        }

        for (let colRow = 0; colRow < 4; colRow++) {
            let arr = this.getColumnRow(colRow, col, reverse);

            let freePos = null;
            for (let cell = 0; cell < 4; cell++) {
                if (arr[cell]) {
                    if (freePos || freePos == 0) {
                        let freeCell = reverse ? 3 - freePos : freePos;
                        let [x, y] = col
                            ? [arr[cell].x, freeCell]
                            : [freeCell, arr[cell].y];
                        arr[cell].moveTo(x, y);
                        this.updateBoard(arr[cell].x, arr[cell].y, x, y);
                        arr = this.getColumnRow(colRow, col, reverse);

                        freePos++;
                    }
                    continue;
                }

                if (!freePos && freePos != 0) {
                    freePos = cell;
                }
            }
        }
    }

    moveUp() {
        for (let row = 0; row < 4; row++) {
            let freePos = null;
            for (let cell = 0; cell < 4; cell++) {}
        }
    }
}

class Move {
    constructor(canMove, canMerge) {
        this.canMove = canMove;
        this.canMerge = canMerge;
    }

    gotMove() {
        return this.canMove || this.canMerge;
    }
}

class Game {
    constructor(rootEl) {
        this.board = new Board(rootEl);
        document.addEventListener("keydown", e => this.board.doMove(e.code));
        highscoreBtnEl.addEventListener('click', () => {
            highscoreOuterEl.style.display = 'block';
        });

        highscoreOuterEl.addEventListener('click', () => {
            highscoreOuterEl.style.display = 'none';
        });

        resetEl.addEventListener("click", () => {
            this.reset();
        });

        this.startGame();
    }

    startGame() {
        highscore = Highscores.getHighscore();
        highscoreInfoEl.textContent = `Best: ${highscore}`;
        this.spawnTiles();
    }

    spawnTiles() {
        for (let i = 0; i < 2; i++) {
            this.board.addRandomTile();
        }
    }

    reset() {
        this.board.clearBoard();
        this.board.clearPoints();
        this.board.gameover = false;
        document.querySelector(".gameover").style.display = "none";
        this.startGame();
    }
}

class Highscores {
    static getHighscores() {
        const json = localStorage.getItem("highscores");
        try {
            const scores = JSON.parse(json);
            return scores || [];
        } catch(e) {
            return [];
        }
    }

    static saveHighscores(arr) {
        arr = arr.sort((a, b) => b - a);
        if (arr.length > 10) {
            arr.splice(9);
        }

        localStorage.setItem("highscores", JSON.stringify(arr));
    }

    static getHighscore() {
        const scores = Highscores.getHighscores();
        
        if (scores.length > 0) {
            return scores[0];
        }

        return 0;
    }

    static render() {
        let highscores = Highscores.getHighscores();
        const closeBtnEl = document.createElement('a');
        closeBtnEl.textContent = 'Close';
        closeBtnEl.className = 'btn';
        closeBtnEl.setAttribute('href', '#');

        closeBtnEl.addEventListener('click', () => {
            highscoreOuterEl.style.display = 'none';
        });

        highscoreDivEl.innerHTML = '';
        if (highscores.length == 0) {
            highscoreDivEl.textContent = "No highscores stored.";
            highscoreDivEl.appendChild(closeBtnEl);
        } else {
            let highscoreStr = "";

            let cnt = 1;
            for (let score of highscores) {
                highscoreStr += `<tr><td>${cnt}</td><td>${score}</td></tr>`;
                cnt++;
            }

            highscoreDivEl.innerHTML = `
            <table>
                <thead>
                    <td>#</td>
                    <td>Score</td>
                </thead>
                ${highscoreStr}
            </table>
            `;

            highscoreDivEl.appendChild(closeBtnEl);
        }
    }
}

const game = new Game(gridContainerEl);
Highscores.render();