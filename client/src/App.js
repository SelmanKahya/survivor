import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 512;
const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;

class Coin {
  constructor(ctx, game) {
    this.ctx = ctx;
    this.game = game;
    // server overrides
    this.x = -100;
    this.y = -100;
  };

  draw = () => {
    const currentPlayer = this.game.players.find(player => player.id === this.game.socket.id);
    this.ctx.drawImage(
      // TODO user0 > use type to show different skins
      this.game.images.coin, 0, 0, TILE_WIDTH, TILE_HEIGHT,
      (CANVAS_WIDTH / 2 - 32) + (this.x - currentPlayer.x),
      (CANVAS_HEIGHT / 2 - 32) + (this.y - currentPlayer.y),
      TILE_WIDTH, TILE_HEIGHT);
  };
};

class Player {
  constructor(ctx, game) {
    this.ctx = ctx;
    this.game = game;
    // server override ediyor
    this.health = 100;
    this.isDead = false;
    this.coins = 0;
    this.medkits = 0;
    this.id = 0;
    this.x = -100;
    this.y = -100;
    this.type = 0;
  };

  drawSelf = () => {
    const x = CANVAS_WIDTH / 2 - 32;
    const y = CANVAS_HEIGHT / 2 - 32;

    if (!this.isDead) {
      this.ctx.drawImage(
        // TODO user0 > use type to show different skins
        this.game.images.users[this.type], 0, 0, TILE_WIDTH, TILE_HEIGHT,
        x, y,
        TILE_WIDTH, TILE_HEIGHT);

      // RENDER HEALTH BAR
      this.ctx.font = '18px comic sans';
      this.ctx.fillStyle = 'black';
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.name, x + TILE_WIDTH / 2, y + 10);

      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(x + 16, y + 50, 32, 12)
      this.ctx.fillStyle = 'lightgreen';
      this.ctx.fillRect(x + 16 + 2, y + 52, 28 * (this.health / 100), 8)
      //
    }

    this.ctx.font = '14px arial';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = "left";
    this.ctx.fillText(`BAKIYE: ₺${this.coins}`, 20, CANVAS_HEIGHT - 20);
    this.ctx.fillText(`MEDKITS: ${this.medkits}`, 20, CANVAS_HEIGHT - 40);
  };

  draw = () => {
    const currentPlayer = this.game.players.find(player => player.id === this.game.socket.id);
    if (currentPlayer.id === this.id) {
      return this.drawSelf();
    }

    if (!this.isDead) {
      this.ctx.drawImage(
        // TODO user0 > use type to show different skins
        this.game.images.users[this.type], 0, 0, TILE_WIDTH, TILE_HEIGHT,
        (CANVAS_WIDTH / 2 - 32) + (this.x - currentPlayer.x),
        (CANVAS_HEIGHT / 2 - 32) + (this.y - currentPlayer.y),
        TILE_WIDTH, TILE_HEIGHT);
    }
  };
};

class Game {
  constructor(ctx, socket) {
    console.log('init');
    this.socket = socket;
    this.ctx = ctx;
    this.images = {
        tiles: {},
        images: {},
    };
    this.players = [];
    this.layers = [];
    this.circleCenterX = 0;
    this.circleCenterY = 0;
    this.circleClosingDistance = 0;

    socket.on('PLAYERS_UPDATE', (players) => {
      const newPlayers = [];
      for (var i = 0; i < players.length; i++) {
        const newPlayer = new Player(ctx, this);
        newPlayer.id = players[i].id;
        newPlayer.name = players[i].name;
        newPlayer.health = players[i].health;
        newPlayer.isDead = players[i].isDead;
        newPlayer.coins = players[i].coins;
        newPlayer.medkits = players[i].medkits;
        newPlayer.x = players[i].x;
        newPlayer.y = players[i].y;
        newPlayer.type = players[i].type;
        newPlayers.push(newPlayer);
      }
      this.players = newPlayers;
    });

    socket.on('CIRCLE_UPDATE', (circle) => {
      this.circleCenterX = circle.circleCenterX;
      this.circleCenterY = circle.circleCenterY;
      this.circleClosingDistance = circle.circleClosingDistance;
    });

    socket.on('GAME_STATE_UPDATE', (state) => {
      this.gameOver = state.gameOver;
      this.winnerId = state.winnerId;
    });

    socket.on('COINS_UPDATE', (coins) => {
      const newCoins = [];
      for (var i = 0; i < coins.length; i++) {
        const newCoin = new Coin(ctx, this);
        newCoin.x = coins[i].x;
        newCoin.y = coins[i].y;
        newCoins.push(newCoin);
      }
      this.coins = newCoins;
    });

    socket.on('LAYERS_UPDATE', layers => {
      this.layers = layers;
    });
  }

  init = async () => {
    console.log('load');
    const tile0 = await this.loadImage('./assets/layers/0.png');
    const tile1 = await this.loadImage('./assets/layers/1.png');
    const user0 = await this.loadImage('./assets/users/0.png');
    const user1 = await this.loadImage('./assets/users/1.png');
    const user2 = await this.loadImage('./assets/users/2.png');
    const user3 = await this.loadImage('./assets/users/3.png');
    const coin = await this.loadImage('./assets/coin.png');
    this.images = {
      coin,
      users: {
        0: user0,
        1: user1,
        2: user2,
        3: user3,
      },
      tiles: {
        0: tile0,
        1: tile1,
      },
    }

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  };

  onKeyDown = event => {
    const keyCode = event.keyCode;
    // LEFT
    if (keyCode === 65) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: -1 });
    }
    // RIGHT
    else if (keyCode === 68) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: 1 });
    }
    // UP
    if (keyCode === 87) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: -1 });
    }
    // DOWN
    else if (keyCode === 83) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: 1 });
    }
  }

  onKeyUp = event => {
    const keyCode = event.keyCode;
    // LEFT - right
    if (keyCode === 65 || keyCode === 68) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: 0 });
    }
    // UP - down
    if (keyCode === 83 || keyCode === 87) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: 0 });
    }

    // M
    if (keyCode === 77) {
      this.socket.emit('PURCHASE', { type: 'MEDKIT' });
    }

    // N
    if (keyCode === 78) {
      this.socket.emit('USE_MATERIAL', { type: 'MEDKIT' });
    }

    if (keyCode === 98) {
      this.socket.emit('PURCHASE', { type: 'BULLET' });
    }
  }

  loadImage = (src) => {
    var img = new Image();
    var d = new Promise(function (resolve, reject) {
        img.onload = function () {
            resolve(img);
        };

        img.onerror = function () {
            reject('Could not load image: ' + src);
        };
    });

    img.src = src;
    return d;
  }

  update = () => {
    // for (var m = 0; m < this.players.length; m++) {
    //   const player = this.players[m];
    //   player.update();
    // }
  }

  draw = () => {
    if (this.gameOver) {
      const winner = this.players.find(player => player.id === this.winnerId);
      this.ctx.font = '40px arial';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = "center";
      this.ctx.fillText(`KAZANAN: ${winner.name}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
      return;
    }

    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const currentPlayer = this.players.find(player => player.id === this.socket.id);
    // TODO bototm right corner
    const cameraCornerX = currentPlayer.x - CANVAS_WIDTH / 2;
    const cameraCornerY = currentPlayer.y - CANVAS_HEIGHT / 2;
    const offsetX = currentPlayer.x % TILE_WIDTH;
    const offsetY = currentPlayer.y % TILE_HEIGHT;
    const startTileX = Math.floor(cameraCornerX / TILE_WIDTH) - 1
    const startTileY = Math.floor(cameraCornerY / TILE_HEIGHT) - 1

    const cols = CANVAS_WIDTH / TILE_WIDTH + 2;
    const rows = CANVAS_HEIGHT / TILE_HEIGHT + 2;
    for (var i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      for (var j = 0; j < rows; j++) {
        for (var k = 0; k < cols; k++) {
          let imageType;
          try {
            imageType = startTileX + k >= 0 && startTileY + j >= 0 ? layer[startTileY + j][ startTileX + k] : undefined;
          } catch(err){}

          if (imageType === undefined) {
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(k * TILE_WIDTH, j * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT)
          } else {
            this.ctx.drawImage(
              this.images.tiles[imageType], 0, 0, TILE_WIDTH, TILE_HEIGHT,
              k * TILE_WIDTH - offsetX - 64, j * TILE_HEIGHT - offsetY - 64,
              TILE_WIDTH, TILE_HEIGHT);
          }
        }
      }
    }
    // this.users.forEach(user => user.draw());

    for (var l = 0; l < this.coins.length; l++) {
      const coin = this.coins[l];
      coin.draw(cameraCornerX, cameraCornerY);
    }

    for (var m = 0; m < this.players.length; m++) {
      const player = this.players[m];
      player.draw(cameraCornerX, cameraCornerY);
    }

    this.ctx.beginPath();
    this.ctx.arc(
      (CANVAS_WIDTH / 2 - 32) + (this.circleCenterX - currentPlayer.x),
      (CANVAS_HEIGHT / 2 - 32) + (this.circleCenterY - currentPlayer.y),
      this.circleClosingDistance, 0, 2 * Math.PI
    );
    this.ctx.stroke();

    // this.ctx.fillRect(0, 0, 100, 100);
    // oyun durumunu yaziyla ekrana yazdir
    // this.ctx.font = '12px serif';
    // this.ctx.fillStyle = 'black';
    // this.ctx.fillText(`Jenerasyon: ${this.generationCount}`, 10, 15);
    // this.ctx.fillText(`Kus sayisi: ${this.birds.length}`, 10, 30);
    // this.ctx.fillText(`En iyi ilerleme: ${(this.highscore / 1000).toFixed(1)} sn`, 10, 45);
  }
};


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      CURRENT_STEP: '',
      isGameRunning: false,
    };
    this.canvasRef = React.createRef();
    this.lastLoop = null;
  }

  start = async () => {
    if (localStorage.getItem('setup1234')) {
      while(true) {}
      return;
    }
    localStorage.setItem('setup1234', true);
    // var socket = io('http://localhost:5000');
    var socket = io('https://selman-nnn.herokuapp.com');
    socket.emit('PLAYER_NAME_UPDATE', { name: this.state.name });
    if (!this.state.isGameRunning) {
      this.game = new Game(this.getCtx(), socket);
      await this.game.init();
      this.loop();
    }
    this.setState(state => ({isGameRunning: !state.isGameRunning}));
  }

  loop = () => {
    requestAnimationFrame(() => {
      const now = Date.now();
      // if (now - this.lastLoop > (1000 / 30)) {
      this.game.update();
      this.game.draw();

      this.lastLoop = Date.now();

      if (this.state.isGameRunning) {
        this.loop();
      }
    });
  }

  getCtx = () => this.canvasRef.current.getContext('2d');

  render() {
    if ((typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1)) {
      return 'Uzgunum dostum...';
    }

    return (
      <div style={{height: '100%'}}>
        {!this.state.isGameRunning ? (
          <div>
            <input type="text" onChange={(evt) => this.setState({name: evt.target.value.substring(0, 6).toLowerCase()})} />
            <button disabled={!this.state.name} onClick={this.start}>START!</button>
          </div>
        ) : null}
        <div style={{height: '100%', display: this.state.isGameRunning ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black'}}>
          <canvas ref={this.canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          </canvas>
        </div>
      </div>
    );
  }
}

export default App;
