link = null;
let login = null;

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
    let linkDom = document.getElementById("js-link");
    linkDom.innerText = link;
    if(!doesConnected) {
        alert("Пользователя не существует, либо он находится в игре!");
    }
    else {
        let menu = new Menu();
        let game = new Game(menu);
        let map = new Map(".js-canvas", game);
        game.map = map;
        await game.update(menu);

        if(game.status === "game") {
            closeLobby(game, 1);
        }
        else if(game.status === "lobby") {
            closeLobby(game, 0);
        }
    }
});

function testFunc(name) {
    let products = [],
    i;
 
    for (i in products) {
        if(products.hasOwnProperty(i)) {
            console.log('property: ' + i);
        }
    }
    let cond = "sd";
    switch (cond) {
        case "one":
            cond = 5; 
        case "two":
            cond = 5; 
    }

     return "Hello, " + name;
}

function closeLobby(game, isGameStarted) {
    let startGameDom = document.getElementById("js-startGame");
    if(isGameStarted) {
        startGame(game);
        startGameDom.className = "hidden";
    }
    else {
        let handler = async () => {
            await fillHand();
            await firstTurn();
            startGame(game);
            startGameDom.className = "hidden";
            startGameDom.removeEventListener("click", handler);
        };
        startGameDom.addEventListener("click", handler);

        let startGameLisetener = setInterval(async () => {
            if(game.status === "game") {
                await fillHand();
                await firstTurn();
                startGame(game);
                startGameDom.className = "hidden";
                startGameDom.removeEventListener("click", handler);
                clearInterval(startGameLisetener);
            }
        }, 5000)
    }
}

// Подключение пользователя и проверка на наличие этого пользователя в игре
async function connectUser() {
    let formData = new FormData();
    formData.append('link', link);
    formData.append('login', login);
    formData.append('data', 'players');
    let url = "https://ruscrabble.000webhostapp.com/php/changeData.php";
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
    let url = "https://ruscrabble.000webhostapp.com/php/changeData.php";
    let promise = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await promise.json();
}

///////////////////////// START GAME //////////////////////////////////////////

// Создание объектов игры
function startGame(game) {
    console.log(game);
    moveListener(game);
    nextTurnListener.call(game);
    endGameListener.call(game);

    let pointsInputDom = document.querySelector(".js-pointsInput");
    let leftArrDom = document.querySelector(".js-left");
    let rightArrDom = document.querySelector(".js-right");

    leftArrDom.addEventListener("click", () => {
        pointsInputDom.value = parseInt(pointsInputDom.value) - 1;
    });

    rightArrDom.addEventListener("click", () => {
        pointsInputDom.value = parseInt(pointsInputDom.value) + 1;
    });

    if(game.turn !== null) {
        game.isYourTurn = game.players[(parseInt(game.turn) % game.players.length)][0] === game.currentPlayer[0];

        let turnDom = document.querySelector(".js-currentTurn");
        turnDom.parentElement.classList.remove("hidden");
        turnDom.innerHTML = game.turn;

        let currentPlayer = game.players[(parseInt(game.turn) % game.players.length)];

        if(game.players.every((player) => { return player[1]})) {
            fullEndGame(game.players);
        }
        else {
            if(currentPlayer[1] === true) {
                nextTurnListener.call(game, true);
            }
        }


        let playerDom = document.querySelector(".js-currentPlayer");
        playerDom.parentElement.classList.remove("hidden");
        playerDom.innerHTML = currentPlayer[0];

        let lettersCountDom = document.querySelector(".js-currentLetters");
        lettersCountDom.parentElement.classList.remove("hidden");
        lettersCountDom.innerHTML = game.items.length + "";
    }


    document.querySelector(".js-canvas").addEventListener("mousemove", (e) => {
        let x = Math.floor(e.x / SCALE);
        let y = Math.floor(e.y / SCALE);
        if(x >= 0 && x < 15 && y >= 0 && y < 15) {
            let cell = game.grid[x][y];
            let descriptionDom = document.querySelector(".js-description");
            descriptionDom.innerHTML =
            `Ячейка: [${y+1}, ${x+1}]<br>
             Множитель ячейки: ${cell[1]}<br>
             Модификатор ячейки: ${cell[2]}`;
            if(cell[0]) {
                descriptionDom.innerHTML += `<br>
             Буква: ${cell[0][1]}<br>
             Баллы буквы: ${cell[0][2]}`
            }
        }
    });
}

function Game(menu) {
    this.link = null;
    this.grid = null;
    this.players = null;
    this.currentPlayer = null;

    this.items = null;
    this.status = null;

    this.turn = null;
    this.isYourTurn = false;

    this.turnPoints = 0;
    this.wordPointsMod = 1;

    this.letters = null;
    this.stopUpdateFlag = 0;

    this.updateInterval = setInterval(this.update.bind(this, menu), 1000);
}

Game.prototype.update = async function(menu) {
    if(!this.stopUpdateFlag) {
        let data = await gameInfo(link);
        this.grid = JSON.parse(data['game_grid']);
        this.players = JSON.parse(data['players']);
        this.items = JSON.parse(data['items']);
        this.status = data['status'];
        this.turn = data['turn'];
        this.link = data['link'];

        this.currentPlayer = this.players.find((elem) => {
            return elem[0] === login;
        });

        this.setLetters(menu);

        menu.game = this;



        let nextTurnDom = document.querySelector(".js-nextTurn");
        let addPointsDom = document.querySelector(".js-addPoints");
        let endGameDom = document.querySelector(".js-end");
        if(this.isYourTurn) {
            addPointsDom.classList.remove("hidden");
            nextTurnDom.classList.remove("hidden");
            endGameDom.classList.remove("hidden");
        }
        else {
            addPointsDom.classList.add("hidden");
            nextTurnDom.classList.add("hidden");
            endGameDom.classList.add("hidden");
        }

        console.log(this.isYourTurn, this.currentPlayer);
        if(this.players.every((player) => { return player[1]})) {
            fullEndGame(this.players);
            addPointsDom.classList.add("hidden");
            nextTurnDom.classList.add("hidden");
            endGameDom.classList.add("hidden");
        }


    }
};

Game.prototype.setLetters = function(menu) {
    this.letters = [];
    let coords = null;
    for(let i = 0; i < 7; i++) {
        if(this.currentPlayer[2][i] !== null) {
            coords = [i + 1, HEIGHT + 1, this.currentPlayer[2][i]];
            let letter = new Letter(coords[0], coords[1], coords[2], this, menu);
            this.letters.push(letter);
        }
    }
    for(let i = 0; i < this.grid.length; i++) {
        for(let j = 0; j < this.grid[0].length; j++) {
            if(this.grid[i][j][0] !== null) {
                coords = [i, j, this.grid[i][j][0]];
                let letter = new Letter(coords[0], coords[1], coords[2], this, menu);
                this.letters.push(letter);
            }
        }
    }
};

function nextTurnListener(isSkipTurn) {
    let nextTurnDom = document.querySelector(".js-nextTurn");
    if(isSkipTurn) {
        let handlerSkip = async () => {
            nextTurnDom.classList.add("hidden");
            let formData = new FormData();
            formData.append('link', link);
            formData.append('data', 'nextTurn');
            formData.append('players', JSON.stringify(this.players));
            let url = "https://ruscrabble.000webhostapp.com/php/changeData.php";
            await fetch(url, {
                method: 'POST',
                body: formData
            });
        };

        if(isSkipTurn) {
            handlerSkip();
        }
    }
    else {
        let handler = async () => {
            let pointsInputDom = document.querySelector(".js-pointsInput");
            let points = parseInt(this.currentPlayer[3]);
            if(pointsInputDom.value) {
                points += parseInt(pointsInputDom.value);
            }
            this.currentPlayer[3] = points;
            pointsInputDom.value = 0;
            this.players = this.players.map((elem) => {
                if(elem[0] === login)
                    elem = this.currentPlayer;
                return elem;
            });
            nextTurnDom.classList.add("hidden");
            let formData = new FormData();
            formData.append('link', link);
            formData.append('data', 'nextTurn');
            formData.append('players', JSON.stringify(this.players));
            let url = "https://ruscrabble.000webhostapp.com/php/changeData.php";
            await fetch(url, {
                method: 'POST',
                body: formData
            });
            await fillHand();

            if(this.players.every((player) => { return player[1]})) {
                fullEndGame(this.players);
                return;
            }

            let currentPlayer = this.players[(parseInt(this.turn) % this.players.length)];
            if(currentPlayer[1] === true) {
                nextTurnListener.call(this, true);
            }
        };
        nextTurnDom.addEventListener("click", handler);
    }

}

function endGameListener() {
    let endGameDom = document.querySelector(".js-end");
    let handler = async () => {
        let pointsInputDom = document.querySelector(".js-pointsInput");
        let points = parseInt(this.currentPlayer[3]);
        if(pointsInputDom.value) {
            points += parseInt(pointsInputDom.value);
        }
        this.currentPlayer[3] = points;
        this.currentPlayer[1] = true;
        pointsInputDom.value = 0;
        this.players = this.players.map((elem) => {
            if(elem[0] === login)
                elem = this.currentPlayer;
            return elem;
        });
        endGameDom.classList.add("hidden");
        let formData = new FormData();
        formData.append('link', link);
        formData.append('data', 'nextTurn');
        formData.append('player', login);
        formData.append('end', 'true');
        formData.append('players', JSON.stringify(this.players));
        let url = "https://ruscrabble.000webhostapp.com/php/changeData.php";
        await fetch(url, {
            method: 'POST',
            body: formData
        });
    };
    endGameDom.addEventListener("click", handler);
}

function fullEndGame(players) {
    let domWinner = document.querySelector(".js-winner");
    let maxPoints = players[0][3];
    let winner = players[0][0];
    players.forEach((player) => {
        if(maxPoints < player[3]) {
            maxPoints = player[3];
            winner = player[0];
        }
    });
    domWinner.innerText = winner;
    domWinner.parentElement.classList.remove("hidden");

    let nextTurnDom = document.querySelector(".js-nextTurn");
    let addPointsDom = document.querySelector(".js-addPoints");
    let endGameDom = document.querySelector(".js-end");
    addPointsDom.classList.remove("hidden");
    nextTurnDom.classList.remove("hidden");
    endGameDom.classList.remove("hidden");
}

async function fillHand() {
    let formData = new FormData();
    formData.append('link', link);
    formData.append('player', login);
    formData.append('data', 'fillHand');
    let url = "https://ruscrabble.000webhostapp.com/php/changeData.php";
    let promise = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await promise.json();
}


async function gameInfo() {
    let formData = new FormData();
    formData.append('link', link);
    let url = "https://ruscrabble.000webhostapp.com/php/getData.php";
    let response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await response.json();
}

/////// MENU /////////
function Menu() {
    this.game = null;
    setInterval(this.showInfo.bind(this), 500);
}

Menu.prototype.showInfo = function() {
    this.showPlayers();
    this.currentTurnPoints();
};

Menu.prototype.showPlayers = function () {
    if(this.game){
        let dom = document.querySelector(".js-players");
        while(dom.firstChild) {
            dom.removeChild(dom.lastChild);
        }
        this.game.players.forEach((elem) => {
            let div = document.createElement("div");
            div.className = "players__row row";
            div.innerHTML = `<div>${elem[0]}</div><div>${elem[3]}б.</div>`;
            dom.appendChild(div);
    });
    }
};

Menu.prototype.currentTurnPoints = function () {
    if(this.game) {
        if(this.game.turn !== null) {
            this.game.isYourTurn = this.game.players[(parseInt(this.game.turn) % this.game.players.length)][0] === this.game.currentPlayer[0];
            let turnDom = document.querySelector(".js-currentTurn");
            turnDom.parentElement.classList.remove("hidden");
            turnDom.innerHTML = this.game.turn;

            let currentPlayer = this.game.players[(parseInt(this.game.turn) % this.game.players.length)];
            let playerDom = document.querySelector(".js-currentPlayer");
            playerDom.parentElement.classList.remove("hidden");
            playerDom.innerHTML = currentPlayer[0];

            let lettersCountDom = document.querySelector(".js-currentLetters");
            lettersCountDom.parentElement.classList.remove("hidden");
            lettersCountDom.innerHTML = this.game.items.length + "";
        }
    }
};


////// LETTER ///////
function Letter(x = 0, y = 0, value = "а", game, menu) {
    this.x = x;
    this.y = y;
    this.value = value;
}

function moveListener(game) {
    document.addEventListener("mousedown", (e) => {
        if(game.isYourTurn) {
            game.letters.forEach((letter) => {
                if(
                    e.x >= letter.x * SCALE &&
                    e.x <= letter.x * SCALE + SCALE &&
                    e.y >= letter.y * SCALE &&
                    e.y <= letter.y * SCALE + SCALE
                ) {
                    let handler = mouseMoveEvent.bind(letter);
                    let savedPos = null;
                    if(letter.x >= 0 && letter.x < WIDTH && letter.y >= 0 && letter.y < WIDTH){
                        savedPos = {
                            'x': letter.x,
                            'y': letter.y,
                            'value': letter.value,
                            'place': "grid"
                        };
                        game.grid[letter.x][letter.y][0] = null;
                    }
                    else if(letter.x >= 1 && letter.x <= 7 && letter.y >= WIDTH + 1 && letter.y <= WIDTH + 2){
                        savedPos = {
                            'x': letter.x,
                            'value': letter.value,
                            'place': "hand"
                        };
                        game.currentPlayer[2][letter.x - 1] = null;
                    }

                    game.players = game.players.map((elem) => {
                        if(elem[0] === login)
                            elem = game.currentPlayer;
                        return elem;
                    });

                    game.stopUpdateFlag = 1;
                    document.addEventListener("mouseup", mouseUpEvent.bind(letter, handler, game, savedPos), {once: true});
                    document.addEventListener("mousemove", handler);
                }
            });
        }
    });
}

let mouseUpEvent = async function (handler, game, savedPos) {
    document.removeEventListener("mousemove", handler);
    if(this.x >= 0 && this.x < WIDTH && this.y >= 0 && this.y < WIDTH){
        if(savedPos.place === "grid" && game.grid[this.x][this.y][0])
            game.grid[savedPos.x][savedPos.y][0] = savedPos.value;
        else if(savedPos.place === "hand" && game.grid[this.x][this.y][0])
            game.currentPlayer[2][savedPos.x - 1] = savedPos.value;
        else
            await changePosition(this, game, "grid");

    }
    else if(this.x >= 1 && this.x <= 7 && this.y >= WIDTH + 1 && this.y <= WIDTH + 2){
        if(savedPos.place === "grid" && game.currentPlayer[2][this.x - 1])
            game.grid[savedPos.x][savedPos.y][0] = savedPos.value;
        else if(savedPos.place === "hand" && game.currentPlayer[2][this.x - 1])
            game.currentPlayer[2][savedPos.x - 1] = savedPos.value;
        else
            await changePosition(this, game, "hand");

    }
    game.stopUpdateFlag = 0;
};

async function changePosition(letter, game, flag) {
    if(flag === "grid"){
        game.grid[letter.x][letter.y][0] = letter.value;
    }
    else if(flag === "hand") {
        game.currentPlayer[2][letter.x - 1] = letter.value;
        game.players = game.players.map((elem) => {
            if(elem[0] === login)
                elem = game.currentPlayer;
            return elem;
        });
    }
    let formData = new FormData();
    formData.append('link', link);
    formData.append('grid', JSON.stringify(game.grid));
    formData.append('players', JSON.stringify(game.players));
    formData.append('data', 'position');
    let url = "https://ruscrabble.000webhostapp.com/php/changeData.php";
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
    if(this.game.turn) {
        this.ctx.canvas.width  = CANVAS_WIDTH;
        this.ctx.canvas.height = CANVAS_HEIGHT;
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.drawGrid();
        this.drawHand();
        this.drawLetter();
    }
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
            this.ctx.fillStyle = 'rgba(204, 72, 45, 0.5)';
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
