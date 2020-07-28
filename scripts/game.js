let link = null;

const WIDTH = 15;
const HEIGHT = 15;
const SIZE = 900;
const SCALE = SIZE/WIDTH;

document.addEventListener("DOMContentLoaded", async () => {
    let temp = window.location.search.substring(1).split(":");
    link = temp[0];
    let login = temp[1];
    await connectUser(link, login)
        .then((doesConnected) => {
            console.log(doesConnected);
            if(doesConnected) { // Заменить после дебаггинга
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

async function connectUser(link, login) {
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


function startGame(data) {
    let grid = JSON.parse(data['game_grid']);
    let coords = [0, 0, null];
    for(let i = 0; i < grid.length; i++) {
        for(let j = 0; j < grid[0].length; j++) {
            if(grid[i][j][0] !== null) {
                coords = [i, j, grid[i][j][0]];
            }
        }
    }
    let letter = new Letter(coords[0], coords[1], coords[2], grid);
    let map = new Map(grid, ".canvas", letter);

    document.addEventListener("mousedown", letter.move.bind(letter));
}

async function updateData(letter) {
    let promise = gameInfo(link);
    promise.then((data) => {
        let grid = JSON.parse(data['game_grid']);
        let coords = [0, 0, null];
        for(let i = 0; i < grid.length; i++) {
            for(let j = 0; j < grid.length; j++) {
                if(grid[i][j][0] !== null) {
                    coords = [i, j, grid[i][j][0]];
                }
            }
        }
        letter.x = coords[0];
        letter.y = coords[1];
        letter.value = coords[2];
        console.log("update:", letter.x, letter.y);
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
function Letter(x = 0, y = 0, value="а", grid) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.grid = grid;
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

        this.grid[this.x][this.y][0] = null;
        document.addEventListener("mouseup", mouseUpEvent.bind(this, handler), {once: true});
        document.addEventListener("mousemove", handler);
    }
};

let mouseUpEvent = async function (handler) {
    document.removeEventListener("mousemove", handler);
    await changePosition(this);
    this.updateInterval = await setInterval(updateData, 1000, this);
};

async function changePosition(letter) {
    console.log("change:", letter.x, letter.y);
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


let mouseMoveEvent = function (e) {
    this.x = Math.floor(e.x / SCALE);
    this.y = Math.floor(e.y / SCALE);
    console.log("draw:", this.x, this.y);
};


////// MAP ///////

function Map(grid, canvas, letter) {
    this.grid = grid;
    this.canvas = document.querySelector(canvas);
    this.ctx = this.canvas.getContext("2d");
    setInterval(this.draw.bind(this), 10, letter);
}

Map.prototype.draw = function (letter) {
    this.ctx.canvas.width  = SIZE;
    this.ctx.canvas.height = SIZE;
    this.ctx.clearRect(0, 0, SIZE, SIZE);
    this.drawGrid();
    this.drawLetter(letter);
};

Map.prototype.drawGrid = function() {
    for (let x = 0; x <= WIDTH; x++) {
        this.ctx.moveTo(x * SCALE, 0);
        this.ctx.lineTo(x * SCALE, SIZE);
        this.ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
        this.ctx.moveTo(0, y * SCALE);
        this.ctx.lineTo(SIZE, y * SCALE);
        this.ctx.stroke();
    }
};

Map.prototype.drawLetter = function(letter) {
    this.ctx.beginPath();
    this.ctx.rect(letter.x * SCALE, letter.y * SCALE, SCALE, SCALE);
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.stroke();
};