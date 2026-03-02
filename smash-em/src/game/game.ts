import * as Phaser from 'phaser';
import { Player } from '../entities/player';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.platforms = this.physics.add.staticGroup();

    const ground = this.add.rectangle(400, 550, 800, 100, 0x654321);
    this.platforms.add(ground);

    const grass = this.add.rectangle(400, 500, 800, 20, 0x3CB371);
    this.platforms.add(grass);

    this.player = new Player(this, 380, 200);

    this.physics.add.collider(this.player, this.platforms);
  }

  update() {
    this.player.update();
  }
}

