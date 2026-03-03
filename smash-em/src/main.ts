import 'phaser';
import './style.css';
import { MainScene } from './game/game';
import { MenuScene } from './game/menu';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#0f0c29',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 2000 },
      debug: false
    }
  },
  scene: [MenuScene, MainScene]
};

new Phaser.Game(config);

