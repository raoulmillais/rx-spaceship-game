interface Config {
  starSpeed: number,
  starCount: number,
  spaceColor: string,
  playerColor: string,
  playerShotFrequency: number,
  playerShotColor: string,
  pointsPerHit: number,
  playerYPos?: number,
  shotSpeed: number,
  enemyShootFrequency: number,
  enemyColor: string,
  enemyShotColor: string
};

const config = {
  starSpeed: 40,
  starCount: 250,
  spaceColor: '#000',
  starColor: '#fff',
  playerColor: '#f00',
  playerShotFrequency: 200,
  playerShotColor: '#ff0',
  pointsPerHit: 10,
  playerYPos: null,
  shotSpeed: 15,
  enemyFrequency: 1500,
  enemyShootFrequency: 750,
  enemyColor: '#0f0',
  enemyShotColor: '#0ff'
};

export default config;
