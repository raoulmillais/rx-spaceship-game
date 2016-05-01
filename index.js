const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;

const config = {
  starSpeed: 40,
  starCount: 250,
  spaceColor: '#000',
  starColor: '#fff',
  playerYPos: canvas.height - 30,
  playerColor: '#f00',
  playerShotFrequency: 200,
  playerShotColor: '#ff0',
  shotSpeed: 15,
  enemyFrequency: 1500,
  enemyShootFrequency: 750,
  enemyColor: '#0f0',
  enemyShotColor: '#0ff'
};

function createStar() {
  return {
    x: parseInt(Math.random() * canvas.width),
    y: parseInt(Math.random() * canvas.height),
    size: Math.random() * 2 + 1
  };
}

function moveStar(star) {
  if (star.y >= canvas.height) star.y = 0;
  star.y += 3;
}

function paintSpace() {
  ctx.fillStyle = config.spaceColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function paintStars(stars) {
  paintSpace();
  ctx.fillStyle = config.starColor;
  stars.forEach(star => ctx.fillRect(star.x, star.y, star.size, star.size));
}

function createStarStream() {
  return Rx.Observable.range(1, config.starCount)
    .map(createStar).toArray()
    .flatMap(stars => Rx.Observable.interval(config.starSpeed).map(() => {
      stars.forEach(moveStar);
      return stars;
    }));
}

function drawTriangle(x, y, width, color, direction) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - width, y);
  ctx.lineTo(x, direction === 'up' ? y - width : y + width);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x - width, y);
  ctx.fill();
}

// PLAYERS
function paintPlayer(player) {
  drawTriangle(player.x, player.y, 20, config.playerColor, 'up');
}

function createPlayerStream() {
  return Rx.Observable.fromEvent(document, 'mousemove')
    .map(ev => ({x: ev.clientX, y: config.playerYPos}))
    .startWith({x: canvas.width / 2, y: config.playerYPos});
}

function paintShots(shots, direction) {
  shots.forEach(shot => {
    direction === 'up'
      ? shot.y -= config.shotSpeed
      : shot.y += config.shotSpeed;

    drawTriangle(shot.x, shot.y, 5, config.playerShotColor, direction);
  });
}

function createPlayerShotStream(player$) {
  const canvasClick$ = Rx.Observable.fromEvent(canvas, 'click');
  const spaceBarPress$ = Rx.Observable.fromEvent(document, 'keydown')
    .filter(ev => ev.keycode === 32);
  const playerFiring$ = Rx.Observable.merge(canvasClick$, spaceBarPress$)
    .sample(config.playerShotFrequency)
    .timestamp();

  return Rx.Observable.combineLatest(playerFiring$, player$,
      (fireEvents, player) => ({ timestamp: fireEvents.timestamp, x: player.x }))
    .distinctUntilChanged(shot => shot.timestamp)
    .scan((shots, shot) => {
      shots.push({x: shot.x, y: config.playerYPos});
      return shots;
    }, []).startWith([]);
}

function createEnemy() {
  return {
    x: parseInt(Math.random() * canvas.width),
    y: -30,
    shots: []
  };
}

function paintEnemies(enemies) {
  enemies.forEach(enemy => {
    enemy.y += 5;
    enemy.x += Math.floor(Math.random() * (15 - -15 + 1)) + -15;

    if (!enemy.isDead) {
      drawTriangle(enemy.x, enemy.y, 20, config.enemyColor, 'down');
    }

    paintShots(enemy.shots, 'down');
  });
}

function shotIsVisible(shot) {
  return shot.x > -40 && shot.x < canvas.width + 40 &&
    shot.y > -40 && shot.y < canvas.height + 40;
}

function collision(target1, target2) {
  return (target1.x > target2.x - 20 && target1.x < target2.x + 20) &&
    (target1.y > target2.y -20 && target1.y < target2.y + 20);
}

function createEnemyStream() {
  return Rx.Observable.interval(config.enemyFrequency)
    .scan(enemies => {
      const enemy = createEnemy();

      Rx.Observable.interval(config.enemyShootFrequency).subscribe(() => {
        enemy.shots.push({ x: enemy.x, y: enemy.y });
        enemy.shots = enemy.shots.filter(shotIsVisible);
      });

      enemies.push(enemy);
      return enemies;
    }, []);
}


// COORDINATION
function createGameStream() {
  const star$ = createStarStream();
  const player$ = createPlayerStream();
  const enemies$ = createEnemyStream();
  const playerShots$ = createPlayerShotStream(player$);

  return Rx.Observable.combineLatest(star$, player$, enemies$, playerShots$,
      (stars, player, enemies, playerShots) =>
        ({stars, player, enemies, playerShots}))
    .sample(config.starSpeed);
}


// MAIN LOOP
function paintScene(actors) {
  paintStars(actors.stars);
  paintPlayer(actors.player);
  paintEnemies(actors.enemies);
  paintShots(actors.playerShots, 'up');
}

const game$ = createGameStream();

game$.subscribe(paintScene);
