let link = null;
let login = null;

const WIDTH = 15;
const HEIGHT = 15;
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;
const GRID_SIZE = 750;
const SCALE = GRID_SIZE/WIDTH;

document.addEventListener("DOMContentLoaded", async () => {
    let temp = decodeURIComponent(window.location.search).substring(1).split(":");
    link = temp[0];
    login = temp[1];
    await connectUser(link, login)
        .then((doesConnected) => {
            if(doesConnected) { // Заменить после дебаггинга /////////////////////////////////////////////////////////////////
                alert("Пользователя не существует, либо он находится в игре!");
            }
            else {
                gameInfo().then((data) => {
                    if(data) {
                        let status = data['status'];
                        if(status === "game") {
                            startGame(data);
                        }
                        else if(status === "lobby") {
                            let startGameDom = document.getElementById("startGame");
                            let handler = async () => {
                                await fillHand();
                                await firstTurn();
                                await gameInfo().then((new_data) => {
                                    startGame(new_data);
                                });
                                startGameDom.classList = "hidden";
                                startGameDom.removeEventListener("click", handler);
                            };
                            startGameDom.addEventListener("click", handler);

                        }
                    }
                });
            }
        });
});

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

function startGame(data) {
    console.log(data);
    let grid = JSON.parse(data['game_grid']);
    let coords = null;

    let players = JSON.parse(data['players']);

    let letters = [];
    for(let i = 0; i < grid.length; i++) {
        for(let j = 0; j < grid[0].length; j++) {
            if(grid[i][j][0] !== null) {
                coords = [i, j, grid[i][j][0]];
                let letter = new Letter(coords[0], coords[1], coords[2], grid, players);
                document.addEventListener("mousedown", letter.move.bind(letter));
                letters.push(letter);
            }
        }
    }

    let player = players.find((elem) => {
        return elem[0] === login;
    });
    for(let i = 0; i < 7; i++) {
        if(player[2][i] !== null) {
            coords = [i + 1, HEIGHT + 1, player[2][i]];
            let letter = new Letter(coords[0], coords[1], coords[2], grid, players);
            document.addEventListener("mousedown", letter.move.bind(letter));
            letters.push(letter);
        }
    }

    let map = new Map(grid, ".canvas", letters, player);
}

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

async function updateData(letter) {
    let promise = gameInfo(link);
    promise.then((data) => {
        let grid = JSON.parse(data['game_grid']);
        let coords = null;
        for(let i = 0; i < grid.length; i++) {
            for(let j = 0; j < grid.length; j++) {
                if(grid[i][j][0] !== null && grid[i][j][0][0] === letter.value[0]) {
                    coords = [i, j, grid[i][j][0]];
                }
            }
        }
        if(coords === null) {
            let players = JSON.parse(data['players']);
            let player = players.find((elem) => {
                return elem[0] === login;
            });
            for(let i = 0; i < 7; i++) {
                if(player[2][i] !== null && player[2][i][0] === letter.value[0]) {
                    coords = [i + 1, HEIGHT + 1, player[2][i]];
                }
            }
        }
        letter.x = coords && coords[0] || 0;
        letter.y = coords && coords[1] || 0;
        letter.value = coords && coords[2] || null;
    });
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

////// LETTER ///////
function Letter(x = 0, y = 0, value="а", grid, players) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.grid = grid;
    this.players = players;
    this.updateInterval = setInterval(updateData, 1000, this);
}

Letter.prototype.move = function (e) {
    if(
        e.x >= this.x * SCALE &&
        e.x <= this.x * SCALE + SCALE &&
        e.y >= this.y * SCALE &&
        e.y <= this.y * SCALE + SCALE
    ) {
        let handler = mouseMoveEvent.bind(this);
        clearInterval(this.updateInterval);
        let player = this.players.find((elem) => {
            return elem[0] === login;
        });
        if(this.x >= 0 && this.x < WIDTH && this.y >= 0 && this.y < WIDTH)
            this.grid[this.x][this.y][0] = null;
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

let mouseUpEvent = async function (handler) {
    document.removeEventListener("mousemove", handler);
    if(this.x >= 0 && this.x < WIDTH && this.y >= 0 && this.y < WIDTH)
        await changePosition(this, "grid");
    else if(this.x >= 1 && this.x <= 7 && this.y >= WIDTH + 1 && this.y <= WIDTH + 2)
        await changePosition(this, "hand");
    this.updateInterval = await setInterval(updateData, 1000, this);
};

async function changePosition(letter, flag) {
    if(flag === "grid")
        letter.grid[letter.x][letter.y][0] = letter.value;
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
    formData.append('grid', JSON.stringify(letter.grid));
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
function Map(grid, canvas, letters, player) {
    this.grid = grid;
    this.canvas = document.querySelector(canvas);
    this.ctx = this.canvas.getContext("2d");
    this.player = player;
    setInterval(this.draw.bind(this), 10, letters);
}

Map.prototype.draw = function (letters) {
    this.ctx.canvas.width  = CANVAS_WIDTH;
    this.ctx.canvas.height = CANVAS_HEIGHT;
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawGrid();
    this.drawHand();
    this.drawLetter(letters);
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
            if(this.grid[x][y][2] === "word" && this.grid[x][y][1] === 2) {
                this.ctx.fillStyle = '#BA55D3';
            }
            else if(this.grid[x][y][2] === "word" && this.grid[x][y][1] === 3) {
                this.ctx.fillStyle = '#FFA500';
            }
            else if(this.grid[x][y][2] === "cell" && this.grid[x][y][1] === 2) {
                this.ctx.fillStyle = '#0928ff';
            }
            else if(this.grid[x][y][2] === "cell" && this.grid[x][y][1] === 3) {
                this.ctx.fillStyle = '#ADD8E6';
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
            if(this.grid[x][y][1] !== 1)
                this.ctx.fillText(this.grid[x][y][1], x * SCALE + SCALE / 2, y * SCALE + SCALE / 2);
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

Map.prototype.drawLetter = function(letters) {
    letters.forEach((letter) => {
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