let link = null;
let login = null;
let updateInterval = null;

const WIDTH = 15;
const HEIGHT = 15;
const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 900;
const GRID_SIZE = 750;
const SCALE = GRID_SIZE/WIDTH;

document.addEventListener("DOMContentLoaded", async () => {
    let temp = decodeURIComponent(window.location.search).substring(1).split(":");
    link = temp[0];
    login = temp[1];
    let doesConnected = await connectUser(link, login);
    if(doesConnected) { // Заменить после дебаггинга /////////////////////////////////////////////////////////////////
        alert("Пользователя не существует, либо он находится в игре!");
    }
    else {
        await fillHand();
        let data = await gameInfo();
        if(data) {
            let game = new Game();
            game.update(data);
            let menu = new Menu(game.players, game.turn, []);
            let startGameDom = document.getElementById("js-startGame");
            if(game.status === "game") {
                clearInterval(menu.updatePlayers);
                startGame(game);
                startGameDom.className = "hidden";
            }
            else if(game.status === "lobby") {
                let handler = async () => {
                    await firstTurn();
                    data = await gameInfo();
                    game.update(data);
                    startGame(game);
                    startGameDom.className = "hidden";
                    startGameDom.removeEventListener("click", handler);
                };
                startGameDom.addEventListener("click", handler);
            }
        }
    }
});

// Подключение пользователя и проверка на наличие этого пользователя в игре
async function connectUser() {
    let formData = new FormData();
    formData.append('link', link);
    formData.append('login', login);
    formData.append('data', 'players');
    let url = "http://tabletop/php/changeData.php";
    let promise = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await promise.json();
}

// Запуск игры
async function firstTurn() {
    let formData = new FormData();
    formData.append('link', link);
    formData.append('data', 'status');
    let url = "http://tabletop/php/changeData.php";
    let promise = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await promise.json();
}

///////////////////////// START GAME //////////////////////////////////////////

// Создание объектов игры
function startGame(game) {
    game.setLetters();

    let map = new Map(".js-canvas", game);
    let nextTurnInterval = setInterval(nextTurn.bind(this, game), 1000);
    let menu = new Menu(game);

    updateInterval = setInterval(updateData.bind(this, game), 1000);
}

function Game(grid, players, items, status, turn, link) {
    this.grid = grid;
    this.players = players;
    this.items = items;
    this.status = status;
    this.turn = turn;
    this.link = link;
    this.currentPlayer = this.players.find((elem) => {
        return elem[0] === login;
    });
    this.letters = null;
}

Game.prototype.update = (data) => {
    this.grid = JSON.parse(data['grid']);
    this.players = JSON.parse(data['players']);
    this.items = JSON.parse(data['items']);
    this.status = data['status'];
    this.turn = data['turn'];
    this.link = data['link'];
};

Game.prototype.setLetters = () => {
    this.letters = [];
    let coords = null;
    for(let i = 0; i < 7; i++) {
        if(this.currentPlayer[2][i] !== null) {
            coords = [i + 1, HEIGHT + 1, this.currentPlayer[2][i]];
            let letter = new Letter(coords[0], coords[1], coords[2], this);
            this.letters.push(letter);
        }
    }
    for(let i = 0; i < this.grid.length; i++) {
        for(let j = 0; j < this.grid[0].length; j++) {
            if(this.grid[i][j][0] !== null) {
                coords = [i, j, this.grid[i][j][0]];
                let letter = new Letter(coords[0], coords[1], coords[2], this);
                this.letters.push(letter);
            }
        }
    }
};

async function fillHand() {
    let formData = new FormData();
    formData.append('link', link);
    formData.append('player', login);
    formData.append('data', 'fillHand');
    let url = "http://tabletop/php/changeData.php";
    let promise = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await promise.json();
}

// Сделать так, чтобы запрос выполнялся к списку символов, а не к каждому поотдельности
async function updateData(game) {
    let data = await gameInfo(link);
    game.update(data);
}

async function gameInfo() {
    let formData = new FormData();
    formData.append('link', link);
    let url = "http://tabletop/php/getData.php";
    let response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await response.json();
}

/////// MENU /////////
function Menu(players, turn, letters=null, map=null) {
    this.players = players;
    this.turn = turn;
    this.showPlayers();
    this.letters = letters;
    this.map = map;
    if(this.turn !== null) {
        this.currentTurn();
    }
}


Menu.prototype.showPlayers = function () {
    let dom = document.querySelector(".js-players");
    while(dom.firstChild) {
        dom.removeChild(dom.lastChild);
    }
    this.players.forEach((elem) => {
        let div = document.createElement("div");
        div.className = "players__row row";
        div.innerHTML = `<div>${elem[0]}</div><div>${elem[3]}б.</div>`;
        dom.appendChild(div);
    });
};

Menu.prototype.currentTurn = function () {
    let turnDom = document.querySelector(".js-currentTurn");
    let playerDom = document.querySelector(".js-currentPlayer");
    turnDom.parentElement.classList.remove("hidden");
    turnDom.innerHTML = this.turn;
    let currentPlayer = this.players[(parseInt(this.turn) % this.players.length)];
    playerDom.parentElement.classList.remove("hidden");
    playerDom.innerHTML = currentPlayer[0];
};

function nextTurn(game) {
    let nextTurnDom = document.querySelector(".js-nextTurn");
    let handler = async () => {
        await fillHand();
        let formData = new FormData();
        formData.append('link', link);
        formData.append('data', 'nextTurn');
        let url = "http://tabletop/php/changeData.php";
        await fetch(url, {
            method: 'POST',
            body: formData
        }).then(() => {
        });
    };

    let nextTurnFlag = 0;
    for(let i = 0; i < game.currentPlayer[2].length; i++) {
        if(game.currentPlayer[2][i] === null) {
            nextTurnFlag = 1;
            break;
        }
    }

    if(nextTurnFlag) {
        nextTurnDom.classList.remove("hidden");
        nextTurnDom.addEventListener("click", handler, {once: true});
    }
    else {
        nextTurnDom.classList.add("hidden");
        nextTurnDom.removeEventListener("click", handler);
    }
}

////// LETTER ///////
function Letter(x = 0, y = 0, value="а", game) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.game = game;
    document.addEventListener("mousedown", this.move.bind(this));
}

Letter.prototype.move = function (e) {
    if(
        e.x >= this.x * SCALE &&
        e.x <= this.x * SCALE + SCALE &&
        e.y >= this.y * SCALE &&
        e.y <= this.y * SCALE + SCALE
    ) {
        let handler = mouseMoveEvent.bind(this);
        clearInterval(updateInterval);
        let player = this.players.find((elem) => {
            return elem[0] === login;
        });
        if(this.x >= 0 && this.x < WIDTH && this.y >= 0 && this.y < WIDTH)
            this.game.grid[this.x][this.y][0] = null;
        else if(this.x >= 1 && this.x <= 7 && this.y >= WIDTH + 1 && this.y <= WIDTH + 2)
            player[2][this.x - 1] = null;

        this.players = this.players.map((elem) => {
            if(elem[0] === login)
                elem = player;
            return elem;
        });
        document.addEventListener("mouseup", mouseUpEvent.bind(this, handler), {once: true});
        document.addEventListener("mousemove", handler);
    }
};

let mouseUpEvent = async function (handler, letters) {
    document.removeEventListener("mousemove", handler);
    if(this.x >= 0 && this.x < WIDTH && this.y >= 0 && this.y < WIDTH)
        await changePosition(this, "grid");
    else if(this.x >= 1 && this.x <= 7 && this.y >= WIDTH + 1 && this.y <= WIDTH + 2)
        await changePosition(this, "hand");
    updateInterval = await setInterval(updateInterval, 5000);
};

async function changePosition(letter, flag) {
    if(flag === "grid")
        letter.game.grid[letter.x][letter.y][0] = letter.value;
    else if(flag === "hand") {
        let player = letter.players.find((elem) => {
            return elem[0] === login;
        });
        player[2][letter.x - 1] = letter.value;
        letter.players = letter.players.map((elem) => {
            if(elem[0] === login)
                elem = player;
            return elem;
        });
    }
    let formData = new FormData();
    formData.append('link', link);
    formData.append('grid', JSON.stringify(letter.game.grid));
    formData.append('players', JSON.stringify(letter.players));
    formData.append('data', 'position');
    let url = "http://tabletop/php/changeData.php";
    let response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await response.json();
}


let mouseMoveEvent = function (e) {
    this.x = Math.floor(e.x / SCALE);
    this.y = Math.floor(e.y / SCALE);
};


////// MAP ///////
function Map(canvas, game) {
    this.canvas = document.querySelector(canvas);
    this.ctx = this.canvas.getContext("2d");
    this.game = game;
    setInterval(this.draw.bind(this), 10);
}

Map.prototype.draw = function() {
    this.ctx.canvas.width  = CANVAS_WIDTH;
    this.ctx.canvas.height = CANVAS_HEIGHT;
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawGrid();
    this.drawHand();
    this.drawLetter();
};

Map.prototype.drawGrid = function() {
    for (let x = 0; x <= WIDTH; x++) {
        this.ctx.moveTo(x * SCALE, 0);
        this.ctx.lineTo(x * SCALE, GRID_SIZE);
        this.ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
        this.ctx.moveTo(0, y * SCALE);
        this.ctx.lineTo(GRID_SIZE, y * SCALE);
        this.ctx.stroke();
    }
    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < HEIGHT; y++) {
            this.ctx.beginPath();
            if(this.game.grid[x][y][2] === "word" && this.game.grid[x][y][1] === 2) {
                this.ctx.fillStyle = '#BA55D3';
            }
            else if(this.game.grid[x][y][2] === "word" && this.game.grid[x][y][1] === 3) {
                this.ctx.fillStyle = '#FFA500';
            }
            else if(this.game.grid[x][y][2] === "cell" && this.game.grid[x][y][1] === 2) {
                this.ctx.fillStyle = '#ADD8E6';
            }
            else if(this.game.grid[x][y][2] === "cell" && this.game.grid[x][y][1] === 3) {
                this.ctx.fillStyle = '#0928ff';
            }
            else {
                this.ctx.fillStyle = '#ffffff';
            }
            this.ctx.rect(x * SCALE, y * SCALE, SCALE, SCALE);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.font = "30px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillStyle = '#000';
            if(this.game.grid[x][y][1] !== 1)
                this.ctx.fillText(this.game.grid[x][y][1], x * SCALE + SCALE / 2, y * SCALE + SCALE / 2);
            this.ctx.closePath();
        }
    }
};

Map.prototype.drawHand = function() {
    let margin = SCALE;
    for (let i = 0; i <= 7; i++) {
        this.ctx.moveTo(SCALE + i * SCALE, GRID_SIZE + margin);
        this.ctx.lineTo(SCALE + i * SCALE, GRID_SIZE + margin + SCALE);
        this.ctx.stroke();
    }
    for (let i = 0; i < 2; i++) {
        this.ctx.moveTo(SCALE, GRID_SIZE + margin + i * SCALE);
        this.ctx.lineTo(SCALE + SCALE * 7, GRID_SIZE + margin + i * SCALE);
        this.ctx.stroke();
    }
};

Map.prototype.drawLetter = function() {
    this.game.letters.forEach((letter) => {
        if(letter.value) {
            this.ctx.beginPath();
            this.ctx.rect(letter.x * SCALE, letter.y * SCALE, SCALE, SCALE);
            this.ctx.fillStyle = '#cc482d';
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.font = "30px Arial";
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(letter.value[1], letter.x * SCALE + SCALE / 2, letter.y * SCALE + SCALE / 2);
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.font = "15px Arial";
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(letter.value[2], letter.x * SCALE + SCALE / 5, letter.y * SCALE + SCALE / 5);
            this.ctx.closePath();
        }
    });
};