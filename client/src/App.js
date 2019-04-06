import React, { Component } from 'react';
import './App.css';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 512;
const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;

class Player {
  constructor(ctx, game) {
    this.ctx = ctx;
    this.game = game;
    // pozisyon degerleri
    this.x = 100;
    this.y = 100;
    this.targetX = 100;
    this.targetY = 100;
    this.dirx = 0;
    this.diry = 0;

    // oyun ici dinamikler
    this.health = 100;
    this.coins = 0;
    this.bullets = 0;
    this.medkits = 0;
  }

  // guncelleme ve ekrana yazdirma
  update = () => {
    this.targetX += this.dirx * 5
    this.targetY += this.diry * 5
    this.x = this.x + (this.targetX - this.x) * 0.50;
    this.y = this.y + (this.targetY - this.y) * 0.50;
  };

  draw = () => {
    this.ctx.drawImage(
      this.game.images.user0, 0, 0, TILE_WIDTH, TILE_HEIGHT,
      this.x, this.y,
      TILE_WIDTH, TILE_HEIGHT);
  };
};

class Game {
  constructor(ctx) {
    console.log('init');
    this.ctx = ctx;

    this.images = {};
    this.layers = [
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1
      ]
    ];
    this.players = [
      new Player(ctx, this)
    ];
  }

  init = async () => {
    console.log('load');
    const tile0 = await this.loadImage('./assets/layers/0.png');
    const tile1 = await this.loadImage('./assets/layers/1.png');
    const user0 = await this.loadImage('./assets/users/0.png');
    this.images = {
      user0: user0,
      0: tile0,
      1: tile1,
    }

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  };

  onKeyDown = event => {
    const keyCode = event.keyCode;
    // LEFT
    if (keyCode === 37) {
      this.players[0].dirx = -1;
    }
    // RIGHT
    else if (keyCode === 39) {
      this.players[0].dirx = 1;
    }
    // UP
    if (keyCode === 38) {
      this.players[0].diry = -1;
    }
    // DOWN
    else if (keyCode === 40) {
      this.players[0].diry = 1;
    }
  }

  onKeyUp = event => {
    const keyCode = event.keyCode;
    // LEFT - right
    if (keyCode === 37 || keyCode === 39) {
      this.players[0].dirx = 0;
    }
    // UP - down
    if (keyCode === 38 || keyCode === 40) {
      this.players[0].diry = 0;
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
    for (var m = 0; m < this.players.length; m++) {
      const player = this.players[m];
      player.update();
    }
  }

  draw = () => {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cols = CANVAS_WIDTH / TILE_WIDTH;
    const rows = CANVAS_HEIGHT / TILE_HEIGHT;
    for (var i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      for (var j = 0; j < rows; j++) {
        for (var k = 0; k < cols; k++) {
          const imageType = layer[j * cols + k];
          this.ctx.drawImage(
            this.images[imageType], 0, 0, TILE_WIDTH, TILE_HEIGHT,
            k * TILE_WIDTH, j * TILE_HEIGHT,
            TILE_WIDTH, TILE_HEIGHT);
        }
      }
    }
    // this.users.forEach(user => user.draw());

    for (var m = 0; m < this.players.length; m++) {
      const player = this.players[m];
      player.draw();
    }
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
    if (!this.state.isGameRunning) {
      this.game = new Game(this.getCtx());
      await this.game.init();
      this.loop();
    }
    this.setState(state => ({isGameRunning: !state.isGameRunning}));
  }

  loop = () => {
    requestAnimationFrame(() => {
      const now = Date.now();
      // if (now - this.lastLoop > (1000 / 30))
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
    return (
      <div style={{height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black'}}>
        <button onClick={this.start}>START!</button>
        <canvas ref={this.canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        </canvas>
      </div>
    );
  }
}

export default App;
