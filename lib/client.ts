import config from './config';
import * as Rx from 'rx';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;

config.playerYPos = canvas.height - 30;

interface Star { x: number, y: number, size: number };

function createStar() : Star {
  return {
    x: Math.round(Math.random() * canvas.width),
    y: Math.round(Math.random() * canvas.height),
    size: Math.random() * 2 + 1
  };
}

function moveStar(star) : void {
  if (star.y >= canvas.height) { star.y = 0; }
  star.y += star.size;
}

function paintSpace() : void {
  ctx.fillStyle = config.spaceColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function paintStars(stars) : void {
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

// PLAYER & ENEMIES
function paintPlayer(player) {
  drawTriangle(player.x, player.y, 20, config.playerColor, 'up');
}

function createPlayerStream() {
  return Rx.Observable.fromEvent(document, 'mousemove')
    .map(ev => ({x: ev.clientX, y: config.playerYPos}))
    .startWith({x: canvas.width / 2, y: config.playerYPos});
}

function checkTargetCollisions(shot, targets) {
  let hit = false;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    if (target && !target.isDead && collision(shot, target)) {
      target.isDead = true;
      hit = true;
      break;
    }
  }

  return hit;
}

function paintShots(shots, targets, direction) {
  shots.forEach(shot => {
    if (checkTargetCollisions(shot, targets)) {
      shot.x = shot.y = -100;
    }

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
    x: Math.round(Math.random() * canvas.width),
    y: -30,
    shots: []
  };
}

function paintEnemies(enemies, player) {
  enemies.forEach(enemy => {
    enemy.y += 5;
    enemy.x += Math.floor(Math.random() * (15 - -15 + 1)) + -15;

    if (!enemy.isDead) {
      drawTriangle(enemy.x, enemy.y, 20, config.enemyColor, 'down');
    }

    paintShots(enemy.shots, [player], 'down');
  });
}

function shotIsVisible(shot) {
  return shot.x > -40 && shot.x < canvas.width + 40 &&
    shot.y > -40 && shot.y < canvas.height + 40;
}

function collision(target1, target2) {
  const result = (target1.x > target2.x - 20 && target1.x < target2.x + 20) &&
    (target1.y > target2.y -20 && target1.y < target2.y + 20);
  return result;
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
    .sample(config.starSpeed)
    .takeWhile(actors => !actors.player.isDead);
}


// MAIN LOOP
function paintScene(actors) {
  paintStars(actors.stars);
  paintPlayer(actors.player);
  paintEnemies(actors.enemies, actors.player);
  paintShots(actors.playerShots, actors.enemies, 'up');
}

function paintStart() {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'regular 32px sans-serif';
  ctx.fillText('Click to start', canvas.width / 2, canvas.height / 2);
}

function paintGameOver() {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f00';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

paintStart();
const game$ = createGameStream();

game$.subscribe(paintScene, console.error, paintGameOver);
