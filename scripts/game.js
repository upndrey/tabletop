let link = null;
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
    console.log(link, login);
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
    console.log(data);
    let grid = JSON.parse(data['game_grid']);
    let link = data['link'];
    let w = 900;
    let h = 1000;
    let canvas = document.querySelector(".canvas");
    let ctx = canvas.getContext('2d');
    let coords = [0, 0, null];
    for(let i = 0; i < grid.length; i++) {
        for(let j = 0; j < grid[0].length; j++) {
            if(grid[i][j][0] !== null) {
                coords = [i, j, grid[i][j][0]];
            }
        }
    }
    let ball = new Ball(w/30, coords[0], coords[1], w/15, coords[2], grid);
    document.addEventListener("mousedown", ball.move.bind(ball));
    setInterval(draw.bind(this, canvas, ctx, ball, w, h), 10);
    setInterval(updateData.bind(this, ball), 15000);
}
async function updateData(ball) {
    let promise = gameInfo(link);
    promise.then((data) => {
        let grid = JSON.parse(data['game_grid']);
        let coords = [0, 0, null];
        for(let i = 0; i < grid.length; i++) {
            for(let j = 0; j < grid[0].length; j++) {
                if(grid[i][j][0] !== null) {
                    coords = [i, j, grid[i][j][0]];
                }
            }
        }
        ball.x = coords[0];
        ball.y = coords[1];
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

function Ball(Radius = 20, x = 0, y = 0, scale=50, value="а", grid) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.r = Radius;
    this.value = value;
    this.grid = grid;
}

Ball.prototype.move = function (e) {
    if(
        e.x >= (this.x - this.r) * this.scale &&
        e.x <= (this.x + this.r) * this.scale &&
        e.y >= (this.y - this.r) * this.scale &&
        e.y <= (this.y + this.r) * this.scale
    ) {
        let handler = mouseMoveEvent.bind(this);

        this.grid[this.x][this.y][0] = null;
        document.addEventListener("mousemove", handler);
        document.addEventListener("mouseup", mouseUpEvent.bind(this, handler), {once: true});
    }
};

let mouseUpEvent = async function (handler) {
    this.r = 20;
    await changePosition(this);
    await document.removeEventListener("mousemove", handler);
};

async function changePosition(ball) {
    ball.grid[ball.x][ball.y][0] = ball.value;
    let formData = new FormData();
    formData.append('link', link);
    formData.append('grid', JSON.stringify(ball.grid));
    formData.append('data', 'position');
    let url = "http://tabletop/php/changeData.php";
    let response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await response.json();
}


let mouseMoveEvent = function (e) {
    let size = 900 / 15;
    this.r = size / 2;
    if(e.y < 800 && e.x > 0 && e.x < 900) {
        this.x = Math.floor(e.x / size) * size;
        this.y = Math.floor(e.y / size) * size;
    }
    else if(e.y < 875 && e.x > 25 && e.x < 975){
        this.x = e.x;
        this.y = e.y;
    }
    this.x = this.x / this.scale;
    this.y = this.y / this.scale;
};

function draw(canvas, ctx, ball, w, h) {
    ctx.canvas.width  = w;
    ctx.canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);
    drawBall(ctx, ball);
}

function drawGrid(ctx, w, h) {
    for (let x=0; x<=w; x+= w/15) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 100);
        ctx.stroke();
    }
    for (let y=0; y <= h - 100; y += (h - 100)/15) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}

function drawBall(ctx, ball) {
    ctx.beginPath();
    ctx.arc(ball.x * ball.scale + ball.r, ball.y * ball.scale + ball.r, ball.r, 0, 2 * Math.PI, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FF0000';
    ctx.stroke();
}