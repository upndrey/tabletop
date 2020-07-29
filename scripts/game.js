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
                        startGame(data);
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


///////////////////////// START GAME //////////////////////////////////////////

function startGame(data) {
    console.log(data);
    let grid = JSON.parse(data['game_grid'], );
    let coords = [0, 0, null];
    for(let i = 0; i < grid.length; i++) {
        for(let j = 0; j < grid[0].length; j++) {
            if(grid[i][j][0] !== null) {
                coords = [i, j, grid[i][j][0]];
            }
        }
    }
    let players = JSON.parse(data['players']);
    let player = players.find((elem) => {
        return elem[0] === login;
    });

    let letter = new Letter(coords[0], coords[1], coords[2], grid, players);
    let map = new Map(grid, ".canvas", letter, player);

    document.addEventListener("mousedown", letter.move.bind(letter));
}

async function updateData(letter) {
    let promise = gameInfo(link);
    promise.then((data) => {
        let grid = JSON.parse(data['game_grid']);
        let coords = null;
        for(let i = 0; i < grid.length; i++) {
            for(let j = 0; j < grid.length; j++) {
                if(grid[i][j][0] !== null) {
                    coords = [i, j, grid[i][j][0]];
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

        if(this.x >= 0 && this.x < WIDTH && this.y >= 0 && this.y < WIDTH)
            this.grid[this.x][this.y][0] = null;
        else if(this.x >= 1 && this.x <= 7 && this.y >= WIDTH + 1 && this.y <= WIDTH + 2)
            this.grid[this.x][this.y][0] = null;

        document.addEventListener("mouseup", mouseUpEvent.bind(this, handler), {once: true});
        document.addEventListener("mousemove", handler);
    }
};

let mouseUpEvent = async function (handler) {
    document.removeEventListener("mousemove", handler);
    if(this.x >= 0 && this.x < WIDTH && this.y >= 0 && this.y < WIDTH)
        await changePosition(this);
    else if(this.x >= 1 && this.x <= 7 && this.y >= WIDTH + 1 && this.y <= WIDTH + 2)
        await moveInHand(this);
    this.updateInterval = await setInterval(updateData, 1000, this);
};

async function changePosition(letter) {
    letter.grid[letter.x][letter.y][0] = letter.value;
    let formData = new FormData();
    formData.append('link', link);
    formData.append('grid', JSON.stringify(letter.grid));
    formData.append('data', 'position');
    let url = "http://tabletop/php/changeData.php";
    let response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await response.json();
}

async function moveInHand(letter) {
    let player = letter.players.find((elem) => {
        return elem[0] === login;
    });
    player[2][letter.x - 1] = letter.value;
    letter.players = letter.players.map((elem) => {
        if(elem[0] === login)
            elem = player;
        return elem;
    });
    let formData = new FormData();
    formData.append('link', link);
    formData.append('grid', JSON.stringify(letter.grid));
    formData.append('players', JSON.stringify(letter.players));
    formData.append('data', 'moveInHand');
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

function Map(grid, canvas, letter, player) {
    this.grid = grid;
    this.canvas = document.querySelector(canvas);
    this.ctx = this.canvas.getContext("2d");
    this.player = player;
    setInterval(this.draw.bind(this), 10, letter);
}

Map.prototype.draw = function (letter) {
    this.ctx.canvas.width  = CANVAS_WIDTH;
    this.ctx.canvas.height = CANVAS_HEIGHT;
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawGrid();
    this.drawHand();
    this.drawLetter(letter);
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
            this.ctx.font = "30px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(this.grid[x][y][1], x * SCALE + SCALE / 2, y * SCALE + SCALE / 2);
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
    for (let i = 0; i < 7; i++) {
        if(this.player[2][i] !== null) {
            this.ctx.beginPath();
            this.ctx.rect(SCALE + i * SCALE, GRID_SIZE + SCALE, SCALE, SCALE);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fill();
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.font = "30px Arial";
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(this.player[2][i][0], SCALE + i * SCALE + SCALE/2, GRID_SIZE + SCALE + SCALE/2);
            this.ctx.closePath();
        }
    }
};

Map.prototype.drawLetter = function(letter) {
    if(letter.value) {
        this.ctx.beginPath();
        this.ctx.rect(letter.x * SCALE, letter.y * SCALE, SCALE, SCALE);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fill();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = "30px Arial";
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(letter.value[0], letter.x * SCALE + SCALE / 2, letter.y * SCALE + SCALE / 2);
        this.ctx.closePath();
    }
};