import 'phaser';
import './style.css';
import { MainScene } from './game/game';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 2000 },
      debug: false
    }
  },
  scene: [MainScene]
};

new Phaser.Game(config);

