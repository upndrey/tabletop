/*
{
    'grid': [
        [[null, 3], [null, 2], [null, 3]],
        [[null, 2], [null, 1], [null, 2]],
        [[null, 3], [null, 2], [null, 3]],
    ],
    'players': [
        [id, login],
        [id, login],
        [id, login],
        [id, login]
    ],
    'status': 'lobby'|'game'|'closed',
    'turn'
}
*/

document.addEventListener("DOMContentLoaded", async () => {
    let link = window.location.search.substring(1);
    let promise = gameInfo(link);
    promise.then((data) => {
        if(data) {
            let w = 1000;
            let h = 900;
            let canvas = document.querySelector(".canvas");
            let ctx = canvas.getContext('2d');
            let ball = new Ball(20);
            document.addEventListener("mousedown", ball.move.bind(ball));
            setInterval(draw.bind(this, canvas, ctx, ball, w, h), 10);
        }
    });
});

async function gameInfo(link) {
    let formData = new FormData();
    formData.append('link', link);
    let url = "http://tabletop/php/getData.php";
    let response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    return await response.json();
}

function Ball(Radius) {
    this.x = 25;
    this.y = 25;
    this.r = Radius;
}

Ball.prototype.move = function (e) {
    if(
        e.x >= this.x - this.r &&
        e.x <= this.x + this.r &&
        e.y >= this.y - this.r &&
        e.y <= this.y + this.r
    ) {
        let handler = mouseMoveEvent.bind(this);
        document.addEventListener("mousemove", handler);
        document.addEventListener("mouseup", mouseUpEvent.bind(this, handler), {once: true});
    }
};

let mouseUpEvent = function (handler) {
    document.removeEventListener("mousemove", handler);
};

let mouseMoveEvent = function (e) {

    if(e.y < 800 && e.x > 0 && e.x < 1000) {
        this.x = Math.floor(e.x / 50) * 50 + 25;
        this.y = Math.floor(e.y / 50) * 50 + 25;
    }
    else if(e.y < 875 && e.x > 25 && e.x < 975){
        this.x = e.x;
        this.y = e.y;
    }
};

function draw(canvas, ctx, ball, w, h) {
    ctx.canvas.width  = w;
    ctx.canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    for (let x=0; x<=w; x+=50) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 100);
        ctx.stroke();
    }
    for (let y=0; y<=h - 100; y+=50) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    drawBall(ctx, ball);
}

function drawBall(ctx, ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FF0000';
    ctx.stroke();
}